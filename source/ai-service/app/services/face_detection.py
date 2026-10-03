from typing import Optional
from insightface.app import FaceAnalysis
from app.core.config import get_settings
from app.core.logger import logger

_face_app: Optional[FaceAnalysis] = None


def get_face_app() -> FaceAnalysis:
    """Singleton getter để lazy load mô hình InsightFace FaceAnalysis."""
    global _face_app
    if _face_app is None:
        settings = get_settings()
        logger.info(f"Đang khởi tạo mô hình FaceAnalysis ({settings.MODEL_NAME})...")
        
        # Khởi tạo FaceAnalysis với CPUExecutionProvider và lưu cache trên ổ đĩa cấu hình
        app = FaceAnalysis(
            name=settings.MODEL_NAME,
            root=settings.MODEL_ROOT,
            providers=["CPUExecutionProvider"],
        )
        app.prepare(ctx_id=0, det_size=(640, 640))
        _face_app = app
        logger.info(f"Mô hình {settings.MODEL_NAME} đã nạp thành công.")
    
    return _face_app


def is_model_loaded() -> bool:
    """Kiểm tra xem mô hình AI đã được nạp vào bộ nhớ hay chưa."""
    global _face_app
    return _face_app is not None
