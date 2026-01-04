"""
Job contracts для асинхронных воркеров.

Этот пакет содержит контракты задач (jobs) для выполнения асинхронных операций.
Не содержит логики выполнения, очередей или инфраструктуры - только контракты и валидацию.
"""

from .enums import JobStatus, JobType
from .job import Job
from .result import JobResult

__all__ = [
    # Enums
    "JobType",
    "JobStatus",
    # Models
    "Job",
    "JobResult",
]



