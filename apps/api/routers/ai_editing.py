"""
AI Editing Router
Эндпоинты для AI-редактирования текста
"""

from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from pydantic import BaseModel
from typing import Literal, Optional

from ..dependencies import get_current_user
from ..storage import generation_store
from ..database import User as UserDB
from packages.ai_services.src.text_editor import text_editor_service

router = APIRouter(prefix="/generations", tags=["ai-editing"])


class AIEditRequest(BaseModel):
    text: str
    action: Literal['rewrite', 'shorter', 'longer']
    context: Optional[str] = None


class AIEditResponse(BaseModel):
    edited_text: str
    tokens_used: int
    model_used: str


class AIGenerateContentRequest(BaseModel):
    type: Literal['chart', 'table', 'custom']
    instruction: Optional[str] = None
    context: Optional[str] = None


class AIGenerateContentResponse(BaseModel):
    content: str
    tokens_used: int
    model_used: str


@router.post("/{generation_id}/ai-edit", response_model=AIEditResponse)
async def ai_edit_text(
    generation_id: UUID,
    request: AIEditRequest,
    user: UserDB = Depends(get_current_user)
):
    """
    Редактирование текста с помощью AI
    """
    generation = generation_store.get(generation_id)
    if not generation or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    try:
        result = await text_editor_service.edit_text(
            text=request.text,
            action=request.action,
            context=request.context or generation.result_content or "",
            work_type=generation.work_type or "other"
        )
        
        return AIEditResponse(
            edited_text=result["edited_text"],
            tokens_used=result["tokens_used"],
            model_used=result["model_used"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI editing failed: {str(e)}")


@router.post("/{generation_id}/ai-generate", response_model=AIGenerateContentResponse)
async def ai_generate_content(
    generation_id: UUID,
    request: AIGenerateContentRequest,
    user: UserDB = Depends(get_current_user)
):
    """
    Генерация дополнительного контента (графики, таблицы)
    """
    generation = generation_store.get(generation_id)
    if not generation or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    try:
        result = await text_editor_service.generate_content(
            content_type=request.type,
            instruction=request.instruction,
            context=generation.result_content or "",
            work_type=generation.work_type or "other"
        )
        
        return AIGenerateContentResponse(
            content=result["content"],
            tokens_used=result["tokens_used"],
            model_used=result["model_used"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

