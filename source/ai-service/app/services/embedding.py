import io
import numpy as np
import cv2
from typing import Dict, Any, Tuple
from fastapi import HTTPException
from app.services.face_detection import get_face_app
from app.core.logger import logger

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
MIN_FACE_WIDTH = 80
MIN_FACE_HEIGHT = 80
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def validate_image_file(image_bytes: bytes, filename: str) -> None:
    """Kiểm tra tính hợp lệ của file ảnh (kích thước và định dạng mở rộng)."""
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": "File ảnh rỗng hoặc không hợp lệ"},
        )

    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": "Kích thước ảnh vượt quá giới hạn 5MB"},
        )

    lower_filename = filename.lower()
    if not any(lower_filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": "Chỉ chấp nhận file ảnh định dạng JPG hoặc PNG"},
        )


def l2_normalize(vector: np.ndarray) -> np.ndarray:
    """Chuẩn hóa L2 vector embedding."""
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm


def extract_face_embedding(image_bytes: bytes, filename: str = "face.jpg") -> Dict[str, Any]:
    """
    Xử lý ảnh: Decode -> RetinaFace detect -> Chọn khuôn mặt lớn nhất -> Quality check -> Trích xuất & L2 normalize.
    """
    validate_image_file(image_bytes, filename)

    # 1. Decode ảnh sang định dạng BGR qua OpenCV
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": "Không thể giải mã dữ liệu ảnh BGR"},
        )

    # 2. Phát hiện khuôn mặt bằng InsightFace FaceAnalysis
    app = get_face_app()
    faces = app.get(img_bgr)

    if not faces or len(faces) == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "FACE_NOT_DETECTED", "message": "Không phát hiện khuôn mặt trong ảnh"},
        )

    # 3. Chọn khuôn mặt có diện tích bbox lớn nhất (max bbox area)
    largest_face = None
    max_area = -1.0

    for face in faces:
        bbox = face.bbox.astype(float).tolist()
        x1, y1, x2, y2 = bbox
        width = max(0.0, x2 - x1)
        height = max(0.0, y2 - y1)
        area = width * height
        if area > max_area:
            max_area = area
            largest_face = face

    if largest_face is None:
        raise HTTPException(
            status_code=400,
            detail={"code": "FACE_NOT_DETECTED", "message": "Không thể trích xuất khuôn mặt phù hợp"},
        )

    # 4. Kiểm tra chất lượng khuôn mặt (tối thiểu 80x80 px)
    x1, y1, x2, y2 = largest_face.bbox.astype(float).tolist()
    face_width = x2 - x1
    face_height = y2 - y1

    if face_width < MIN_FACE_WIDTH or face_height < MIN_FACE_HEIGHT:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "FACE_LOW_QUALITY",
                "message": f"Khuôn mặt quá nhỏ ({int(face_width)}x{int(face_height)}px). Yêu cầu tối thiểu {MIN_FACE_WIDTH}x{MIN_FACE_HEIGHT}px",
            },
        )

    # 5. Lấy embedding và chuẩn hóa L2
    raw_embedding = largest_face.embedding
    if raw_embedding is None or len(raw_embedding) == 0:
        raise HTTPException(
            status_code=500,
            detail={"code": "EMBEDDING_FAILED", "message": "Không thể tạo vector đặc trưng khuôn mặt"},
        )

    norm_embedding = l2_normalize(np.array(raw_embedding, dtype=np.float32))

    confidence = float(largest_face.det_score) if hasattr(largest_face, "det_score") else 1.0

    return {
        "embedding": norm_embedding.tolist(),
        "model_version": "buffalo_l",
        "face_detected": True,
        "bbox": [round(coord, 2) for coord in [x1, y1, x2, y2]],
        "confidence": round(confidence, 4),
    }
