"""
Доменное ядро системы генераций образовательного продукта «Зачёт».

Этот пакет содержит чистые доменные сущности без зависимостей от инфраструктуры.
"""

from .artifact import Artifact
from .enums import ArtifactType, GenerationModule, GenerationStatus, StepStatus
from .generation import Generation
from .state_machine import GenerationStateMachine, InvalidGenerationTransitionError
from .step import Step
from .step_lifecycle import (
    StepAlreadyFinishedError,
    StepLifecycle,
    InvalidStepTransitionError,
    calculate_input_hash,
)

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
    # State Machine
    "GenerationStateMachine",
    "InvalidGenerationTransitionError",
    # Step Lifecycle
    "StepLifecycle",
    "InvalidStepTransitionError",
    "StepAlreadyFinishedError",
    "calculate_input_hash",
]

