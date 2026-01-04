"""
Исполнитель задач (WorkerRunner).

Управляет жизненным циклом выполнения задачи:
- обновляет статус задачи
- выбирает воркер
- выполняет задачу
- обрабатывает ошибки
"""

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from packages.jobs import Job, JobResult
from packages.jobs.enums import JobStatus

from .base import BaseWorker
from .registry import WorkerNotFoundError, WorkerRegistry

logger = logging.getLogger(__name__)


class WorkerRunner:
    """
    Исполнитель задач для воркеров.
    
    Управляет выполнением Job:
    1. Обновляет статус задачи на RUNNING
    2. Устанавливает started_at
    3. Выбирает подходящий воркер через registry
    4. Выполняет задачу через воркера
    5. Возвращает JobResult
    
    Обрабатывает ошибки и формирует JobResult(success=False) при исключениях.
    """
    
    def __init__(self, registry: WorkerRegistry):
        """
        Инициализация runner'а.
        
        Args:
            registry: Реестр воркеров для выбора подходящего воркера
        """
        self.registry = registry
    
    def run(self, job: Job) -> JobResult:
        """
        Выполняет задачу через подходящий воркер.
        
        Логика выполнения:
        1. Обновляет статус job на RUNNING (если нужно)
        2. Устанавливает started_at
        3. Выбирает воркер через registry
        4. Вызывает execute воркера
        5. Возвращает JobResult
        
        При любых ошибках формирует JobResult(success=False) с информацией об ошибке.
        
        Args:
            job: Задача для выполнения
        
        Returns:
            JobResult с результатом выполнения
        
        Examples:
            >>> registry = WorkerRegistry()
            >>> registry.register(TextStructureWorker())
            >>> runner = WorkerRunner(registry)
            >>> job = Job(type=JobType.TEXT_STRUCTURE, ...)
            >>> result = runner.run(job)
            >>> result.success
            True
        """
        logger.info(f"Starting execution of job {job.id} (type: {job.type.value})")
        
        # Обновляем статус на RUNNING, если нужно
        updated_job = self._prepare_job(job)
        
        try:
            # Выбираем подходящий воркер
            worker = self.registry.get_worker(updated_job)
            logger.info(f"Selected worker {worker.__class__.__name__} for job {job.id}")
            
            # Выполняем задачу
            result = worker.execute(updated_job)
            
            logger.info(
                f"Job {job.id} completed: success={result.success}, "
                f"finished_at={result.finished_at}"
            )
            
            return result
        
        except WorkerNotFoundError as e:
            logger.error(f"No worker found for job {job.id}: {e}")
            return self._create_error_result(
                job.id,
                {
                    "code": "worker_not_found",
                    "message": str(e),
                    "job_type": job.type.value,
                }
            )
        
        except Exception as e:
            logger.error(f"Error executing job {job.id}: {e}", exc_info=True)
            return self._create_error_result(
                job.id,
                {
                    "code": "execution_error",
                    "message": str(e),
                    "error_type": type(e).__name__,
                }
            )
    
    def _prepare_job(self, job: Job) -> Job:
        """
        Подготавливает задачу к выполнению.
        
        Обновляет статус на RUNNING и устанавливает started_at, если нужно.
        
        Args:
            job: Задача для подготовки
        
        Returns:
            Обновлённая задача
        """
        # Если статус уже RUNNING, не меняем
        if job.status == JobStatus.RUNNING:
            return job
        
        # Обновляем статус и started_at
        update_data = {
            "status": JobStatus.RUNNING,
        }
        
        if job.started_at is None:
            update_data["started_at"] = datetime.now()
        
        return job.model_copy(update=update_data)
    
    def _create_error_result(
        self,
        job_id: UUID,
        error: dict,
    ) -> JobResult:
        """
        Создаёт JobResult с ошибкой.
        
        Args:
            job_id: Идентификатор задачи
            error: Информация об ошибке
        
        Returns:
            JobResult с success=False
        """
        return JobResult(
            job_id=job_id,
            success=False,
            error=error,
            finished_at=datetime.now(),
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"WorkerRunner(registry={self.registry})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"WorkerRunner with {len(self.registry.get_all_workers())} worker(s)"



