"""
Enum классы для доменного ядра системы генераций.
"""

from enum import Enum


class GenerationModule(str, Enum):
    """Тип модуля генерации."""
    TEXT = "TEXT"
    PRESENTATION = "PRESENTATION"
    TASK = "TASK"


class GenerationStatus(str, Enum):
    """Статус генерации."""
    DRAFT = "DRAFT"
    RUNNING = "RUNNING"
    WAITING_USER = "WAITING_USER"
    GENERATED = "GENERATED"
    EXPORTED = "EXPORTED"
    FAILED = "FAILED"
    CANCELED = "CANCELED"


class StepStatus(str, Enum):
    """Статус шага генерации."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    NEED_USER = "NEED_USER"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class ArtifactType(str, Enum):
    """Тип артефакта генерации."""
    TEXT_DOC = "TEXT_DOC"
    SLIDES = "SLIDES"
    TASK_SOLUTION = "TASK_SOLUTION"
    EXPORT_FILE = "EXPORT_FILE"



