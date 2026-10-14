import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import Speech, Recording, Evaluation
from app.routes.evaluations import run_evaluation_pipeline, get_evaluation_results
from app.config import settings

def test_identical_audio():
    print("\n--- TEST 1: Identical Audio Comparison ---")
    db = SessionLocal()
    ref_path = settings.DATASET_DIR / "good" / "demo_reference.wav"
    transcript = """Good morning, members of the jury and respected audience.
Today, we must confront the defining challenge of our time: protecting our shared global environment.
We cannot afford hesitation or complacency, because every passing decade reduces our margin for effective action.
True leadership requires decisive commitment, scientific discipline, and unbroken perseverance.
Let us choose responsibility today, so that tomorrow remains worthy of our hopes."""

    speech = Speech(title="Identical Test", transcript=transcript)
    db.add(speech)
    db.commit()

    rec_ref = Recording(speech_id=speech.id, type="REFERENCE", file_path=str(ref_path), original_filename="ref.wav")
    rec_part = Recording(speech_id=speech.id, type="PARTICIPANT", file_path=str(ref_path), original_filename="ref.wav")
    db.add(rec_ref)
    db.add(rec_part)
    db.commit()

    evaluation = Evaluation(speech_id=speech.id, reference_recording_id=rec_ref.id, participant_recording_id=rec_part.id)
    db.add(evaluation)
    db.commit()

    run_evaluation_pipeline(evaluation.id, str(ref_path), str(ref_path), transcript)

    db.expire_all()
    res = get_evaluation_results(evaluation.id, db)
    print(f"Identical Audio Overall Score: {res.summary.overallScore} / 100")
    print(f"Similarity: {res.summary.similarity}%")
    print(f"Flaws detected on identical audio: {len(res.flaws)}")
    assert res.summary.overallScore >= 90.0, "Score should be >= 90 for identical audio"
    assert res.summary.similarity >= 95.0, "Similarity should be >= 95% for identical audio"
    print("[PASS] Test 1 passed successfully!")
    db.close()

def test_reproducibility():
    print("\n--- TEST 5: Reproducibility Test (Same files analyzed twice) ---")
    db = SessionLocal()
    ref_path = settings.DATASET_DIR / "good" / "demo_reference.wav"
    part_path = settings.DATASET_DIR / "flawed" / "demo_participant.wav"
    transcript = "Good morning everyone"

    def run_one():
        speech = Speech(title="Reproduce Test", transcript=transcript)
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
    diff = abs(res1.summary.overallScore - res2.summary.overallScore)
    print(f"Run 1 Score: {res1.summary.overallScore}, Run 2 Score: {res2.summary.overallScore}, Delta: {diff}")
    assert diff < 0.1, "Scoring must be deterministic and identical across repeated runs"
    print("[PASS] Test 5 Deterministic Scoring passed successfully!")
    db.close()

if __name__ == "__main__":
    test_identical_audio()
    test_reproducibility()
