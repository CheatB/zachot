"""
Pydantic схемы для API запросов и ответов.
"""

from datetime import datetime
from typing import Literal, Optional, List, Dict, Any, Union
from uuid import UUID

from pydantic import BaseModel, Field

from packages.core_domain.enums import GenerationModule, GenerationStatus


class JobQueuedResponse(BaseModel):
    """
    Ответ на постановку Job в очередь.
    """
    job_id: UUID = Field(..., description="Идентификатор задачи")
    status: Literal["queued"] = Field("queued", description="Статус задачи")


class GenerationInputPayload(BaseModel):
    topic: Optional[str] = None
    input: Optional[str] = None
    goal: Optional[str] = None
    idea: Optional[str] = None
    volume: Optional[int] = None
    current_step: Optional[float] = None
    presentation_style: Optional[str] = None
    task_mode: Optional[str] = None
    use_ai_images: Optional[bool] = None
    use_smart_processing: Optional[bool] = None
    has_files: Optional[bool] = None


class GenerationSettingsPayload(BaseModel):
    structure: Optional[List[Dict[str, Any]]] = None
    sources: Optional[List[Dict[str, Any]]] = None
    formatting: Optional[Dict[str, Any]] = None


class GenerationCreateRequest(BaseModel):
    """
    Запрос на создание Generation.
    """
    module: GenerationModule = Field(..., description="Тип модуля генерации")
    work_type: Optional[str] = Field(None, description="Тип академической работы")
    complexity_level: str = Field("student", description="Уровень сложности")
    humanity_level: Union[str, int] = Field("medium", description="Уровень очеловечивания (строка или число 0-100)")
    input_payload: GenerationInputPayload = Field(..., description="Входные данные для генерации")
    settings_payload: Optional[GenerationSettingsPayload] = Field(None, description="Настройки генерации")


class GenerationUpdateRequest(BaseModel):
    """
    Запрос на обновление Generation.
    """
    input_payload: Optional[GenerationInputPayload] = None
    settings_payload: Optional[GenerationSettingsPayload] = None
    result_content: Optional[str] = None  # Для редактирования готового текста


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
    humanity_level: Union[str, int] = Field("medium", description="Уровень очеловечивания (строка или число)")
    created_at: datetime = Field(..., description="Время создания генерации")
    updated_at: datetime = Field(..., description="Время последнего обновления")
    input_payload: GenerationInputPayload = Field(..., description="Входные данные для генерации")
    settings_payload: GenerationSettingsPayload = Field(default_factory=GenerationSettingsPayload, description="Настройки генерации")
    usage_metadata: list = Field(default_factory=list, description="Данные о расходе токенов и стоимости")
    result_content: Optional[str] = None
    
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
    creditsBalance: int = 5
    creditsUsed: int = 0


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
    created_at: Optional[datetime] = None
    generations_used: int
    generations_limit: int
    tokens_used: int
    tokens_limit: int
    subscription_status: str


class UsersAdminResponse(BaseModel):
    items: list[UserAdminResponse]


class DailyStat(BaseModel):
    date: str
    tokens: int
    jobs: int


class AdminAnalyticsResponse(BaseModel):
    revenueRub: int
    apiCostsUsd: float
    marginPercent: int
    totalJobs: int
    dailyStats: list[DailyStat]


class AdminGenerationUsage(BaseModel):
    model: str
    tokens: int
    cost_usd: float
    stage: str


class AdminGenerationHistoryItem(BaseModel):
    id: UUID
    title: Optional[str]
    module: str
    status: str
    created_at: datetime
    user_email: str
    usage_metadata: list[AdminGenerationUsage]
    total_tokens: int
    total_cost_rub: float
    estimated_revenue_rub: float
    estimated_profit_rub: float


class AdminGenerationHistoryResponse(BaseModel):
    items: list[AdminGenerationHistoryItem]


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


class SuggestDetailsRequest(BaseModel):
    topic: str
    module: Optional[str] = None
    complexity: str = "student"
    humanity: Union[str, int] = 50  # Поддержка старых строк и новых чисел


class SuggestStructureRequest(BaseModel):
    topic: str
    goal: str
    idea: str
    module: Optional[str] = None
    workType: Optional[str] = None
    volume: int = 10
    complexity: str = "student"
    humanity: str = "medium"

class SuggestSourcesRequest(BaseModel):
    topic: str
    goal: str
    idea: str
    module: Optional[str] = None
    workType: Optional[str] = None
    volume: int = 10
    complexity: str = "student"
    humanity: str = "medium"

class SuggestTitleInfoRequest(BaseModel):
    university: str

class SearchMoreSourcesRequest(BaseModel):
    generation_id: UUID
    current_sources_count: int = 0

class UploadFileSourceRequest(BaseModel):
    generation_id: UUID
    file_name: str
    file_content: str  # Base64 encoded content
    file_type: str  # pdf, docx, txt
