import os
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings for Chatbot Service."""

    # Server info
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Supabase (PostgreSQL + pgvector)
    SUPABASE_URL: str = Field(default="", description="Supabase project URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase service role secret key")

    # OpenAI API (Chat LLM & Embeddings)
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key")
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Google Maps Platform
    GOOGLE_MAPS_API_KEY: str = Field(default="", description="Google Maps Platform API key")
    HOTEL_NAME: str = "Grand Luxury Hotel Danang"
    HOTEL_ADDRESS: str = "28 Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng, Việt Nam"
    HOTEL_LAT: float = 16.0645
    HOTEL_LNG: float = 108.2468

    # Backend Gateway

    BACKEND_API_URL: str = "http://localhost:3000"

    # CORS configuration
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000"]

    # Chatbot parameters
    CHATBOT_MAX_HISTORY_MESSAGES: int = 20
    CHATBOT_MAX_TOOL_CALLS: int = 5
    CHATBOT_REQUEST_TIMEOUT_SECONDS: int = 20

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
