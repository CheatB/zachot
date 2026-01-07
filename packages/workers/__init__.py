"""
Базовая архитектура воркеров для выполнения Job.

Этот пакет содержит базовые классы и компоненты для выполнения задач (jobs):
- BaseWorker: интерфейс для воркеров
- WorkerRegistry: реестр воркеров
- WorkerRunner: исполнитель задач
- RetryableRunner: runner с поддержкой retry
- CircuitBreaker: защита от каскадных сбоев

Не содержит логики очередей или инфраструктуры - только execution layer.
"""

from .base import BaseWorker
from .circuit_breaker import CircuitBreaker
from .registry import WorkerNotFoundError, WorkerRegistry
from .retry import RetryableRunner, RetryPolicy
from .runner import WorkerRunner
from .text_structure import TextStructureWorker
from .task_worker import TaskWorker
from .text_refining import TextRefiningWorker

__all__ = [
    # Base
    "BaseWorker",
    # Registry
    "WorkerRegistry",
    "WorkerNotFoundError",
    # Runner
    "WorkerRunner",
    # Retry
    "RetryPolicy",
    "RetryableRunner",
    # Circuit Breaker
    "CircuitBreaker",
    # Workers
    "TextStructureWorker",
    "TaskWorker",
    "TextRefiningWorker",
]

