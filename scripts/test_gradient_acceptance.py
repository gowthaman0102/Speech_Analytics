import sys
import json
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import Speech, Recording, Evaluation
from app.routes.evaluations import run_evaluation_pipeline, get_evaluation_results, run_dataset_benchmark
from app.config import settings
from app.services.validation_service import calculate_temporal_iou

def test_identical_audio():
    print("\n=======================================================")
    print(" TEST 1: Identical Audio Comparison (Ideal vs Ideal)")
    print("=======================================================")
    db = SessionLocal()
    ref_path = settings.DATASET_DIR / "good" / "demo_reference.wav"
    transcript = """Good morning, members of the jury and respected audience.
Today, we must confront the defining challenge of our time: protecting our shared global environment.
We cannot afford hesitation or complacency, because every passing decade reduces our margin for effective action.
True leadership requires decisive commitment, scientific discipline, and unbroken perseverance.
Let us choose responsibility today, so that tomorrow remains worthy of our hopes."""

    speech = Speech(title="Identical Audio Verification", transcript=transcript)
    db.add(speech)
    db.commit()

    rec_ref = Recording(speech_id=speech.id, type="REFERENCE", file_path=str(ref_path), original_filename="demo_reference.wav")
    rec_part = Recording(speech_id=speech.id, type="PARTICIPANT", file_path=str(ref_path), original_filename="demo_reference.wav")
    db.add(rec_ref)
    db.add(rec_part)
    db.commit()

    evaluation = Evaluation(speech_id=speech.id, reference_recording_id=rec_ref.id, participant_recording_id=rec_part.id)
    db.add(evaluation)
    db.commit()

    run_evaluation_pipeline(evaluation.id, str(ref_path), str(ref_path), transcript)

    db.expire_all()
    res = get_evaluation_results(evaluation.id, db)
    print(f" -> Overall Score: {res.summary.overallScore} / 100")
    print(f" -> Baseline Similarity: {res.summary.similarity}%")
    print(f" -> Detected Flaws: {len(res.flaws)}")

    assert res.summary.overallScore >= 90.0, f"Expected Score >= 90.0, got {res.summary.overallScore}"
    assert res.summary.similarity >= 95.0, f"Expected Similarity >= 95.0, got {res.summary.similarity}"
    severe_flaws = [f for f in res.flaws if f.severity == 'HIGH']
    assert len(severe_flaws) == 0, f"Identical audio must have 0 severe flaws, got {len(severe_flaws)}"
    print("[PASS] Test 1: Identical audio evaluated cleanly with near-perfect metrics!")
    db.close()

def test_almost_perfect_delivery():
    print("\n=======================================================")
    print(" TEST 2: Almost Perfect Delivery (1.05x Speed Variation)")
    print("=======================================================")
    db = SessionLocal()
    ref_path = settings.DATASET_DIR / "good" / "demo_reference.wav"
    part_path = settings.DATASET_DIR / "flawed" / "demo_reference_almost_perfect_1.05x.wav"
    transcript = "Good morning, members of the jury and respected audience."

    speech = Speech(title="Almost Perfect Verification", transcript=transcript)
    db.add(speech)
    db.commit()

    r1 = Recording(speech_id=speech.id, type="REFERENCE", file_path=str(ref_path))
    r2 = Recording(speech_id=speech.id, type="PARTICIPANT", file_path=str(part_path))
    db.add(r1); db.add(r2); db.commit()

    ev = Evaluation(speech_id=speech.id, reference_recording_id=r1.id, participant_recording_id=r2.id)
    db.add(ev); db.commit()

    run_evaluation_pipeline(ev.id, str(ref_path), str(part_path), transcript)
    db.expire_all()
    res = get_evaluation_results(ev.id, db)
    print(f" -> 1.05x Score: {res.summary.overallScore} / 100")
    print(f" -> 1.05x Similarity: {res.summary.similarity}%")
    severe_count = sum(1 for f in res.flaws if f.severity == 'HIGH')
    print(f" -> High Severity Flaws: {severe_count}")

    assert res.summary.overallScore >= 75.0, f"Score for 1.05x should reflect competitive standard (>=75.0), got {res.summary.overallScore}"
    assert severe_count == 0, f"Expected 0 high-severity flaws for 1.05x, got {severe_count}"
    print("[PASS] Test 2: Almost perfect delivery maintains competitive score without harsh penalties!")
    db.close()

def test_gradient_monotonicity():
    print("\n=======================================================")
    print(" TEST 3: Gradient Monotonicity Across All 10 Tiers")
    print("=======================================================")
    db = SessionLocal()
    res = run_dataset_benchmark(force_refresh=True, db=db)
    print(f" -> Evaluated {res.totalEvaluated} gradient variants")
    print(f" -> Monotonicity Check: {res.monotonicityPassed}")
    print(f" -> Average Temporal IoU: {res.averageIoU}")

    score_map = {r.variantName: r.overallScore for r in res.results}

    # Verify Speed Gradient Monotonicity
    s_105 = score_map["Almost Perfect Delivery (1.05x)"]
    s_110 = score_map["Mildly Fast Delivery (1.10x)"]
    s_120 = score_map["Moderately Fast Delivery (1.20x)"]
    s_140 = score_map["Severely Rushed Delivery (1.40x)"]
    print(f" -> Speed Gradient Scores: 1.05x ({s_105}) >= 1.10x ({s_110}) >= 1.20x ({s_120}) >= 1.40x ({s_140})")
    assert s_105 >= s_110 >= s_120 >= s_140, "Speed gradient must be strictly monotonically decreasing with speed factor"

    # Verify Volume Gradient Monotonicity
    v_3 = score_map["Mild Volume Drop (-3 dB)"]
    v_6 = score_map["Moderate Volume Drop (-6 dB)"]
    v_10 = score_map["Severely Faded Volume (-10 dB)"]
    print(f" -> Volume Gradient Scores: -3dB ({v_3}) >= -6dB ({v_6}) >= -10dB ({v_10})")
    assert v_3 >= v_6 >= v_10, "Volume gradient must be monotonically decreasing with dB drop"

    # Verify Pause Gradient Monotonicity
    p_15 = score_map["Moderate Hesitation Pause (1.5s)"]
    p_28 = score_map["Severe Dead Air Hesitation (2.8s)"]
    print(f" -> Pause Gradient Scores: 1.5s ({p_15}) >= 2.8s ({p_28})")
    assert p_15 >= p_28, "Pause gradient must be monotonically decreasing with pause duration"

    print("[PASS] Test 3: Gradient Monotonicity 100% verified across all dimensions!")
    db.close()

def test_temporal_grounding_iou():
    print("\n=======================================================")
    print(" TEST 4: Sub-Second Temporal Grounding & IoU on Pause")
    print("=======================================================")
    db = SessionLocal()
    ref_path = settings.DATASET_DIR / "good" / "demo_reference.wav"
    part_path = settings.DATASET_DIR / "flawed" / "demo_reference_moderate_pause_1.5s.wav"
    transcript = "Good morning, members of the jury and respected audience."

    speech = Speech(title="Temporal Grounding Test", transcript=transcript)
    db.add(speech)
    db.commit()

    r1 = Recording(speech_id=speech.id, type="REFERENCE", file_path=str(ref_path))
    r2 = Recording(speech_id=speech.id, type="PARTICIPANT", file_path=str(part_path))
    db.add(r1); db.add(r2); db.commit()

    ev = Evaluation(speech_id=speech.id, reference_recording_id=r1.id, participant_recording_id=r2.id)
    db.add(ev); db.commit()

    run_evaluation_pipeline(ev.id, str(ref_path), str(part_path), transcript)
    db.expire_all()
    res = get_evaluation_results(ev.id, db)

    # Expected pause at 15.5s - 17.0s
    exp_start, exp_end = 15.5, 17.0
    matched_flaws = [f for f in res.flaws if f.type == "EXCESSIVE_PAUSE"]
    assert len(matched_flaws) > 0, "Pipeline must detect EXCESSIVE_PAUSE"

    best_iou = max([calculate_temporal_iou(exp_start, exp_end, f.start, f.end) for f in matched_flaws])
    print(f" -> Ground-truth interval: {exp_start}s - {exp_end}s")
    print(f" -> Detected interval: {matched_flaws[0].start}s - {matched_flaws[0].end}s")
    print(f" -> Temporal IoU: {best_iou}")
    assert best_iou >= 0.50, f"Expected Temporal IoU >= 0.50, got {best_iou}"
    print("[PASS] Test 4: Sub-second temporal grounding validated with high IoU!")
    db.close()

def test_deterministic_reproducibility():
    print("\n=======================================================")
    print(" TEST 5: Deterministic Scoring (Zero Random Drift)")
    print("=======================================================")
    db = SessionLocal()
    ref_path = settings.DATASET_DIR / "good" / "demo_reference.wav"
    part_path = settings.DATASET_DIR / "flawed" / "demo_participant.wav"
    transcript = "Good morning everyone"

    def run_one():
        speech = Speech(title="Deterministic Test", transcript=transcript)
        db.add(speech)
        db.commit()
        r1 = Recording(speech_id=speech.id, type="REFERENCE", file_path=str(ref_path))
        r2 = Recording(speech_id=speech.id, type="PARTICIPANT", file_path=str(part_path))
        db.add(r1); db.add(r2); db.commit()
        ev = Evaluation(speech_id=speech.id, reference_recording_id=r1.id, participant_recording_id=r2.id)
        db.add(ev); db.commit()
        run_evaluation_pipeline(ev.id, str(ref_path), str(part_path), transcript)
        db.expire_all()
        return get_evaluation_results(ev.id, db)

    res1 = run_one()
    res2 = run_one()
    delta = abs(res1.summary.overallScore - res2.summary.overallScore)
    print(f" -> Run 1 Score: {res1.summary.overallScore}")
    print(f" -> Run 2 Score: {res2.summary.overallScore}")
    print(f" -> Delta: {delta}")
    assert delta == 0.0, f"Score delta between identical runs must be 0.0, got {delta}"
    print("[PASS] Test 5: Fully deterministic, signal-grounded reproducibility verified!")
    db.close()

if __name__ == "__main__":
    test_identical_audio()
    test_almost_perfect_delivery()
    test_gradient_monotonicity()
    test_temporal_grounding_iou()
    test_deterministic_reproducibility()
    print("\n=======================================================")
    print(" ALL 5 CONTRASTIVE ACCEPTANCE TESTS PASSED (100% SUCCESS) ")
    print("=======================================================\n")
