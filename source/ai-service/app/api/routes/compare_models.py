#API So sánh mô hình:
#Endpoint POST /compare-models tiếp nhận request so sánh 2 ảnh cùng 2 ngưỡng threshold riêng biệt từ Backend.


from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
import onnxruntime as ort

from app.api.deps import verify_api_key
from app.core.logger import logger
from app.models.schemas import BaseResponse, CompareModelsResponseData
from app.services.comparison_service import compare_both_models_concurrently

router = APIRouter(tags=["Model Comparison"])


@router.post(
    "/compare-models",
    response_model=BaseResponse[CompareModelsResponseData],
    summary="Chạy song song FaceNet và InsightFace để so sánh hiệu năng và độ tương đồng",
)
async def compare_models(
    image1: UploadFile = File(..., description="Ảnh tham chiếu hoặc ảnh 1"),
    image2: UploadFile = File(..., description="Ảnh kiểm thử hoặc ảnh 2"),
    threshold_facenet: float = Form(default=0.75, description="Ngưỡng so khớp FaceNet"),
    threshold_insightface: float = Form(default=0.55, description="Ngưỡng so khớp InsightFace"),
    _: str = Depends(verify_api_key),
):
    """
    Tiếp nhận 2 file ảnh và điều phối chạy song song FaceNet & InsightFace.
    Mỗi mô hình sử dụng quy trình tiền xử lý và checkpoint độc lập.
    Không để lỗi ONNX Runtime chưa được kiểm soát gây sập HTTP 500.
    """
    try:
        img1_bytes = await image1.read()
        img2_bytes = await image2.read()

        result = await compare_both_models_concurrently(
            img1_bytes=img1_bytes,
            img2_bytes=img2_bytes,
            threshold_facenet=threshold_facenet,
            threshold_insightface=threshold_insightface,
        )

        return BaseResponse(
            success=True,
            data=CompareModelsResponseData(**result),
        )
    except HTTPException:
        raise
    except ort.OrtException as oe:
        logger.error(f"Lỗi ONNX Runtime trong quá trình compare-models: {oe}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "code": "MODEL_INFERENCE_ERROR",
                "message": f"Lỗi thực thi suy luận mô hình ONNX: {str(oe)}",
            },
        )
    except Exception as e:
        logger.error(f"Lỗi không xác định khi so sánh hai mô hình: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "code": "COMPARISON_FAILED",
                "message": "Không thể hoàn thành đối sánh hai mô hình AI. Vui lòng kiểm tra lại ảnh đầu vào.",
            },
        )
