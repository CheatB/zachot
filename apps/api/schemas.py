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
    # Система кредитов
    creditsBalance: int = 5  # Текущий баланс кредитов
    creditsUsed: int = 0     # Использовано за период


class UserCapabilities(BaseModel):
    streamingAvailable: bool
    maxTokensPerRequest: int
    priority: Literal['low', 'normal', 'high']
    resultPersistence: bool


class MeResponse(BaseModel):
    id: UUID
    role: str
    email: Optional[str] = None
    telegram_username: Optional[str] = None
    subscription: UserSubscriptionInfo
    usage: UserUsageInfo
    fairUseMode: Literal['normal', 'degraded', 'strict']
    capabilities: UserCapabilities


class UserAdminResponse(BaseModel):
    id: UUID
    email: str
    role: str
    created_at: datetime
    generations_used: int
    generations_limit: int
    tokens_used: int
    tokens_limit: int
    subscription_status: str


class UsersAdminResponse(BaseModel):
    items: list[UserAdminResponse]


class UserRoleUpdateRequest(BaseModel):
    role: Literal["admin", "user"]


class PaymentInitRequest(BaseModel):
    period: Literal['month', 'quarter', 'year']


class PaymentInitResponse(BaseModel):
    payment_url: str
    order_id: str
    payment_id: str


class TBankWebhook(BaseModel):
    TerminalKey: str
    OrderId: str
    Success: bool
    Status: str
    PaymentId: int
    ErrorCode: str
    Amount: int
    RebillId: Optional[int] = None
    CardId: Optional[int] = None
    Pan: Optional[str] = None
    ExpDate: Optional[str] = None
    Token: str
