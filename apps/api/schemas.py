"""
Pydantic схемы для API запросов и ответов.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from packages.core_domain.enums import GenerationModule, GenerationStatus


class JobQueuedResponse(BaseModel):
    """
    Ответ на постановку Job в очередь.
    """
    job_id: UUID = Field(..., description="Идентификатор задачи")
    status: Literal["queued"] = Field("queued", description="Статус задачи")


class GenerationCreateRequest(BaseModel):
    """
    Запрос на создание Generation.
    """
    module: GenerationModule = Field(..., description="Тип модуля генерации")
    work_type: Optional[str] = Field(None, description="Тип академической работы")
    complexity_level: str = Field("student", description="Уровень сложности")
    humanity_level: int = Field(50, description="Уровень очеловечивания (0-100)")
    input_payload: dict = Field(default_factory=dict, description="Входные данные для генерации")
    settings_payload: Optional[dict] = Field(None, description="Настройки генерации")


class GenerationUpdateRequest(BaseModel):
    """
    Запрос на обновление Generation.
    """
    input_payload: Optional[dict] = Field(None, description="Входные данные для генерации")
    settings_payload: Optional[dict] = Field(None, description="Настройки генерации")


class ActionRequest(BaseModel):
    """
    Запрос на выполнение действия над Generation.
    """
    action: Literal["next", "confirm", "cancel"] = Field(
        ...,
        description="Действие для выполнения над Generation"
    )


class GenerationResponse(BaseModel):
    """
    Ответ с информацией о Generation.
    """
    id: UUID = Field(..., description="Уникальный идентификатор генерации")
    module: GenerationModule = Field(..., description="Тип модуля генерации")
    status: GenerationStatus = Field(..., description="Текущий статус генерации")
    title: Optional[str] = Field(None, description="Заголовок/тема генерации")
    work_type: Optional[str] = Field(None, description="Тип академической работы")
    complexity_level: str = Field("student", description="Уровень сложности")
    humanity_level: int = Field(50, description="Уровень очеловечивания")
    created_at: datetime = Field(..., description="Время создания генерации")
    updated_at: datetime = Field(..., description="Время последнего обновления")
    input_payload: dict = Field(..., description="Входные данные для генерации")
    settings_payload: dict = Field(default_factory=dict, description="Настройки генерации")
    
    class Config:
        from_attributes = True


class GenerationsResponse(BaseModel):
    """
    Ответ со списком генераций.
    """
    items: list[GenerationResponse]


class UserSubscriptionInfo(BaseModel):
    planName: str
    status: Literal["active", "expiring", "paused"]
    monthlyPriceRub: int
    nextBillingDate: Optional[datetime] = None


class UserUsageInfo(BaseModel):
    generationsUsed: int
    generationsLimit: int
    tokensUsed: int = 0
    tokensLimit: int


class MeResponse(BaseModel):
    id: UUID
    subscription: UserSubscriptionInfo
    usage: UserUsageInfo
