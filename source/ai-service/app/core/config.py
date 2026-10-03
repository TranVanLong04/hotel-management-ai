import os
from functools import lru_cache
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Cấu hình ứng dụng nạp từ biến môi trường (.env)."""

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "info"

    # AI Model Settings
    MODEL_NAME: str = "buffalo_l"
    MODEL_ROOT: str = "D:/insightface_models"
    FACE_THRESHOLD: float = 0.75

    # Auth API Key
    API_KEY: str = "dev-key-12345"
    AI_SERVICE_API_KEY: str = ""

    # CORS configuration
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("API_KEY", mode="before")
    @classmethod
    def resolve_api_key(cls, v: str, info) -> str:
        # Hỗ trợ fallback giữa API_KEY và AI_SERVICE_API_KEY
        if v:
            return v
        ai_key = os.getenv("AI_SERVICE_API_KEY")
        if ai_key:
            return ai_key
        return "dev-key-12345"

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Singleton getter cho settings."""
    return Settings()
