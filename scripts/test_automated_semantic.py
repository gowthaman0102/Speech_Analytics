import sys
import time
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

def test_automated_semantic_suite():
    print("=== Testing Automated Semantic Speech Analytics ===")
    client = TestClient(app)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health Check:", res.json())

    # 2. 1-Click Demo Evaluation (No reference audio or transcript required)
    print("\nTriggering 1-Click Demo Evaluation...")
    demo_res = client.post("/api/evaluations/demo")
    assert demo_res.status_code == 200, f"Demo post failed: {demo_res.text}"
    demo_data = demo_res.json()
    eval_id = demo_data["evaluationId"]
    print(f"Created Evaluation ID: {eval_id}. Polling until complete...")

    # Poll status
    for i in range(40):
        status_res = client.get(f"/api/evaluations/{eval_id}")
        assert status_res.status_code == 200, f"Status check failed: {status_res.text}"
        status_data = status_res.json()
        print(f"  [{i*1.5:.1f}s] Status: {status_data['status']} ({status_data['progress']}%) - Step: {status_data['currentStep']}")
        if status_data["status"] == "COMPLETED":
            break
        elif status_data["status"] == "FAILED":
            raise RuntimeError(f"Evaluation failed: {status_data.get('error')}")
        time.sleep(1.5)

    assert status_data["status"] == "COMPLETED", "Evaluation did not complete in time"

    # 3. Retrieve Full Results
    results_res = client.get(f"/api/evaluations/{eval_id}/results")
    assert results_res.status_code == 200, f"Results fetch failed: {results_res.text}"
    res_data = results_res.json()

    print("\n--- Evaluation Results ---")
    print(f"Title: {res_data['title']}")
    print(f"Detected Speaking Style: {res_data.get('detectedSpeakingStyle')}")
    print(f"Overall Score: {res_data['summary']['overallScore']}")
    print(f"Total Flaws: {res_data['summary']['totalFlaws']}")
    print(f"Summary Text: {res_data.get('summaryText')}")
    print(f"Total Sentences: {len(res_data.get('sentences', []))}")

    # Verify sentences
    assert len(res_data.get("sentences", [])) > 0, "No sentences analyzed in response"
    for s in res_data["sentences"][:3]:
        print(f"  Sentence #{s['sentence_index']}: [{s['primary_intent']}] '{s['text'][:45]}...' -> Compat: {s['compatibility_score']}%")

    # Verify rubric
    assert len(res_data["rubricDetails"]) == 6, f"Expected 6 rubric dimensions, got {len(res_data['rubricDetails'])}"
    for r in res_data["rubricDetails"]:
        print(f"  Rubric: {r['category']} ({r['weight']}): {r['score']}")

    # Verify flaws
    assert len(res_data["flaws"]) > 0, "Expected flaws to be detected"
    for f in res_data["flaws"][:2]:
        print(f"  Flaw: {f['type']} [{f['severity']}] @ {f['start']}s-{f['end']}s: {f['cause'][:60]}...")

    # 4. Test Single Upload Endpoint (Accepting only participant audio)
    demo_audio = settings.DATASET_DIR / "flawed" / "demo_participant.wav"
    print(f"\nTesting POST /api/evaluations with single media file: {demo_audio.name}...")
    with open(demo_audio, "rb") as f:
        upload_res = client.post(
            "/api/evaluations",
            files={"media_file": (demo_audio.name, f, "audio/wav")},
            data={"title": "Custom Single Upload Speech", "speech_type": "Persuasive Oratory"}
        )
    assert upload_res.status_code == 200, f"Single media upload failed: {upload_res.text}"
    single_data = upload_res.json()
    print(f"[PASS] Single media upload created evaluation: {single_data['evaluationId']}")

    print("\n=== ALL AUTOMATED SEMANTIC TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_automated_semantic_suite()
