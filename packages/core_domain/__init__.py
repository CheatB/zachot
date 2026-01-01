"""
Доменное ядро системы генераций образовательного продукта «Зачёт».

Этот пакет содержит чистые доменные сущности без зависимостей от инфраструктуры.
"""

from .artifact import Artifact
from .enums import ArtifactType, GenerationModule, GenerationStatus, StepStatus
from .generation import Generation
from .step import Step

__all__ = [
    # Enums
    "GenerationModule",
    "GenerationStatus",
    "StepStatus",
    "ArtifactType",
    # Entities
    "Generation",
    "Step",
    "Artifact",
]

