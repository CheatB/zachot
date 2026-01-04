"""
Модель записи стоимости (CostRecord).

Представляет одну запись о стоимости выполнения задачи.
Используется для учета использования LLM провайдеров.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CostRecord(BaseModel):
    """
    Запись о стоимости выполнения задачи.
    
    Immutable модель для хранения данных о стоимости использования LLM.
    Содержит информацию о провайдере, токенах, латентности и стоимости.
    
    Attributes:
        job_id: Идентификатор выполненной задачи
        generation_id: Идентификатор генерации
        user_id: Идентификатор пользователя (опционально)
        provider_name: Название LLM провайдера (например, "openai", "deepseek")
        tokens_used: Количество использованных токенов
        latency_ms: Время выполнения в миллисекундах
        cost_rub: Стоимость запроса в рублях
        recorded_at: Время записи
    
    Examples:
        >>> record = CostRecord(
        ...     job_id=UUID("..."),
        ...     generation_id=UUID("..."),
        ...     provider_name="openai",
        ...     tokens_used=1500,
        ...     latency_ms=1200,
        ...     cost_rub=0.15
        ... )
        >>> print(f"Cost: {record.cost_rub} RUB")
        Cost: 0.15 RUB
    """
    
    job_id: UUID = Field(..., description="Идентификатор выполненной задачи")
    generation_id: UUID = Field(..., description="Идентификатор генерации")
    user_id: Optional[UUID] = Field(None, description="Идентификатор пользователя (опционально)")
    
    provider_name: str = Field(..., description="Название LLM провайдера")
    tokens_used: int = Field(..., ge=0, description="Количество использованных токенов")
    latency_ms: int = Field(..., ge=0, description="Время выполнения в миллисекундах")
    cost_rub: float = Field(..., ge=0.0, description="Стоимость запроса в рублях")
    
    recorded_at: datetime = Field(
        default_factory=datetime.now,
        description="Время записи"
    )
    
    @field_validator('tokens_used')
    @classmethod
    def validate_tokens(cls, v: int) -> int:
        """Валидация: tokens_used должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"tokens_used must be >= 0, got {v}")
        return v
    
    @field_validator('latency_ms')
    @classmethod
    def validate_latency(cls, v: int) -> int:
        """Валидация: latency_ms должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"latency_ms must be >= 0, got {v}")
        return v
    
    @field_validator('cost_rub')
    @classmethod
    def validate_cost(cls, v: float) -> float:
        """Валидация: cost_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"cost_rub must be >= 0, got {v}")
        return v
    
    class Config:
        """Конфигурация Pydantic."""
        frozen = True  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"CostRecord(job_id={self.job_id!r}, generation_id={self.generation_id!r}, "
            f"provider={self.provider_name!r}, tokens={self.tokens_used}, "
            f"cost={self.cost_rub} RUB, latency={self.latency_ms}ms)"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"CostRecord[{self.job_id.hex[:8]}...] "
            f"({self.provider_name}, {self.tokens_used} tokens, "
            f"{self.cost_rub:.2f} RUB)"
        )


