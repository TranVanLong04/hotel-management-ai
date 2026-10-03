import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import get_settings


@pytest.fixture
def client():
    """Test client đồng bộ cho FastAPI."""
    return TestClient(app)


@pytest.fixture
def valid_headers():
    """Headers chứa API Key hợp lệ."""
    settings = get_settings()
    key = settings.API_KEY or "dev-key-12345"
    return {"X-API-Key": key}


@pytest.fixture
def invalid_headers():
    """Headers chứa API Key sai."""
    return {"X-API-Key": "wrong-secret-key-999"}
