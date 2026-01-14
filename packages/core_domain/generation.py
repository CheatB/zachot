"""
Сущность Generation - основная сущность генерации образовательного продукта.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from .enums import GenerationModule, GenerationStatus


class Generation(BaseModel):
    """
    Сущность генерации образовательного продукта.
    
    Представляет собой процесс создания контента (текста, презентации или задания)
    с отслеживанием статуса, шагов и артефактов.
    """
    
    id: UUID = Field(..., description="Уникальный идентификатор генерации")
    user_id: UUID = Field(..., description="Идентификатор пользователя, создавшего генерацию")
    module: GenerationModule = Field(..., description="Тип модуля генерации")
    status: GenerationStatus = Field(..., description="Текущий статус генерации")
    
    title: Optional[str] = Field(None, description="Заголовок/тема генерации")
    work_type: Optional[str] = Field(None, description="Тип академической работы")
    complexity_level: str = Field("student", description="Уровень сложности")
    humanity_level: str = Field("medium", description="Уровень очеловечивания")
    
    created_at: datetime = Field(..., description="Время создания генерации")
    updated_at: datetime = Field(..., description="Время последнего обновления")
    started_at: Optional[datetime] = Field(None, description="Время начала генерации")
    finished_at: Optional[datetime] = Field(None, description="Время завершения генерации")
    
    current_step_id: Optional[UUID] = Field(None, description="Идентификатор текущего активного шага")
    
    input_payload: dict = Field(default_factory=dict, description="Входные данные для генерации")
    settings_payload: dict = Field(default_factory=dict, description="Настройки генерации")
    result_content: Optional[str] = Field(None, description="Результат генерации (текст или JSON)")
    usage_metadata: list = Field(default_factory=list, description="Данные о расходе токенов и стоимости")
    
    cost_estimate: float = Field(0.0, ge=0.0, description="Оценка стоимости генерации")
    cost_actual: float = Field(0.0, ge=0.0, description="Фактическая стоимость генерации")
    
    abuse_score: int = Field(0, ge=0, description="Оценка злоупотребления (0 - норма, выше - подозрительно)")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> GenerationStatus:
        """Валидация статуса - должен быть из enum."""
        if isinstance(v, str):
            return GenerationStatus(v)
        return v
    
    @field_validator('module')
    @classmethod
    def validate_module(cls, v: str) -> GenerationModule:
        """Валидация модуля - должен быть из enum."""
        if isinstance(v, str):
            return GenerationModule(v)
        return v
    
    @model_validator(mode='after')
    def validate_timestamps(self) -> 'Generation':
        """
        Валидация временных меток:
        - finished_at не может быть раньше started_at
        - updated_at не может быть раньше created_at
        """
        if self.finished_at and self.started_at:
            if self.finished_at < self.started_at:
                raise ValueError(
                    f"finished_at ({self.finished_at}) cannot be earlier than started_at ({self.started_at})"
                )
        
        if self.updated_at < self.created_at:
            raise ValueError(
                f"updated_at ({self.updated_at}) cannot be earlier than created_at ({self.created_at})"
            )
        
        return self
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"Generation(id={self.id!r}, user_id={self.user_id!r}, "
            f"module={self.module.value}, status={self.status.value}, "
            f"current_step_id={self.current_step_id})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"Generation[{self.id.hex[:8]}...] "
            f"({self.module.value}, {self.status.value})"
        )



