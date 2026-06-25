from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, AsyncGenerator
from app.services.gemini_service import GeminiService, GeminiError
from app.services.safety import check_messages, BLOCK_RESPONSE
import logging

router = APIRouter()
logger = logging.getLogger('nexa.chat')


class ChatMessageInput(BaseModel):
    role: str
    parts: List[Dict[str, str]]


class ChatRequest(BaseModel):
    conversation_id: str
    messages: List[ChatMessageInput]
    temperature: float = 0.7
    model: str = "gemini-2.5-flash"


class TestRequest(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    error_code: str
    detail: str


def _make_block_stream(message: str) -> AsyncGenerator[str, None]:
    yield message


@router.post("/test")
async def test_chat(request: TestRequest):
    try:
        messages = [{"role": "user", "parts": [{"text": request.message}]}]

        blocked = check_messages(messages)
        if blocked:
            return {"response": blocked, "blocked": True}

        service = GeminiService()
        response_text = ""
        async for chunk in service.stream_chat(messages):
            response_text += chunk
        return {"response": response_text}

    except GeminiError as e:
        logger.warning(f"GeminiError in /test: code={e.error_code}")
        return {"error": e.message, "error_code": e.error_code}
    except Exception as e:
        logger.error(f"Unexpected error in /test: {e}", exc_info=True)
        return {"error": "An unexpected issue occurred while processing your request.", "error_code": "unknown"}


@router.post("/stream")
async def stream_chat_response(request: ChatRequest):
    logger.info(f"POST /api/chat/stream received: conversation_id={request.conversation_id}, messages_count={len(request.messages)}")
    try:
        formatted_messages = []
        for msg in request.messages:
            formatted_messages.append({
                "role": msg.role,
                "parts": msg.parts
            })

        blocked = check_messages(formatted_messages)
        if blocked:
            logger.warning(f"Safety layer blocked request: {blocked[:50]}...")
            return StreamingResponse(
                _make_block_stream(blocked),
                media_type="text/event-stream",
                headers={"X-Error-Code": "safety_block"},
            )

        try:
            service = GeminiService()
        except GeminiError as e:
            logger.warning(f"GeminiError on service init: code={e.error_code}")
            return StreamingResponse(
                _make_block_stream(e.message),
                media_type="text/event-stream",
                headers={"X-Error-Code": e.error_code},
            )

        async def generate_chunks():
            try:
                async for chunk in service.stream_chat(formatted_messages, request.temperature, request.model):
                    yield chunk
            except GeminiError as e:
                logger.warning(f"GeminiError during streaming: code={e.error_code}")
                yield e.message
            except Exception as e:
                logger.error(f"Unexpected error during streaming: {e}", exc_info=True)
                yield "An unexpected issue occurred while processing your request."

        return StreamingResponse(generate_chunks(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Unexpected error in /stream: {e}", exc_info=True)
        return StreamingResponse(
            _make_block_stream("An unexpected issue occurred while processing your request."),
            media_type="text/event-stream",
            headers={"X-Error-Code": "unknown"},
        )
