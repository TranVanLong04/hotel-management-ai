from fastapi import APIRouter, Depends, UploadFile, File
from app.api.deps import verify_api_key
from app.models.schemas import BaseResponse, EmbedData
from app.services.embedding import extract_face_embedding

router = APIRouter(tags=["Face Embedding"])


@router.post(
    "/embed",
    response_model=BaseResponse[EmbedData],
    summary="Trích xuất vector đặc trưng khuôn mặt 512D từ ảnh",
)
async def embed_face(
    image: UploadFile = File(..., description="File ảnh khuôn mặt (JPG/PNG, tối đa 5MB)"),
    _: str = Depends(verify_api_key),
):
    """
    Nhận file ảnh multipart -> Phát hiện khuôn mặt -> Trích xuất vector 512 chiều chuẩn hóa L2.
    """
    image_bytes = await image.read()
    filename = image.filename or "face.jpg"

    result = extract_face_embedding(image_bytes=image_bytes, filename=filename)

    return BaseResponse(
        success=True,
        data=EmbedData(**result),
    )
