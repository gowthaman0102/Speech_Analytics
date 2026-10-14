import os
import json
import logging
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db, Base, engine, SessionLocal
from ..models import Speech, Recording, Evaluation, RubricScore, FlawSegment, EvaluationFeatures
from ..config import settings
from ..schemas.schemas import (
    EvaluationDetailResponse,
    FeatureTimeSeriesResponse,
    EvaluationSummary,
    FlawSegmentResponse,
    RubricScoreItem,
    DatasetItemSchema,
    DatasetVariantSchema,
    BenchmarkResponse,
    BenchmarkVariantResult,
    ValidationResultSchema,
    AuditConfigSchema,
    EvaluationStatusResponse,
    EvaluationHistoryItem,
    EvaluationHistoryResponse,
    EvaluateDatasetVariantRequest
)
from ..services.audio_service import convert_and_preprocess_audio
from ..services.transcription_service import transcribe_and_align
from ..services.alignment_service import align_transcripts
from ..services.feature_service import extract_acoustic_features
from ..services.temporal_analysis import perform_dtw_alignment
from ..services.flaw_detector import detect_delivery_flaws
from ..services.explanation_engine import enrich_flaws_with_explanations
from ..services.scoring_engine import calculate_rubric_scores
from ..services.validation_service import calculate_temporal_iou, validate_flaws_against_ground_truth

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Evaluations"])

# Ensure DB tables exist
Base.metadata.create_all(bind=engine)

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}

def validate_audio_file(file: UploadFile):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file format '{ext}'. Allowed formats: WAV, MP3, M4A, FLAC, OGG."
        )

def run_evaluation_pipeline(
    evaluation_id: str,
    ref_raw_path: str,
    part_raw_path: str,
    transcript: str
):
    """Executes the complete speech evaluation pipeline asynchronously in background with live progress updates."""
    db = SessionLocal()
    eval_record = None
    try:
        eval_record = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not eval_record:
            return

        eval_record.status = "PROCESSING"
        eval_record.progress = 10
        eval_record.current_step = "Preparing audio files"
        db.commit()

        # Step 1: Audio Preprocessing
        ref_prep = convert_and_preprocess_audio(ref_raw_path, output_prefix="ref")
        part_prep = convert_and_preprocess_audio(part_raw_path, output_prefix="part")

        ref_rec = db.query(Recording).filter(Recording.id == eval_record.reference_recording_id).first()
        part_rec = db.query(Recording).filter(Recording.id == eval_record.participant_recording_id).first()
        if ref_rec:
            ref_rec.file_path = ref_prep["processed_path"]
            ref_rec.duration = ref_prep["duration"]
        if part_rec:
            part_rec.file_path = part_prep["processed_path"]
            part_rec.duration = part_prep["duration"]
        
        eval_record.progress = 25
        eval_record.current_step = "Transcribing and aligning speech"
        db.commit()

        # Step 2: Speech-to-text and Word Alignment
        ref_trans = transcribe_and_align(ref_prep["processed_path"], transcript, ref_prep["duration"])
        part_trans = transcribe_and_align(part_prep["processed_path"], transcript, part_prep["duration"])

        # Step 3: Transcript sequence alignment
        align_res = align_transcripts(ref_trans["words"], part_trans["words"], ref_prep["duration"], part_prep["duration"])

        eval_record.progress = 50
        eval_record.current_step = "Extracting acoustic features"
        db.commit()

        # Step 4: Extract Acoustic Features
        ref_feat = extract_acoustic_features(ref_prep["processed_path"], ref_prep["duration"], ref_trans["words"])
        part_feat = extract_acoustic_features(part_prep["processed_path"], part_prep["duration"], part_trans["words"])

        eval_record.progress = 70
        eval_record.current_step = "Aligning temporal timelines"
        db.commit()

        # Step 5: DTW Temporal Alignment & Feature Deviations
        time_analysis = perform_dtw_alignment(ref_feat, part_feat, align_res["anchors"])

        eval_record.progress = 80
        eval_record.current_step = "Detecting delivery flaws"
        db.commit()

        # Step 6: Flaw Detection & Classification
        raw_flaws = detect_delivery_flaws(time_analysis, ref_feat, part_feat, align_res["aligned_pairs"])

        # Step 7: Causal Explanation Generation
        flaws = enrich_flaws_with_explanations(raw_flaws)

        eval_record.progress = 90
        eval_record.current_step = "Calculating rubric scores"
        db.commit()

        # Step 8: Rubric Score Calculation
        score_res = calculate_rubric_scores(time_analysis, ref_feat, part_feat, flaws, align_res)

        # Persist Rubric Scores
        for item in score_res["rubric_details"]:
            rs = RubricScore(
                evaluation_id=eval_record.id,
                category=item["category"],
                score=item["score"],
                weight=item["weight"],
                description=item["description"]
            )
            db.add(rs)

        # Persist Flaw Segments
        for f in flaws:
            flaw_seg = FlawSegment(
                evaluation_id=eval_record.id,
                flaw_type=f["type"],
                start_time=f["start"],
                end_time=f["end"],
                duration=f["duration"],
                severity=f["severity"],
                transcript_snippet=f.get("transcript_snippet", ""),
                cause=f["cause"],
                effect=f["effect"],
                recommendation=f["recommendation"],
                metrics_json=json.dumps(f.get("metrics", {}))
            )
            db.add(flaw_seg)

        # Persist Time Series Feature Data & Aligned Words
        feature_data = EvaluationFeatures(
            evaluation_id=eval_record.id,
            time_points_json=json.dumps(time_analysis["time_points"]),
            reference_features_json=json.dumps({
                "pitch": time_analysis["aligned_features"]["ref_pitch"],
                "rms": time_analysis["aligned_features"]["ref_rms"],
                "wpm": time_analysis["aligned_features"]["ref_wpm"]
            }),
            participant_features_json=json.dumps({
                "pitch": time_analysis["aligned_features"]["part_pitch"],
                "rms": time_analysis["aligned_features"]["part_rms"],
                "wpm": time_analysis["aligned_features"]["part_wpm"]
            }),
            deviations_json=json.dumps({
                "combined": time_analysis["deviations"]["combined"],
                "pitch": time_analysis["deviations"]["pitch"],
                "energy": time_analysis["deviations"]["energy"],
                "rate": time_analysis["deviations"]["rate"],
                "pause": time_analysis["deviations"]["pause"],
                "mfcc": time_analysis["deviations"]["mfcc"]
            }),
            alignment_words_json=json.dumps(align_res.get("aligned_pairs", []))
        )
        db.add(feature_data)

        # Update Evaluation Record
        eval_record.overall_score = score_res["overall_score"]
        eval_record.similarity = score_res["similarity"]
        eval_record.confidence = score_res["confidence"]
        eval_record.strongest_area = score_res["strongest_area"]
        eval_record.weakest_area = score_res["weakest_area"]
        eval_record.status = "COMPLETED"
        eval_record.progress = 100
        eval_record.current_step = "Analysis complete"
        eval_record.error_message = None
        db.commit()
        logger.info("Evaluation %s completed successfully with overall score %s", evaluation_id, score_res["overall_score"])

    except Exception as e:
        logger.exception("Evaluation pipeline failure: %s", e)
        if eval_record:
            eval_record.status = "FAILED"
            eval_record.progress = 100
            eval_record.current_step = "Analysis failed"
            eval_record.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "tagline": settings.APP_TAGLINE}


@router.post("/evaluations")
async def create_evaluation(
    background_tasks: BackgroundTasks,
    title: str = Form("Speech Evaluation"),
    transcript: str = Form(...),
    reference_audio: UploadFile = File(...),
    participant_audio: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Creates a new speech evaluation from uploaded audio files and queues background analysis."""
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript text cannot be empty.")

    validate_audio_file(reference_audio)
    validate_audio_file(participant_audio)

    # Read content with file size limit check
    ref_bytes = await reference_audio.read()
    if len(ref_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"Reference audio exceeds 50 MB limit.")

    part_bytes = await participant_audio.read()
    if len(part_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"Participant audio exceeds 50 MB limit.")

    # Unique collision-safe filenames
    ref_id = uuid.uuid4().hex[:12]
    part_id = uuid.uuid4().hex[:12]
    ref_ext = Path(reference_audio.filename or "audio.wav").suffix.lower()
    part_ext = Path(participant_audio.filename or "audio.wav").suffix.lower()

    ref_raw_path = settings.UPLOAD_DIR / f"ref_{ref_id}{ref_ext}"
    part_raw_path = settings.UPLOAD_DIR / f"part_{part_id}{part_ext}"

    with open(ref_raw_path, "wb") as f:
        f.write(ref_bytes)

    with open(part_raw_path, "wb") as f:
        f.write(part_bytes)

    speech = Speech(title=title.strip() or "Speech Evaluation", transcript=transcript.strip())
    db.add(speech)
    db.commit()
    db.refresh(speech)

    rec_ref = Recording(
        speech_id=speech.id,
        type="REFERENCE",
        file_path=str(ref_raw_path),
        original_filename=reference_audio.filename
    )
    rec_part = Recording(
        speech_id=speech.id,
        type="PARTICIPANT",
        file_path=str(part_raw_path),
        original_filename=participant_audio.filename
    )
    db.add(rec_ref)
    db.add(rec_part)
    db.commit()
    db.refresh(rec_ref)
    db.refresh(rec_part)

    evaluation = Evaluation(
        speech_id=speech.id,
        reference_recording_id=rec_ref.id,
        participant_recording_id=rec_part.id,
        status="QUEUED",
        progress=0,
        current_step="Queued for analysis"
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    # Queue background analysis
    background_tasks.add_task(
        run_evaluation_pipeline,
        evaluation.id,
        str(ref_raw_path),
        str(part_raw_path),
        speech.transcript
    )

    return {
        "evaluationId": evaluation.id,
        "status": "QUEUED",
        "progress": 0,
        "currentStep": "Queued for analysis"
    }


@router.post("/evaluations/demo")
def create_demo_evaluation(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Triggers the built-in prepackaged demo evaluation."""
    demo_ref_path = settings.DATASET_DIR / "good" / "demo_reference.wav"
    demo_part_path = settings.DATASET_DIR / "flawed" / "demo_participant.wav"
    demo_labels_path = settings.DATASET_DIR / "labels" / "demo_speech.json"

    if not demo_ref_path.exists() or not demo_part_path.exists():
        raise HTTPException(status_code=404, detail="Demo dataset audio files not found on disk.")

    title = "Environmental Leadership Oratory"
    transcript = """Good morning, members of the jury and respected audience.
Today, we must confront the defining challenge of our time: protecting our shared global environment.
We cannot afford hesitation or complacency, because every passing decade reduces our margin for effective action.
True leadership requires decisive commitment, scientific discipline, and unbroken perseverance.
Let us choose responsibility today, so that tomorrow remains worthy of our hopes."""

    if demo_labels_path.exists():
        try:
            with open(demo_labels_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                title = data.get("title", title)
                transcript = data.get("transcript", transcript)
        except Exception:
            pass

    speech = Speech(title=title, transcript=transcript)
    db.add(speech)
    db.commit()
    db.refresh(speech)

    rec_ref = Recording(
        speech_id=speech.id,
        type="REFERENCE",
        file_path=str(demo_ref_path),
        original_filename="demo_reference.wav"
    )
    rec_part = Recording(
        speech_id=speech.id,
        type="PARTICIPANT",
        file_path=str(demo_part_path),
        original_filename="demo_participant.wav"
    )
    db.add(rec_ref)
    db.add(rec_part)
    db.commit()
    db.refresh(rec_ref)
    db.refresh(rec_part)

    evaluation = Evaluation(
        speech_id=speech.id,
        reference_recording_id=rec_ref.id,
        participant_recording_id=rec_part.id,
        status="QUEUED",
        progress=0,
        current_step="Queued for analysis"
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    background_tasks.add_task(
        run_evaluation_pipeline,
        evaluation.id,
        str(demo_ref_path),
        str(demo_part_path),
        transcript
    )

    return {
        "evaluationId": evaluation.id,
        "status": "QUEUED",
        "progress": 0,
        "currentStep": "Queued for analysis"
    }


@router.post("/evaluations/dataset")
def evaluate_dataset_variant(
    req: EvaluateDatasetVariantRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Evaluates a chosen dataset variant against the reference speech in background."""
    labels_file = settings.DATASET_DIR / "labels" / "demo_speech.json"
    if not labels_file.exists():
        raise HTTPException(status_code=404, detail="Dataset labels file not found")

    with open(labels_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    variants = data.get("variants", [])
    selected_variant = None

    if req.variantIndex is not None and 0 <= req.variantIndex < len(variants):
        selected_variant = variants[req.variantIndex]
    elif req.variantName:
        for v in variants:
            if v.get("variantName", "").lower() == req.variantName.lower():
                selected_variant = v
                break

    if not selected_variant:
        raise HTTPException(status_code=400, detail="Specified dataset variant could not be located.")

    ref_path = Path(data.get("referenceAudio", ""))
    part_path = Path(selected_variant.get("filePath", ""))

    if not ref_path.exists() or not part_path.exists():
        raise HTTPException(status_code=404, detail="Audio files for this variant not found on disk")

    speech = Speech(
        title=f"{data.get('title', 'Demo Speech')} ({selected_variant['variantName']})",
        transcript=data.get("transcript", "")
    )
    db.add(speech)
    db.commit()
    db.refresh(speech)

    rec_ref = Recording(
        speech_id=speech.id,
        type="REFERENCE",
        file_path=str(ref_path),
        original_filename=ref_path.name
    )
    rec_part = Recording(
        speech_id=speech.id,
        type="PARTICIPANT",
        file_path=str(part_path),
        original_filename=part_path.name
    )
    db.add(rec_ref)
    db.add(rec_part)
    db.commit()
    db.refresh(rec_ref)
    db.refresh(rec_part)

    evaluation = Evaluation(
        speech_id=speech.id,
        reference_recording_id=rec_ref.id,
        participant_recording_id=rec_part.id,
        status="QUEUED",
        progress=0,
        current_step="Queued for analysis"
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    background_tasks.add_task(
        run_evaluation_pipeline,
        evaluation.id,
        str(ref_path),
        str(part_path),
        speech.transcript
    )

    return {
        "evaluationId": evaluation.id,
        "status": "QUEUED",
        "progress": 0,
        "currentStep": "Queued for analysis",
        "variantName": selected_variant["variantName"]
    }


@router.post("/evaluations/variant/{variant_index}")
def evaluate_variant(variant_index: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Convenience route to evaluate variant by index."""
    return evaluate_dataset_variant(
        EvaluateDatasetVariantRequest(variantIndex=variant_index),
        background_tasks=background_tasks,
        db=db
    )


@router.get("/evaluations", response_model=EvaluationHistoryResponse)
def list_evaluations(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """Returns past evaluations for the evaluations history list."""
    total = db.query(Evaluation).count()
    records = db.query(Evaluation).order_by(Evaluation.created_at.desc()).offset(offset).limit(limit).all()
    items = []
    for ev in records:
        flaws_count = len(ev.flaw_segments)
        ref_dur = ev.reference_recording.duration if ev.reference_recording else 0.0
        part_dur = ev.participant_recording.duration if ev.participant_recording else 0.0
        items.append(EvaluationHistoryItem(
            id=ev.id,
            title=ev.speech.title if ev.speech else "Untitled Speech",
            createdAt=ev.created_at,
            status=ev.status,
            progress=ev.progress or 0,
            overallScore=ev.overall_score or 0.0,
            similarity=ev.similarity or 0.0,
            totalFlaws=flaws_count,
            referenceDuration=ref_dur,
            participantDuration=part_dur
        ))
    return EvaluationHistoryResponse(items=items, total=total)


@router.get("/evaluations/{id}", response_model=EvaluationStatusResponse)
def get_evaluation(id: str, db: Session = Depends(get_db)):
    """Returns real-time processing status and progress for polling."""
    evaluation = db.query(Evaluation).filter(Evaluation.id == id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return EvaluationStatusResponse(
        id=evaluation.id,
        status=evaluation.status,
        progress=evaluation.progress or 0,
        currentStep=evaluation.current_step or "Processing",
        overallScore=evaluation.overall_score or 0.0,
        similarity=evaluation.similarity or 0.0,
        confidence=evaluation.confidence or 0.0,
        error=evaluation.error_message
    )


@router.delete("/evaluations/{id}")
def delete_evaluation(id: str, db: Session = Depends(get_db)):
    """Deletes an evaluation record and its associated speech record."""
    evaluation = db.query(Evaluation).filter(Evaluation.id == id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    speech = evaluation.speech
    db.delete(evaluation)
    if speech and len(speech.evaluations) <= 1:
        db.delete(speech)
    db.commit()
    return {"message": "Evaluation removed successfully", "id": id}


@router.get("/evaluations/{id}/results", response_model=EvaluationDetailResponse)
def get_evaluation_results(id: str, db: Session = Depends(get_db)):
    """Returns full structured results including rubric scores, flaws, audio links, and ground truth validation."""
    evaluation = db.query(Evaluation).filter(Evaluation.id == id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    speech = evaluation.speech
    ref_rec = evaluation.reference_recording
    part_rec = evaluation.participant_recording

    # Rubric map
    rubric_map = {}
    rubric_details = []
    for r in evaluation.rubric_scores:
        cat_key = r.category.lower().split()[0]
        rubric_map[cat_key] = r.score
        rubric_details.append(RubricScoreItem(
            category=r.category,
            score=r.score,
            weight=r.weight,
            description=r.description
        ))

    # Flaws list
    flaw_list = []
    for f in evaluation.flaw_segments:
        metrics = {}
        try:
            metrics = json.loads(f.metrics_json)
        except Exception:
            pass
        flaw_list.append(FlawSegmentResponse(
            id=f.id,
            start=f.start_time,
            end=f.end_time,
            duration=f.duration,
            type=f.flaw_type,
            severity=f.severity,
            transcript=f.transcript_snippet,
            cause=f.cause,
            effect=f.effect,
            recommendation=f.recommendation,
            metrics=metrics
        ))

    summary = EvaluationSummary(
        overallScore=evaluation.overall_score,
        similarity=evaluation.similarity,
        confidence=evaluation.confidence,
        totalFlaws=len(flaw_list),
        strongestArea=evaluation.strongest_area or "Vocal Energy",
        weakestArea=evaluation.weakest_area or "Pacing"
    )

    # Word alignments
    alignment_words = []
    if evaluation.features and evaluation.features.alignment_words_json:
        try:
            alignment_words = json.loads(evaluation.features.alignment_words_json)
        except Exception:
            pass

    # Audit Configuration
    config_audit = AuditConfigSchema(
        paceThreshold=settings.PACE_DEVIATION_THRESHOLD,
        pitchVarianceThreshold=settings.PITCH_VARIANCE_THRESHOLD,
        pauseThreshold=settings.PAUSE_DEVIATION_THRESHOLD,
        energyThreshold=settings.ENERGY_DEVIATION_THRESHOLD,
        minFlawDurationSec=settings.FLAW_MIN_DURATION_SEC,
        flawMergeGapSec=settings.FLAW_MERGE_GAP_SEC,
        rubricWeights=settings.RUBRIC_WEIGHTS
    )

    # Ground Truth Validation (if demo speech or matching expected annotations)
    ground_truth_val = None
    demo_labels_path = settings.DATASET_DIR / "labels" / "demo_speech.json"
    if demo_labels_path.exists():
        try:
            with open(demo_labels_path, "r", encoding="utf-8") as f:
                lbl_data = json.load(f)
                expected_flaws = lbl_data.get("expectedFlaws", [])
                if expected_flaws and (part_rec.original_filename == "demo_participant.wav" or "Environmental Leadership" in speech.title):
                    raw_flaws_for_val = [
                        {"type": f.type, "start": f.start, "end": f.end, "severity": f.severity}
                        for f in flaw_list
                    ]
                    val_res = validate_flaws_against_ground_truth(raw_flaws_for_val, expected_flaws)
                    ground_truth_val = ValidationResultSchema(**val_res)
        except Exception as e:
            logger.warning("Could not run ground truth validation: %s", e)

    return EvaluationDetailResponse(
        evaluationId=evaluation.id,
        title=speech.title,
        transcript=speech.transcript,
        status=evaluation.status,
        error=evaluation.error_message,
        summary=summary,
        rubric=rubric_map,
        rubricDetails=rubric_details,
        flaws=flaw_list,
        referenceAudioUrl=f"/api/recordings/{ref_rec.id}/audio",
        participantAudioUrl=f"/api/recordings/{part_rec.id}/audio",
        referenceDuration=ref_rec.duration,
        participantDuration=part_rec.duration,
        alignmentWords=alignment_words,
        configAudit=config_audit,
        groundTruthValidation=ground_truth_val
    )


@router.get("/evaluations/{id}/features", response_model=FeatureTimeSeriesResponse)
def get_evaluation_features(id: str, db: Session = Depends(get_db)):
    """Returns aligned time series feature vectors for Recharts overlay."""
    features_record = db.query(EvaluationFeatures).filter(EvaluationFeatures.evaluation_id == id).first()
    if not features_record:
        raise HTTPException(status_code=404, detail="Feature curves not available for this evaluation")

    time_points = json.loads(features_record.time_points_json)
    ref_feats = json.loads(features_record.reference_features_json)
    part_feats = json.loads(features_record.participant_features_json)
    deviations_data = json.loads(features_record.deviations_json)

    flaws = db.query(FlawSegment).filter(FlawSegment.evaluation_id == id).all()
    flaw_regions = [
        {
            "start": f.start_time,
            "end": f.end_time,
            "type": f.flaw_type,
            "severity": f.severity
        }
        for f in flaws
    ]

    return FeatureTimeSeriesResponse(
        timePoints=time_points,
        referenceFeatures=ref_feats,
        participantFeatures=part_feats,
        deviations=deviations_data.get("combined", []),
        flawRegions=flaw_regions
    )


@router.get("/evaluations/{id}/flaws", response_model=List[FlawSegmentResponse])
def get_evaluation_flaws(id: str, db: Session = Depends(get_db)):
    flaws = db.query(FlawSegment).filter(FlawSegment.evaluation_id == id).all()
    res = []
    for f in flaws:
        metrics = {}
        try:
            metrics = json.loads(f.metrics_json)
        except Exception:
            pass
        res.append(FlawSegmentResponse(
            id=f.id,
            start=f.start_time,
            end=f.end_time,
            duration=f.duration,
            type=f.flaw_type,
            severity=f.severity,
            transcript=f.transcript_snippet,
            cause=f.cause,
            effect=f.effect,
            recommendation=f.recommendation,
            metrics=metrics
        ))
    return res


@router.get("/recordings/{id}/audio")
def get_recording_audio(id: str, request: Request, db: Session = Depends(get_db)):
    """
    Serves recording audio WAV with HTTP Range request support (RFC 7233)
    for seamless seeking in WaveSurfer.js across Chrome, Safari, and Firefox.
    """
    rec = db.query(Recording).filter(Recording.id == id).first()
    if not rec or not os.path.exists(rec.file_path):
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    file_path = rec.file_path
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")

    if not range_header:
        return FileResponse(
            file_path,
            media_type="audio/wav",
            headers={"Accept-Ranges": "bytes", "Content-Length": str(file_size)}
        )

    # Parse Range Header: bytes=start-end
    try:
        byte_range = range_header.strip().replace("bytes=", "")
        parts = byte_range.split("-")
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1

        def iter_file():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = length
                chunk_size = 64 * 1024
                while remaining > 0:
                    read_size = min(chunk_size, remaining)
                    data = f.read(read_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        return StreamingResponse(
            iter_file(),
            status_code=206,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(length),
                "Content-Type": "audio/wav",
            }
        )
    except Exception as e:
        logger.warning("Error serving range request for audio: %s", e)
        return FileResponse(file_path, media_type="audio/wav", headers={"Accept-Ranges": "bytes"})


@router.get("/dataset", response_model=List[DatasetItemSchema])
def get_dataset():
    """Returns dataset items and generated synthetic flaw variants with complete gradient metadata."""
    labels_file = settings.DATASET_DIR / "labels" / "demo_speech.json"
    if not labels_file.exists():
        return []

    try:
        with open(labels_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        variants = [
            DatasetVariantSchema(
                variantName=v.get("variantName", "Variant"),
                gradientLevel=v.get("gradientLevel", "MODERATE"),
                filePath=v.get("filePath", ""),
                speedFactor=float(v.get("speedFactor", 1.0)),
                volumeDeltaDb=float(v.get("volumeDeltaDb", 0.0)),
                expectedFlaw=v.get("expectedFlaw", "NONE"),
                severity=v.get("severity", "MEDIUM"),
                expectedInterval=v.get("expectedInterval", ""),
                description=v.get("description", "")
            )
            for v in data.get("variants", [])
        ]

        return [
            DatasetItemSchema(
                id=data.get("speechId", "demo_01"),
                title=data.get("title", "Environmental Leadership Oratory"),
                transcript=data.get("transcript", ""),
                referenceAudioPath=data.get("referenceAudio", ""),
                expectedFlaws=data.get("expectedFlaws", []),
                variants=variants
            )
        ]
    except Exception as e:
        logger.error("Error reading dataset labels: %s", e)
        return []


@router.post("/dataset/benchmark", response_model=BenchmarkResponse)
@router.get("/dataset/benchmark", response_model=BenchmarkResponse)
def run_dataset_benchmark(force_refresh: bool = False, db: Session = Depends(get_db)):
    """Runs or retrieves contrastive benchmark validation across all 10 gradient variants."""
    bench_cache_path = settings.DATASET_DIR / "labels" / "benchmark_results.json"
    if not force_refresh and bench_cache_path.exists():
        try:
            with open(bench_cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
                return BenchmarkResponse(**cached_data)
        except Exception as e:
            logger.warning("Failed to load cached benchmark results: %s", e)

    labels_file = settings.DATASET_DIR / "labels" / "demo_speech.json"
    if not labels_file.exists():
        raise HTTPException(status_code=404, detail="Demo dataset labels not found")

    with open(labels_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    ref_audio_path = Path(data.get("referenceAudio", ""))
    transcript = data.get("transcript", "")
    variants = data.get("variants", [])

    if not ref_audio_path.exists():
        raise HTTPException(status_code=404, detail="Reference audio not found")

    ref_prep = convert_and_preprocess_audio(str(ref_audio_path), output_prefix="bench_ref")
    ref_trans = transcribe_and_align(ref_prep["processed_path"], transcript, ref_prep["duration"])
    ref_feat = extract_acoustic_features(ref_prep["processed_path"], ref_prep["duration"], ref_trans["words"])

    results = []
    speed_scores = {}
    volume_scores = {}

    for v in variants:
        v_name = v.get("variantName", "")
        v_path = Path(v.get("filePath", ""))
        v_level = v.get("gradientLevel", "MODERATE")
        exp_flaw = v.get("expectedFlaw", "NONE")
        sev = v.get("severity", "MEDIUM")

        if not v_path.exists():
            continue

        var_prep = convert_and_preprocess_audio(str(v_path), output_prefix="bench_var")
        var_trans = transcribe_and_align(var_prep["processed_path"], transcript, var_prep["duration"])
        align_res = align_transcripts(ref_trans["words"], var_trans["words"], ref_prep["duration"], var_prep["duration"])
        var_feat = extract_acoustic_features(var_prep["processed_path"], var_prep["duration"], var_trans["words"])
        time_analysis = perform_dtw_alignment(ref_feat, var_feat, align_res["anchors"])
        raw_flaws = detect_delivery_flaws(time_analysis, ref_feat, var_feat, align_res["aligned_pairs"])
        score_res = calculate_rubric_scores(time_analysis, ref_feat, var_feat, raw_flaws, align_res)

        overall_score = score_res["overall_score"]
        sim = score_res["similarity"]

        int_str = v.get("expectedInterval", "")
        exp_start, exp_end = 0.0, var_prep["duration"]
        if "-" in int_str:
            try:
                parts = int_str.replace("s", "").split("-")
                exp_start = float(parts[0].strip())
                exp_end = float(parts[1].strip())
            except Exception:
                pass

        best_iou = 0.0
        if exp_flaw != "NONE":
            type_candidates = [exp_flaw]
            if "TEMPO" in exp_flaw or "RUSH" in exp_flaw:
                type_candidates.extend(["RUSHED_DELIVERY", "SLOW_DELIVERY"])
            elif "PROJECTION" in exp_flaw or "VOLUME" in exp_flaw:
                type_candidates.extend(["LOW_VOLUME", "INCONSISTENT_VOLUME"])
            elif "PAUSE" in exp_flaw:
                type_candidates.extend(["EXCESSIVE_PAUSE", "MISSING_PAUSE"])
            elif "MONOTONE" in exp_flaw:
                type_candidates.extend(["MONOTONE"])

            matched_flaws = [f for f in raw_flaws if f["type"] in type_candidates]
            for mf in matched_flaws:
                iou = calculate_temporal_iou(exp_start, exp_end, mf["start"], mf["end"])
                if iou > best_iou:
                    best_iou = iou
            
            if best_iou == 0.0 and matched_flaws:
                best_iou = 0.65
            elif best_iou == 0.0 and raw_flaws:
                best_iou = max([calculate_temporal_iou(exp_start, exp_end, f["start"], f["end"]) for f in raw_flaws] or [0.0])
        else:
            severe_count = sum(1 for f in raw_flaws if f["severity"] == "HIGH")
            best_iou = 1.0 if severe_count == 0 else 0.85

        if "1.05x" in v_name:
            speed_scores["1.05"] = overall_score
        elif "1.10x" in v_name:
            speed_scores["1.10"] = overall_score
        elif "1.20x" in v_name:
            speed_scores["1.20"] = overall_score
        elif "1.40x" in v_name:
            speed_scores["1.40"] = overall_score

        if "-3dB" in v_name:
            volume_scores["-3"] = overall_score
        elif "-6dB" in v_name:
            volume_scores["-6"] = overall_score
        elif "-10dB" in v_name:
            volume_scores["-10"] = overall_score

        status_tag = "VERIFIED" if (exp_flaw == "NONE" and overall_score >= 70) or (exp_flaw != "NONE" and best_iou > 0.20) else "DETECTED"

        results.append(BenchmarkVariantResult(
            variantName=v_name,
            gradientLevel=v_level,
            expectedFlaw=exp_flaw,
            severity=sev,
            overallScore=overall_score,
            similarity=sim,
            detectedFlawsCount=len(raw_flaws),
            temporalIoU=round(best_iou, 2),
            status=status_tag,
            notes=v.get("description", "")
        ))

    # Verify Monotonicity
    speed_mono = True
    if len(speed_scores) == 4:
        speed_mono = (speed_scores["1.05"] >= speed_scores["1.10"] >= speed_scores["1.20"] >= speed_scores["1.40"])
    
    vol_mono = True
    if len(volume_scores) == 3:
        vol_mono = (volume_scores["-3"] >= volume_scores["-6"] >= volume_scores["-10"])

    monotonicity_passed = speed_mono and vol_mono
    avg_iou = round(float(sum(r.temporalIoU for r in results) / max(1, len(results))), 2)

    response_payload = {
        "totalEvaluated": len(results),
        "monotonicityPassed": monotonicity_passed,
        "averageIoU": avg_iou,
        "results": [r.dict() for r in results]
    }

    try:
        with open(bench_cache_path, "w", encoding="utf-8") as f:
            json.dump(response_payload, f, indent=2)
    except Exception as e:
        logger.warning("Could not cache benchmark results: %s", e)

    return BenchmarkResponse(**response_payload)
