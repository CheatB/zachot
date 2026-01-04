"""
Enum классы для job contracts.
"""

from enum import Enum


class JobType(str, Enum):
    """Тип задачи для выполнения воркером."""
    TEXT_STRUCTURE = "TEXT_STRUCTURE"
    TEXT_SOURCES = "TEXT_SOURCES"
    TEXT_GENERATION = "TEXT_GENERATION"
    PRESENTATION_STRUCTURE = "PRESENTATION_STRUCTURE"
    PRESENTATION_RENDER = "PRESENTATION_RENDER"
    TASK_SOLVE = "TASK_SOLVE"


class JobStatus(str, Enum):
    """Статус выполнения задачи."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    RETRY = "RETRY"



