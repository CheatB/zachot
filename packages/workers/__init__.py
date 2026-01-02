"""
Базовая архитектура воркеров для выполнения Job.

Этот пакет содержит базовые классы и компоненты для выполнения задач (jobs).
Не содержит логики очередей, retry или инфраструктуры - только execution layer.
"""

from .base import BaseWorker
from .registry import WorkerNotFoundError, WorkerRegistry
from .runner import WorkerRunner
from .text_structure import TextStructureWorker

__all__ = [
    # Base
    "BaseWorker",
    # Registry
    "WorkerRegistry",
    "WorkerNotFoundError",
    # Runner
    "WorkerRunner",
    # Workers
    "TextStructureWorker",
]

