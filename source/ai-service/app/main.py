import time
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, HTTPException

from app.core.config import get_settings
from app.core.logger import logger
from app.services.face_detection import get_face_app
from app.api.routes import health, embed, compare

from contextlib import asynccontextmanager

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Quản lý vòng đời khởi động và kết thúc của AI Service."""
    logger.info("Đang khởi động AI Service...")
    try:
        # Preload model InsightFace
        get_face_app()
        logger.info("AI Service đã sẵn sàng tiếp nhận yêu cầu.")
    except Exception as e:
        logger.warning(f"Chưa thể preload model lúc startup: {e}. Model sẽ được nạp khi có request đầu tiên.")
    
    yield
    logger.info("AI Service đang dừng...")


app = FastAPI(
    title="Hotel Management AI Service",
    description="Dịch vụ AI nhận diện khuôn mặt phục vụ Check-in khách sạn",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 1. Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Middleware ghi nhận Request Logging (Đo latency, không log dữ liệu nhạy cảm)
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    endpoint = request.url.path
    method = request.method

    try:
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        # Ghi log chuẩn JSON, tuyệt đối không log body/image/embedding/api_key
        logger.info(
            f"{method} {endpoint} -> {response.status_code} ({duration_ms}ms)",
            extra={
                "method": method,
                "endpoint": endpoint,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(
            f"{method} {endpoint} -> Exception: {str(exc)} ({duration_ms}ms)",
            extra={
                "method": method,
                "endpoint": endpoint,
                "status_code": 500,
                "duration_ms": duration_ms,
            },
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Lỗi xử lý nội bộ tại máy chủ AI Service",
                },
            },
        )


# 3. Custom Exception Handlers chuẩn hóa Response Error Envelope
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Xử lý các lỗi HTTPException trả về envelope { success: false, error: { code, message } }."""
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        error_code = exc.detail.get("code", "ERROR")
        error_message = exc.detail.get("message", "Đã xảy ra lỗi")
    else:
        error_code = "HTTP_ERROR" if exc.status_code != 401 else "UNAUTHORIZED"
        error_message = str(exc.detail) if exc.detail else "Đã xảy ra lỗi"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": error_message,
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Xử lý lỗi validate dữ liệu đầu vào Pydantic."""
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    msg = first_error.get("msg", "Dữ liệu yêu cầu không hợp lệ")
    field = ".".join(str(x) for x in first_error.get("loc", []))
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"{field}: {msg}" if field else msg,
            },
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Xử lý tất cả lỗi chưa bắt được khác (500)."""
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Lỗi xử lý nội bộ tại máy chủ AI Service",
            },
        },
    )


# 4. Gắn các router endpoints
app.include_router(health.router)
app.include_router(embed.router)
app.include_router(compare.router)
