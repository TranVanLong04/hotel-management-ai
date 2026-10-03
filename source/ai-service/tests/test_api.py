import io
import numpy as np
import pytest
from unittest.mock import MagicMock, patch
from app.services.similarity import calculate_similarity
from app.services.embedding import l2_normalize, extract_face_embedding


class MockFace:
    """Mock object giả lập kết quả trả về từ InsightFace."""
    def __init__(self, bbox=(10, 10, 150, 150), det_score=0.995):
        self.bbox = np.array(bbox, dtype=np.float32)
        # Vector 512 chiều ngẫu nhiên
        vec = np.random.randn(512).astype(np.float32)
        self.embedding = (vec / np.linalg.norm(vec)).tolist()
        self.det_score = det_score


def test_health_endpoint(client):
    """Test GET /health không cần auth và trả đúng định dạng."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "status" in data["data"]
    assert "model_loaded" in data["data"]
    assert data["data"]["status"] == "ok"


def test_embed_no_auth(client):
    """Test POST /embed thiếu header X-API-Key phải trả về 401 UNAUTHORIZED."""
    file_content = b"fake-jpg-content"
    response = client.post(
        "/embed",
        files={"image": ("test.jpg", file_content, "image/jpeg")},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_embed_invalid_api_key(client, invalid_headers):
    """Test POST /embed truyền sai API Key trả về 401 UNAUTHORIZED."""
    file_content = b"fake-jpg-content"
    response = client.post(
        "/embed",
        headers=invalid_headers,
        files={"image": ("test.jpg", file_content, "image/jpeg")},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_embed_invalid_file_extension(client, valid_headers):
    """Test POST /embed upload file không phải JPG/PNG."""
    response = client.post(
        "/embed",
        headers=valid_headers,
        files={"image": ("test.pdf", b"%PDF-1.4...", "application/pdf")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_IMAGE"


def test_embed_empty_file(client, valid_headers):
    """Test POST /embed upload file rỗng."""
    response = client.post(
        "/embed",
        headers=valid_headers,
        files={"image": ("test.jpg", b"", "image/jpeg")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_IMAGE"


def test_embed_file_too_large(client, valid_headers):
    """Test POST /embed upload file vượt quá 5MB."""
    large_content = b"0" * (5 * 1024 * 1024 + 10)
    response = client.post(
        "/embed",
        headers=valid_headers,
        files={"image": ("large.jpg", large_content, "image/jpeg")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_IMAGE"


@patch("app.services.embedding.get_face_app")
def test_embed_no_face_detected(mock_get_app, client, valid_headers):
    """Test POST /embed khi không phát hiện khuôn mặt -> 400 FACE_NOT_DETECTED."""
    # Tạo ảnh hợp lệ qua OpenCV nhưng mock model trả về 0 face
    img_bytes = io.BytesIO()
    import cv2
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".jpg", img)
    
    mock_app = MagicMock()
    mock_app.get.return_value = []
    mock_get_app.return_value = mock_app

    response = client.post(
        "/embed",
        headers=valid_headers,
        files={"image": ("landscape.jpg", encoded.tobytes(), "image/jpeg")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "FACE_NOT_DETECTED"


@patch("app.services.embedding.get_face_app")
def test_embed_face_low_quality(mock_get_app, client, valid_headers):
    """Test POST /embed khi khuôn mặt < 80x80 px -> 400 FACE_LOW_QUALITY."""
    import cv2
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".jpg", img)

    mock_app = MagicMock()
    # Khuôn mặt kích thước 50x50 px (< 80x80)
    mock_app.get.return_value = [MockFace(bbox=(10, 10, 60, 60))]
    mock_get_app.return_value = mock_app

    response = client.post(
        "/embed",
        headers=valid_headers,
        files={"image": ("small_face.jpg", encoded.tobytes(), "image/jpeg")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "FACE_LOW_QUALITY"


@patch("app.services.embedding.get_face_app")
def test_embed_success_mocked(mock_get_app, client, valid_headers):
    """Test POST /embed thành công trả về vector 512D chuẩn hóa L2."""
    import cv2
    img = np.zeros((300, 300, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".jpg", img)

    mock_app = MagicMock()
    mock_face = MockFace(bbox=(50, 50, 200, 200), det_score=0.998)
    mock_app.get.return_value = [mock_face]
    mock_get_app.return_value = mock_app

    response = client.post(
        "/embed",
        headers=valid_headers,
        files={"image": ("face_1.jpg", encoded.tobytes(), "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "embedding" in data["data"]
    assert len(data["data"]["embedding"]) == 512
    assert data["data"]["model_version"] == "buffalo_l"
    assert data["data"]["face_detected"] is True
    assert data["data"]["confidence"] == 0.998


def test_compare_missing_auth(client):
    """Test POST /compare không có header X-API-Key -> 401."""
    v1 = [0.1] * 512
    v2 = [0.1] * 512
    response = client.post(
        "/compare",
        json={"embedding1": v1, "embedding2": v2},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_compare_invalid_dimension(client, valid_headers):
    """Test POST /compare vector không đủ 512 chiều -> 422 VALIDATION_ERROR."""
    v1 = [0.1] * 256  # Thiếu chiều
    v2 = [0.1] * 512
    response = client.post(
        "/compare",
        headers=valid_headers,
        json={"embedding1": v1, "embedding2": v2},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_compare_identical_vectors(client, valid_headers):
    """Test POST /compare với 2 vector giống nhau -> similarity ~ 1.0, is_match = true."""
    v = [1.0 / np.sqrt(512)] * 512
    response = client.post(
        "/compare",
        headers=valid_headers,
        json={"embedding1": v, "embedding2": v, "threshold": 0.75},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_match"] is True
    assert data["data"]["similarity"] >= 0.99
    assert data["data"]["distance"] <= 0.01
    assert data["data"]["threshold"] == 0.75


def test_compare_orthogonal_vectors(client, valid_headers):
    """Test POST /compare với 2 vector vuông góc -> similarity ~ 0.0, is_match = false."""
    v1 = [0.0] * 512
    v1[0] = 1.0
    v2 = [0.0] * 512
    v2[1] = 1.0

    response = client.post(
        "/compare",
        headers=valid_headers,
        json={"embedding1": v1, "embedding2": v2, "threshold": 0.75},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_match"] is False
    assert abs(data["data"]["similarity"]) <= 0.001
    assert data["data"]["distance"] >= 0.99


def test_similarity_math_direct():
    """Unit test trực tiếp hàm calculate_similarity."""
    v1 = [1.0] + [0.0] * 511
    v2 = [1.0] + [0.0] * 511
    res = calculate_similarity(v1, v2, threshold=0.8)
    assert res["similarity"] == 1.0
    assert res["is_match"] is True
    assert res["threshold"] == 0.8
    assert res["distance"] == 0.0

    # Test vector norm 0
    zero_vec = [0.0] * 512
    with pytest.raises(Exception):
        calculate_similarity(zero_vec, v1)


def test_l2_normalize():
    """Unit test trực tiếp hàm l2_normalize."""
    vec = np.array([3.0, 4.0] + [0.0] * 510, dtype=np.float32)
    norm_vec = l2_normalize(vec)
    norm = np.linalg.norm(norm_vec)
    assert abs(norm - 1.0) < 1e-5

    # Zero norm
    zero_vec = np.zeros(512, dtype=np.float32)
    norm_zero = l2_normalize(zero_vec)
    assert np.all(norm_zero == 0)


def test_logger_json_formatter():
    """Test logger JSON formatter bao gồm exceptions và extra metadata."""
    import logging
    from app.core.logger import JSONFormatter
    formatter = JSONFormatter()
    record = logging.LogRecord("test_logger", logging.INFO, "path", 1, "test msg", (), None)
    record.duration_ms = 45.2
    record.status_code = 200
    record.endpoint = "/test"
    record.method = "GET"
    formatted = formatter.format(record)
    assert "/test" in formatted
    assert "200" in formatted

    # Test with exception info
    try:
        raise ValueError("test exception")
    except ValueError:
        import sys
        record.exc_info = sys.exc_info()
        formatted_exc = formatter.format(record)
        assert "test exception" in formatted_exc


def test_config_cors_origins():
    """Test cấu hình ALLOWED_ORIGINS dạng chuỗi và danh sách."""
    from app.core.config import Settings
    s1 = Settings(ALLOWED_ORIGINS="http://a.com, http://b.com")
    assert s1.cors_origins == ["http://a.com", "http://b.com"]

    s2 = Settings(ALLOWED_ORIGINS=["http://c.com"])
    assert s2.cors_origins == ["http://c.com"]


@patch("app.api.routes.embed.extract_face_embedding")
def test_generic_500_exception(mock_extract, client, valid_headers):
    """Test custom 500 internal server error handler."""
    mock_extract.side_effect = RuntimeError("Unexpected internal crash")
    response = client.post(
        "/embed",
        headers=valid_headers,
        files={"image": ("test.jpg", b"fake-jpg", "image/jpeg")},
    )
    assert response.status_code == 500
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"
