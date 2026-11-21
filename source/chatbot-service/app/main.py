import time
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logger import logger
from app.api.routes.chat import router as chat_router

START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==================================================")
    logger.info("Grand Luxury Chatbot Service starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Listening on: {settings.HOST}:{settings.PORT}")
    logger.info(f"Chat Model: {settings.OPENAI_CHAT_MODEL}")
    logger.info(f"Embedding Model: {settings.OPENAI_EMBEDDING_MODEL}")
    logger.info("==================================================")
    yield
    logger.info("Grand Luxury Chatbot Service shutting down...")


app = FastAPI(
    title="Grand Luxury Hotel AI Chatbot Service",
    description="Intelligent AI Assistant powered by OpenAI GPT, RAG, and LangChain for Grand Luxury Hotel",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(chat_router)


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container probes and API gateway."""
    uptime_seconds = round(time.time() - START_TIME, 2)
    return {
        "status": "ok",
        "service": "grand-luxury-chatbot-service",
        "version": "1.0.0",
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development"),
    )
