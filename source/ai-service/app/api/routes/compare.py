from fastapi import APIRouter, Depends
from app.api.deps import verify_api_key
from app.models.schemas import BaseResponse, CompareRequest, CompareData
from app.services.similarity import calculate_similarity

router = APIRouter(tags=["Face Comparison"])


@router.post(
    "/compare",
    response_model=BaseResponse[CompareData],
    summary="So khớp 2 vector embedding và kiểm tra theo ngưỡng",
)
async def compare_faces(
    payload: CompareRequest,
    _: str = Depends(verify_api_key),
):
    """
    So sánh 2 vector embedding 512D qua độ tương đồng Cosine Similarity.
    """
    threshold = payload.threshold if payload.threshold is not None else 0.75
    result = calculate_similarity(
        embedding1=payload.embedding1,
        embedding2=payload.embedding2,
        threshold=threshold,
    )

    return BaseResponse(
        success=True,
        data=CompareData(**result),
    )
