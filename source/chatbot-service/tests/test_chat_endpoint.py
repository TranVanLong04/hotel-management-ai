import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)


def test_chat_message_endpoint():
    # Mock orchestrator process_message
    with patch("app.api.routes.chat.orchestrator.process_message") as mock_process:
        mock_process.return_value = {
            "reply": "Giờ nhận phòng tiêu chuẩn tại Grand Luxury là 14:00.",
            "ui_type": "text",
            "ui_payload": None,
            "suggested_actions": ["Chính sách hủy phòng", "Xem bảng giá phòng"],
            "context_chunks_count": 1,
        }

        response = client.post(
            "/api/v1/chat/message",
            json={
                "message": "Giờ check-in của khách sạn là mấy giờ?",
                "role": "customer",
                "history": [],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "14:00" in data["reply"]
        assert len(data["suggested_actions"]) > 0
        assert data["ui_type"] == "text"

