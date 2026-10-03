import time
from fastapi import APIRouter
from app.models.schemas import BaseResponse, HealthData
from app.services.face_detection import is_model_loaded

router = APIRouter(tags=["Health"])
START_TIME = time.time()


@router.get(
    "/health",
    response_model=BaseResponse[HealthData],
    summary="Kiểm tra trạng thái hoạt động của AI Service",
)
async def health_check():
    """Endpoint kiểm tra sức khỏe của service và trạng thái nạp mô hình AI."""
    uptime = time.time() - START_TIME
    model_status = is_model_loaded()

    return BaseResponse(
        success=True,
        data=HealthData(
            status="ok",
            model_loaded=model_status,
            uptime_seconds=round(uptime, 2),
            version="1.0.0",
        ),
    )
