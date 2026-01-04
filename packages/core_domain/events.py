"""
Domain events для системы генераций.

События представляют важные изменения в доменной модели,
которые должны быть обработаны другими частями системы.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .enums import GenerationStatus, StepStatus


class DomainEvent(BaseModel):
    """
    Базовый класс для всех domain events.
    
    Все события должны наследоваться от этого класса.
    Содержит общие поля для всех событий.
    
    Attributes:
        occurred_at: Время возникновения события
    """
    
    occurred_at: datetime = Field(
        default_factory=datetime.now,
        description="Время возникновения события"
    )
    
    class Config:
        """Конфигурация Pydantic."""
        from_attributes = True


class GenerationUpdated(DomainEvent):
    """
    Событие обновления Generation.
    
    Публикуется при изменении статуса или других важных полей Generation.
    
    Attributes:
        generation_id: Идентификатор обновлённой генерации
        status: Новый статус генерации
    """
    
    generation_id: UUID = Field(..., description="Идентификатор генерации")
    status: GenerationStatus = Field(..., description="Новый статус генерации")
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"GenerationUpdated(generation_id={self.generation_id!r}, "
            f"status={self.status.value}, occurred_at={self.occurred_at})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"GenerationUpdated[{self.generation_id.hex[:8]}...] "
            f"({self.status.value})"
        )


class StepUpdated(DomainEvent):
    """
    Событие обновления Step.
    
    Публикуется при изменении статуса, прогресса или других важных полей Step.
    
    Attributes:
        step_id: Идентификатор обновлённого шага
        generation_id: Идентификатор генерации, к которой относится шаг
        status: Новый статус шага
        progress: Новый прогресс выполнения (0-100)
    """
    
    step_id: UUID = Field(..., description="Идентификатор шага")
    generation_id: UUID = Field(..., description="Идентификатор генерации")
    status: StepStatus = Field(..., description="Новый статус шага")
    progress: int = Field(..., ge=0, le=100, description="Прогресс выполнения (0-100)")
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"StepUpdated(step_id={self.step_id!r}, generation_id={self.generation_id!r}, "
            f"status={self.status.value}, progress={self.progress}%, "
            f"occurred_at={self.occurred_at})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"StepUpdated[{self.step_id.hex[:8]}...] "
            f"({self.status.value}, {self.progress}%)"
        )



