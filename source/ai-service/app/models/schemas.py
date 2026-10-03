from typing import List, Optional, Any, Generic, TypeVar
from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Cấu trúc chi tiết lỗi chuẩn hóa."""
    code: str = Field(..., description="Mã lỗi hệ thống (VD: FACE_NOT_DETECTED)")
    message: str = Field(..., description="Mô tả thông báo lỗi")


class BaseResponse(BaseModel, Generic[T]):
    """Chuẩn hóa response thành công theo format { success: true, data: ... }."""
    success: bool = True
    data: T


class ErrorResponse(BaseModel):
    """Chuẩn hóa response thất bại theo format { success: false, error: { code, message } }."""
    success: bool = False
    error: ErrorDetail


class HealthData(BaseModel):
    """Thông tin trạng thái hoạt động của AI Service."""
    status: str = "ok"
    model_loaded: bool
    uptime_seconds: float
    version: str = "1.0.0"


class EmbedData(BaseModel):
    """Dữ liệu trích xuất vector khuôn mặt từ ảnh."""
    embedding: List[float] = Field(..., description="Vector 512 chiều đã chuẩn hóa L2")
    model_version: str = Field(default="buffalo_l", description="Tên mô hình trích xuất")
    face_detected: bool = True
    bbox: Optional[List[float]] = Field(default=None, description="Tọa độ bounding box [x1, y1, x2, y2]")
    confidence: Optional[float] = Field(default=None, description="Độ tin cậy phát hiện khuôn mặt")


class CompareRequest(BaseModel):
    """Yêu cầu so khớp giữa 2 vector embedding."""
    embedding1: List[float] = Field(..., description="Vector embedding thứ nhất (512 chiều)")
    embedding2: List[float] = Field(..., description="Vector embedding thứ hai (512 chiều)")
    threshold: Optional[float] = Field(default=0.75, description="Ngưỡng so khớp (mặc định 0.75)")

    @field_validator("embedding1", "embedding2")
    @classmethod
    def validate_dimension(cls, v: List[float]) -> List[float]:
        if len(v) != 512:
            raise ValueError(f"Vector embedding phải có đúng 512 chiều, nhận được {len(v)} chiều")
        return v


class CompareData(BaseModel):
    """Kết quả so khớp vector khuôn mặt."""
    similarity: float = Field(..., description="Độ tương đồng cosine similarity [-1, 1]")
    is_match: bool = Field(..., description="True nếu similarity >= threshold")
    threshold: float = Field(..., description="Ngưỡng đã áp dụng để so khớp")
    distance: float = Field(..., description="Khoảng cách cosine (1 - similarity)")
