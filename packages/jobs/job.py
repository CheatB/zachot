"""
Контракт задачи (Job) для выполнения воркером.

Job представляет собой единицу работы, которую должен выполнить воркер.
Содержит всю необходимую информацию для выполнения задачи и отслеживания её состояния.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from .enums import JobStatus, JobType


class Job(BaseModel):
    """
    Контракт задачи для выполнения воркером.
    
    Представляет единицу работы, которая должна быть выполнена асинхронно.
    Содержит входные данные, метаданные о выполнении и статус.
    
    Attributes:
        id: Уникальный идентификатор задачи
        type: Тип задачи (определяет, какой воркер должен её выполнить)
        generation_id: Идентификатор генерации, к которой относится задача
        step_id: Идентификатор шага, к которому относится задача (опционально)
        input_payload: Входные данные для выполнения задачи
        status: Текущий статус выполнения задачи
        retries: Количество попыток выполнения (начинается с 0)
        max_retries: Максимальное количество попыток
        created_at: Время создания задачи
        started_at: Время начала выполнения (если начата)
        finished_at: Время завершения выполнения (если завершена)
    """
    
    id: UUID = Field(..., description="Уникальный идентификатор задачи")
    type: JobType = Field(..., description="Тип задачи")
    generation_id: UUID = Field(..., description="Идентификатор генерации")
    step_id: Optional[UUID] = Field(None, description="Идентификатор шага (если применимо)")
    
    input_payload: dict = Field(default_factory=dict, description="Входные данные для выполнения задачи")
    
    status: JobStatus = Field(..., description="Текущий статус выполнения задачи")
    
    retries: int = Field(0, ge=0, description="Количество попыток выполнения")
    max_retries: int = Field(3, ge=0, description="Максимальное количество попыток")
    
    created_at: datetime = Field(..., description="Время создания задачи")
    started_at: Optional[datetime] = Field(None, description="Время начала выполнения")
    finished_at: Optional[datetime] = Field(None, description="Время завершения выполнения")
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> JobType:
        """Валидация типа задачи - должен быть из enum."""
        if isinstance(v, str):
            return JobType(v)
        return v
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> JobStatus:
        """Валидация статуса - должен быть из enum."""
        if isinstance(v, str):
            return JobStatus(v)
        return v
    
    @field_validator('retries')
    @classmethod
    def validate_retries(cls, v: int) -> int:
        """Валидация количества попыток - должно быть неотрицательным."""
        if v < 0:
            raise ValueError(f"retries must be >= 0, got {v}")
        return v
    
    @field_validator('max_retries')
    @classmethod
    def validate_max_retries(cls, v: int) -> int:
        """Валидация максимального количества попыток - должно быть неотрицательным."""
        if v < 0:
            raise ValueError(f"max_retries must be >= 0, got {v}")
        return v
    
    @model_validator(mode='after')
    def validate_timestamps(self) -> 'Job':
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
    def validate_retries_limit(self) -> 'Job':
        """
        Валидация ограничения попыток:
        - retries не может превышать max_retries
        """
        if self.retries > self.max_retries:
            raise ValueError(
                f"retries ({self.retries}) cannot exceed max_retries ({self.max_retries})"
            )
        
        return self
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"Job(id={self.id!r}, type={self.type.value}, "
            f"generation_id={self.generation_id!r}, status={self.status.value}, "
            f"retries={self.retries}/{self.max_retries})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"Job[{self.id.hex[:8]}...] "
            f"({self.type.value}, {self.status.value}, {self.retries}/{self.max_retries})"
        )



