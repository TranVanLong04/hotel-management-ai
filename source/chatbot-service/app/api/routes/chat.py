from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.core.logger import logger
from app.agent.orchestrator import AgentOrchestrator

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])

orchestrator = AgentOrchestrator()


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Nội dung câu hỏi của người dùng")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Lịch sử hội thoại trước đó")
    user_id: Optional[str] = Field(default=None, description="UUID người dùng nếu đã đăng nhập")
    role: Optional[str] = Field(default="customer", description="Role của người dùng (customer/admin/staff)")
    token: Optional[str] = Field(default=None, description="JWT Bearer token của người dùng")


class ChatMessageResponse(BaseModel):
    reply: str
    ui_type: str = "text"
    ui_payload: Optional[Any] = None
    suggested_actions: List[str] = []
    context_chunks_count: int = 0


@router.post("/message", response_model=ChatMessageResponse)
async def chat_message(req: ChatMessageRequest):
    """Xử lý tin nhắn người dùng qua RAG và Gemini Flash LLM."""
    try:
        result = orchestrator.process_message(
            message=req.message,
            history=req.history,
            user_id=req.user_id,
            role=req.role or "customer",
            token=req.token,
        )
        return result
    except Exception as e:
        logger.error(f"Lỗi xử lý chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xử lý từ Chatbot Service: {str(e)}",
        )

