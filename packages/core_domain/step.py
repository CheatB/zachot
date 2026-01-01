"""
Сущность Step - шаг процесса генерации.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from .enums import StepStatus


class Step(BaseModel):
    """
    Сущность шага генерации.
    
    Представляет отдельный этап процесса генерации контента.
    Каждый шаг имеет свой статус, входные/выходные данные и прогресс выполнения.
    """
    
    id: UUID = Field(..., description="Уникальный идентификатор шага")
    generation_id: UUID = Field(..., description="Идентификатор генерации, к которой относится шаг")
    step_type: str = Field(..., description="Тип шага (например, 'text_generation', 'validation', etc.)")
    status: StepStatus = Field(..., description="Текущий статус шага")
    
    input_payload: dict = Field(default_factory=dict, description="Входные данные для шага")
    output_payload: Optional[dict] = Field(None, description="Выходные данные шага (если выполнен)")
    error: Optional[dict] = Field(None, description="Информация об ошибке (если шаг завершился с ошибкой)")
    
    progress: int = Field(0, ge=0, le=100, description="Прогресс выполнения шага в процентах (0-100)")
    
    started_at: Optional[datetime] = Field(None, description="Время начала выполнения шага")
    finished_at: Optional[datetime] = Field(None, description="Время завершения шага")
    
    input_hash: str = Field(..., description="Хеш входных данных для дедупликации")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> StepStatus:
        """Валидация статуса - должен быть из enum."""
        if isinstance(v, str):
            return StepStatus(v)
        return v
    
    @field_validator('progress')
    @classmethod
    def validate_progress(cls, v: int) -> int:
        """Валидация прогресса - должен быть от 0 до 100."""
        if not 0 <= v <= 100:
            raise ValueError(f"progress must be between 0 and 100, got {v}")
        return v
    
    @model_validator(mode='after')
    def validate_timestamps(self) -> 'Step':
        """
        Валидация временных меток:
        - finished_at не может быть раньше started_at
        """
        if self.finished_at and self.started_at:
            if self.finished_at < self.started_at:
                raise ValueError(
                    f"finished_at ({self.finished_at}) cannot be earlier than started_at ({self.started_at})"
                )
        
        return self
    
    @model_validator(mode='after')
    def validate_status_consistency(self) -> 'Step':
        """
        Валидация согласованности статуса с данными:
        - Если статус SUCCEEDED, должен быть output_payload
        - Если статус FAILED, должен быть error
        """
        if self.status == StepStatus.SUCCEEDED and self.output_payload is None:
            raise ValueError("Step with status SUCCEEDED must have output_payload")
        
        if self.status == StepStatus.FAILED and self.error is None:
            raise ValueError("Step with status FAILED must have error")
        
        return self
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"Step(id={self.id!r}, generation_id={self.generation_id!r}, "
            f"step_type={self.step_type!r}, status={self.status.value}, "
            f"progress={self.progress}%)"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"Step[{self.id.hex[:8]}...] "
            f"({self.step_type}, {self.status.value}, {self.progress}%)"
        )

