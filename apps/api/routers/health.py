"""
Health check роутер.

Предоставляет эндпоинт для проверки работоспособности сервиса.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from ..settings import settings

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    """Ответ health check эндпоинта."""
    status: str
    service: str


@router.get("", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Проверка работоспособности сервиса.
    
    Returns:
        HealthResponse с информацией о статусе сервиса
    """
    return HealthResponse(
        status="ok",
        service=settings.service_name,
    )



