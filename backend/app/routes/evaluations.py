import os
import json
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db, Base, engine
from ..models import Speech, Recording, Evaluation, RubricScore, FlawSegment, EvaluationFeatures
from ..config import settings
from ..schemas.schemas import (
    EvaluationDetailResponse,
    FeatureTimeSeriesResponse,
    EvaluationSummary,
    FlawSegmentResponse,
    RubricScoreItem,
    DatasetItemSchema,
    DatasetVariantSchema
)
from ..services.audio_service import convert_and_preprocess_audio
from ..services.transcription_service import transcribe_and_align
from ..services.alignment_service import align_transcripts
from ..services.feature_service import extract_acoustic_features
from ..services.temporal_analysis import perform_dtw_alignment
from ..services.flaw_detector import detect_delivery_flaws
from ..services.explanation_engine import enrich_flaws_with_explanations
from ..services.scoring_engine import calculate_rubric_scores
from ..services.dataset_generator import generate_flawed_variants

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Evaluations"])

# Ensure DB tables exist
Base.metadata.create_all(bind=engine)

def run_evaluation_pipeline(
    evaluation_id: str,
    ref_raw_path: str,
    part_raw_path: str,
    transcript: str
):
    """Executes the complete end-to-end speech evaluation pipeline."""
    from ..database import SessionLocal
    db = SessionLocal()
    eval_record = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not eval_record:
        db.close()
        return

    try:
        eval_record.status = "PROCESSING"
        db.commit()

        # Step 1: Audio Preprocessing
        ref_prep = convert_and_preprocess_audio(ref_raw_path, output_prefix="ref")
        part_prep = convert_and_preprocess_audio(part_raw_path, output_prefix="part")

        # Update recording metadata
        ref_rec = db.query(Recording).filter(Recording.id == eval_record.reference_recording_id).first()
        part_rec = db.query(Recording).filter(Recording.id == eval_record.participant_recording_id).first()
        if ref_rec:
            ref_rec.file_path = ref_prep["processed_path"]
            ref_rec.duration = ref_prep["duration"]
        if part_rec:
            part_rec.file_path = part_prep["processed_path"]
            part_rec.duration = part_prep["duration"]
        db.commit()

        # Step 2: Speech-to-text and Word Alignment
        ref_trans = transcribe_and_align(ref_prep["processed_path"], transcript, ref_prep["duration"])
        part_trans = transcribe_and_align(part_prep["processed_path"], transcript, part_prep["duration"])

        # Step 3: Transcript sequence alignment
        align_res = align_transcripts(ref_trans["words"], part_trans["words"], ref_prep["duration"], part_prep["duration"])

        # Step 4: Extract Acoustic Features
        ref_feat = extract_acoustic_features(ref_prep["processed_path"], ref_prep["duration"], ref_trans["words"])
        part_feat = extract_acoustic_features(part_prep["processed_path"], part_prep["duration"], part_trans["words"])

        # Step 5: DTW Temporal Alignment & Feature Deviations
        time_analysis = perform_dtw_alignment(ref_feat, part_feat, align_res["anchors"])

        # Step 6: Flaw Detection & Classification
        raw_flaws = detect_delivery_flaws(time_analysis, ref_feat, part_feat, align_res["aligned_pairs"])

        # Step 7: Causal Explanation Generation
        flaws = enrich_flaws_with_explanations(raw_flaws)

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

        # Persist Time Series Feature Data
        # Filter down feature series to compact format for Recharts
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
            })
        )
        db.add(feature_data)

        # Update Evaluation Record
        eval_record.overall_score = score_res["overall_score"]
        eval_record.similarity = score_res["similarity"]
        eval_record.confidence = score_res["confidence"]
        eval_record.strongest_area = score_res["strongest_area"]
        eval_record.weakest_area = score_res["weakest_area"]
        eval_record.status = "COMPLETED"
        eval_record.error_message = None
        db.commit()
        logger.info("Evaluation %s completed successfully with overall score %s", evaluation_id, score_res["overall_score"])

    except Exception as e:
        logger.exception("Evaluation pipeline failure: %s", e)
        eval_record.status = "FAILED"
        eval_record.error_message = str(e)
        db.commit()
    finally:
        db.close()


@router.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


@router.post("/evaluations")
async def create_evaluation(
    title: str = Form("Competitive Speech Evaluation"),
    transcript: str = Form(...),
    reference_audio: UploadFile = File(...),
    participant_audio: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Creates a new speech evaluation from uploaded audio files and transcript."""
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript text cannot be empty.")

    # Save original uploaded files
    ref_filename = f"ref_{reference_audio.filename}"
    part_filename = f"part_{participant_audio.filename}"
    ref_raw_path = settings.UPLOAD_DIR / ref_filename
    part_raw_path = settings.UPLOAD_DIR / part_filename

    with open(ref_raw_path, "wb") as f:
        f.write(await reference_audio.read())

    with open(part_raw_path, "wb") as f:
        f.write(await participant_audio.read())

    # Create Speech record
    speech = Speech(title=title, transcript=transcript.strip())
    db.add(speech)
    db.commit()
    db.refresh(speech)

    # Create Recording records
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

    # Create Evaluation record
    evaluation = Evaluation(
        speech_id=speech.id,
        reference_recording_id=rec_ref.id,
        participant_recording_id=rec_part.id,
        status="QUEUED"
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    # Run pipeline (synchronously or in background)
    # Running synchronously for instant responsive results in prototype, or background
    run_evaluation_pipeline(evaluation.id, str(ref_raw_path), str(part_raw_path), transcript)

    return {"evaluationId": evaluation.id, "status": "COMPLETED"}


@router.post("/evaluations/demo")
def create_demo_evaluation(db: Session = Depends(get_db)):
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
        status="QUEUED"
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    run_evaluation_pipeline(evaluation.id, str(demo_ref_path), str(demo_part_path), transcript)

    return {"evaluationId": evaluation.id, "status": "COMPLETED"}


@router.get("/evaluations/{id}")
def get_evaluation(id: str, db: Session = Depends(get_db)):
    evaluation = db.query(Evaluation).filter(Evaluation.id == id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return {
        "id": evaluation.id,
        "status": evaluation.status,
        "overallScore": evaluation.overall_score,
        "similarity": evaluation.similarity,
        "confidence": evaluation.confidence,
        "error": evaluation.error_message
    }


@router.get("/evaluations/{id}/results", response_model=EvaluationDetailResponse)
def get_evaluation_results(id: str, db: Session = Depends(get_db)):
    """Returns full structured results including rubric scores, flaws, and audio links."""
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
        participantDuration=part_rec.duration
    )


@router.get("/evaluations/{id}/features", response_model=FeatureTimeSeriesResponse)
def get_evaluation_features(id: str, db: Session = Depends(get_db)):
    """Returns aligned time series feature vectors for Recharts / Plotly overlay."""
    features_record = db.query(EvaluationFeatures).filter(EvaluationFeatures.evaluation_id == id).first()
    if not features_record:
        raise HTTPException(status_code=404, detail="Feature curves not available for this evaluation")

    time_points = json.loads(features_record.time_points_json)
    ref_feats = json.loads(features_record.reference_features_json)
    part_feats = json.loads(features_record.participant_features_json)
    deviations_data = json.loads(features_record.deviations_json)

    # Flaw regions for visual highlights
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
def get_recording_audio(id: str, db: Session = Depends(get_db)):
    """Serves the recording audio WAV file for browser playback and WaveSurfer.js."""
    rec = db.query(Recording).filter(Recording.id == id).first()
    if not rec or not os.path.exists(rec.file_path):
        raise HTTPException(status_code=404, detail="Audio file not found on disk")
    return FileResponse(rec.file_path, media_type="audio/wav", filename=f"{rec.type.lower()}.wav")


@router.get("/dataset", response_model=List[DatasetItemSchema])
def get_dataset():
    """Returns dataset items and generated synthetic flaw variants."""
    labels_file = settings.DATASET_DIR / "labels" / "demo_speech.json"
    if not labels_file.exists():
        return []

    try:
        with open(labels_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        variants = [
            DatasetVariantSchema(
                variantName=v["variantName"],
                filePath=v["filePath"],
                expectedFlaw=v["expectedFlaw"],
                severity=v["severity"],
                description=v["description"]
            )
            for v in data.get("variants", [])
        ]

        return [
            DatasetItemSchema(
                id=data.get("speechId", "demo_01"),
                title=data.get("title", "Demo Speech"),
                transcript=data.get("transcript", ""),
                referenceAudioPath=data.get("referenceAudio", ""),
                variants=variants
            )
        ]
    except Exception as e:
        logger.error("Error reading dataset labels: %s", e)
        return []
