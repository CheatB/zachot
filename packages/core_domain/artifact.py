"""
Сущность Artifact - артефакт, созданный в процессе генерации.
"""

from datetime import datetime
from typing import Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from .enums import ArtifactType


class Artifact(BaseModel):
    """
    Сущность артефакта генерации.
    
    Представляет результат генерации - документ, презентацию, решение задания
    или экспортированный файл. Может иметь несколько версий.
    """
    
    id: UUID = Field(..., description="Уникальный идентификатор артефакта")
    generation_id: UUID = Field(..., description="Идентификатор генерации, к которой относится артефакт")
    artifact_type: ArtifactType = Field(..., description="Тип артефакта")
    version: int = Field(1, ge=1, description="Версия артефакта (начинается с 1)")
    
    content: Union[str, dict] = Field(..., description="Содержимое артефакта (текст или структурированные данные)")
    file_ref: Optional[str] = Field(None, description="Ссылка на файл (если артефакт сохранен в файловой системе)")
    
    created_at: datetime = Field(..., description="Время создания артефакта")
    
    @field_validator('artifact_type')
    @classmethod
    def validate_artifact_type(cls, v: str) -> ArtifactType:
        """Валидация типа артефакта - должен быть из enum."""
        if isinstance(v, str):
            return ArtifactType(v)
        return v
    
    @field_validator('version')
    @classmethod
    def validate_version(cls, v: int) -> int:
        """Валидация версии - должна быть положительным числом."""
        if v < 1:
            raise ValueError(f"version must be >= 1, got {v}")
        return v
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        content_preview = (
            str(self.content)[:50] + "..." 
            if len(str(self.content)) > 50 
            else str(self.content)
        )
        return (
            f"Artifact(id={self.id!r}, generation_id={self.generation_id!r}, "
            f"artifact_type={self.artifact_type.value}, version={self.version}, "
            f"content={content_preview!r})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"Artifact[{self.id.hex[:8]}...] "
            f"({self.artifact_type.value}, v{self.version})"
        )



