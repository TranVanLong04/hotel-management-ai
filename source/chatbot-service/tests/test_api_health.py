import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)


def test_health_endpoints():
    # Test /health
    res1 = client.get("/health")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "ok"
    assert data1["service"] == "grand-luxury-chatbot-service"
    assert "uptime_seconds" in data1
    assert "timestamp" in data1

    # Test /api/v1/health
    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "ok"
    assert data2["version"] == "1.0.0"

