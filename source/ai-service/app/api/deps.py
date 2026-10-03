from typing import Optional
from fastapi import Header, HTTPException, status
from app.core.config import get_settings


def verify_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> str:
    """
    Xác thực API Key từ request header 'X-API-Key'.
    Nếu thiếu hoặc không khớp sẽ trả về lỗi 401 UNAUTHORIZED.
    """
    settings = get_settings()
    expected_key = settings.API_KEY or settings.AI_SERVICE_API_KEY

    if not x_api_key or x_api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "API key không hợp lệ hoặc bị thiếu",
            },
        )

    return x_api_key
