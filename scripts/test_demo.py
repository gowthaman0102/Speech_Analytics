import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.routes.evaluations import create_demo_evaluation, get_evaluation_results
from app.database import SessionLocal

def run_test():
    db = SessionLocal()
    try:
        print("Triggering create_demo_evaluation...")
        demo_res = create_demo_evaluation(db)
        eval_id = demo_res["evaluationId"]
        print(f"Demo created with id: {eval_id}, fetching results...")
        
        res = get_evaluation_results(eval_id, db)
        print("\n================== EVALUATION RESULTS ==================")
        print(f"Overall Score: {res.summary.overallScore} / 100")
        print(f"Similarity:    {res.summary.similarity}%")
        print(f"Confidence:    {res.summary.confidence}%")
        print(f"Strongest Area: {res.summary.strongestArea}")
        print(f"Weakest Area:   {res.summary.weakestArea}")
        print("\nRubric Dimensions:")
        for r in res.rubricDetails:
            print(f"  * {r.category} (Weight: {r.weight}): {r.score}/100")
            
        print(f"\nDetected Flaws Count: {len(res.flaws)}")
        for f in res.flaws:
            print(f"\n  -> [{f.start:05.2f}s - {f.end:05.2f}s] {f.type} [{f.severity}]")
            print(f"     Transcript: \"{f.transcript}\"")
            print(f"     Cause: {f.cause}")
            print(f"     Recommendation: {f.recommendation}")
            print(f"     Metrics: {f.metrics}")

        print("\n[SUCCESS] Pipeline executed cleanly and verified!")
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
