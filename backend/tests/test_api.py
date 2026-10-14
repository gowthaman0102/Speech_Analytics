import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "SpeechScope"
    assert "AI" not in data["app"]

def test_get_evaluations_history():
    response = client.get("/api/evaluations?limit=10&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)

def test_get_dataset():
    response = client.get("/api/dataset")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "id" in data[0]
        assert "title" in data[0]
        assert "variants" in data[0]

def test_demo_evaluation():
    response = client.post("/api/evaluations/demo")
    assert response.status_code == 200
    data = response.json()
    assert "evaluationId" in data
    assert "status" in data
    eval_id = data["evaluationId"]

    # Poll status
    status_res = client.get(f"/api/evaluations/{eval_id}")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["status"] in ["QUEUED", "PROCESSING", "COMPLETED"]
