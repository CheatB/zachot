"""
Контракт результата выполнения задачи (JobResult).

JobResult представляет результат выполнения Job воркером.
Содержит либо успешный результат с output_payload, либо ошибку.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class JobResult(BaseModel):
    """
    Контракт результата выполнения задачи.
    
    Представляет результат выполнения Job воркером.
    Может быть успешным (с output_payload) или неуспешным (с error).
    
    Attributes:
        job_id: Идентификатор выполненной задачи
        success: Флаг успешности выполнения
        output_payload: Выходные данные задачи (если успешно)
        error: Информация об ошибке (если неуспешно)
        finished_at: Время завершения выполнения
    """
    
    job_id: UUID = Field(..., description="Идентификатор выполненной задачи")
    success: bool = Field(..., description="Флаг успешности выполнения")
    
    output_payload: Optional[dict] = Field(None, description="Выходные данные задачи (если успешно)")
    error: Optional[dict] = Field(None, description="Информация об ошибке (если неуспешно)")
    
    finished_at: datetime = Field(..., description="Время завершения выполнения")
    
    @model_validator(mode='after')
    def validate_result_consistency(self) -> 'JobResult':
        """
        Валидация согласованности результата:
        - Если success=True, должен быть output_payload
        - Если success=False, должен быть error
        """
        if self.success:
            if self.output_payload is None:
                raise ValueError(
                    "JobResult with success=True must have output_payload"
                )
            if self.error is not None:
                raise ValueError(
                    "JobResult with success=True should not have error"
                )
        else:
            if self.error is None:
                raise ValueError(
                    "JobResult with success=False must have error"
                )
            if self.output_payload is not None:
                raise ValueError(
                    "JobResult with success=False should not have output_payload"
                )
        
        return self
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        if self.success:
            result_info = f"output_payload keys: {list(self.output_payload.keys()) if self.output_payload else []}"
        else:
            result_info = f"error: {self.error}"
        
        return (
            f"JobResult(job_id={self.job_id!r}, success={self.success}, "
            f"{result_info})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "SUCCESS" if self.success else "FAILED"
        return (
            f"JobResult[{self.job_id.hex[:8]}...] "
            f"({status})"
        )

