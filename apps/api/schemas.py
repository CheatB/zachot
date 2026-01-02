"""
Pydantic схемы для API запросов и ответов.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from packages.core_domain.enums import GenerationModule, GenerationStatus


class GenerationCreateRequest(BaseModel):
    """
    Запрос на создание Generation.
    
    Attributes:
        module: Тип модуля генерации (TEXT, PRESENTATION, TASK)
        input_payload: Входные данные для генерации
        settings_payload: Настройки генерации (опционально)
    """
    
    module: GenerationModule = Field(..., description="Тип модуля генерации")
    input_payload: dict = Field(default_factory=dict, description="Входные данные для генерации")
    settings_payload: Optional[dict] = Field(None, description="Настройки генерации")


class GenerationUpdateRequest(BaseModel):
    """
    Запрос на обновление Generation.
    
    Позволяет обновить input_payload и/или settings_payload.
    Обновляются только переданные поля (partial update).
    
    Attributes:
        input_payload: Новые входные данные (опционально)
        settings_payload: Новые настройки генерации (опционально)
    """
    
    input_payload: Optional[dict] = Field(None, description="Входные данные для генерации")
    settings_payload: Optional[dict] = Field(None, description="Настройки генерации")


class ActionRequest(BaseModel):
    """
    Запрос на выполнение действия над Generation.
    
    Поддерживаемые действия:
    - "next": переход DRAFT → RUNNING
    - "confirm": переход WAITING_USER → RUNNING
    - "cancel": переход любого статуса → CANCELED
    
    Attributes:
        action: Тип действия для выполнения
    """
    
    action: Literal["next", "confirm", "cancel"] = Field(
        ...,
        description="Действие для выполнения над Generation"
    )


class GenerationResponse(BaseModel):
    """
    Ответ с информацией о Generation.
    
    Attributes:
        id: Уникальный идентификатор генерации
        module: Тип модуля генерации
        status: Текущий статус генерации
        created_at: Время создания
        updated_at: Время последнего обновления
        input_payload: Входные данные
        settings_payload: Настройки генерации
    """
    
    id: UUID = Field(..., description="Уникальный идентификатор генерации")
    module: GenerationModule = Field(..., description="Тип модуля генерации")
    status: GenerationStatus = Field(..., description="Текущий статус генерации")
    created_at: datetime = Field(..., description="Время создания генерации")
    updated_at: datetime = Field(..., description="Время последнего обновления")
    input_payload: dict = Field(..., description="Входные данные для генерации")
    settings_payload: dict = Field(default_factory=dict, description="Настройки генерации")
    
    class Config:
        """Конфигурация Pydantic."""
        from_attributes = True

