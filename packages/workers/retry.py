"""
Retry механизм для выполнения задач.

Обеспечивает повторные попытки выполнения задач при ошибках,
изолированно от логики воркеров.
"""

import logging
from datetime import datetime
from typing import Callable, Optional

from packages.jobs import Job, JobResult
from packages.jobs.enums import JobStatus

from .circuit_breaker import CircuitBreaker
from .runner import WorkerRunner

# Опциональный импорт для интеграции с domain events
try:
    from packages.core_domain.integration import handle_job_result
    DOMAIN_INTEGRATION_AVAILABLE = True
except ImportError:
    DOMAIN_INTEGRATION_AVAILABLE = False
    handle_job_result = None

logger = logging.getLogger(__name__)


class RetryPolicy:
    """
    Политика повторных попыток выполнения задач.
    
    Определяет, когда и как повторять выполнение задачи при ошибках.
    """
    
    def __init__(self, max_retries: int = 3):
        """
        Инициализация политики retry.
        
        Args:
            max_retries: Максимальное количество попыток выполнения
        """
        self.max_retries = max_retries
    
    def should_retry(self, job: Job, error: dict) -> bool:
        """
        Определяет, следует ли повторить выполнение задачи.
        
        Простая логика: retry если job.retries < max_retries.
        
        Args:
            job: Задача, которая завершилась с ошибкой
            error: Информация об ошибке
        
        Returns:
            True, если следует повторить, False в противном случае
        
        Examples:
            >>> policy = RetryPolicy(max_retries=3)
            >>> job = Job(retries=2, max_retries=3, ...)
            >>> policy.should_retry(job, {"code": "error"})
            True
        """
        # Проверяем, не превышен ли лимит попыток
        if job.retries >= self.max_retries:
            return False
        
        # Можно добавить дополнительную логику:
        # - не retry для определённых типов ошибок
        # - exponential backoff и т.д.
        # Но пока простая логика
        
        return True
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"RetryPolicy(max_retries={self.max_retries})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"RetryPolicy(max_retries={self.max_retries})"


class RetryableRunner:
    """
    Runner с поддержкой retry и circuit breaker.
    
    Оборачивает WorkerRunner и добавляет:
    - Retry логику при ошибках
    - Circuit breaker для защиты от каскадных сбоев
    
    Retry изолирован от воркеров - воркеры не знают о retry.
    """
    
    def __init__(
        self,
        runner: WorkerRunner,
        retry_policy: Optional[RetryPolicy] = None,
        circuit_breaker: Optional[CircuitBreaker] = None,
        on_job_complete: Optional[Callable[[Job, JobResult], None]] = None,
    ):
        """
        Инициализация RetryableRunner.
        
        Args:
            runner: Базовый WorkerRunner для выполнения задач
            retry_policy: Политика retry (по умолчанию RetryPolicy())
            circuit_breaker: Circuit breaker (по умолчанию CircuitBreaker())
            on_job_complete: Callback для обработки результата выполнения (опционально)
        """
        self.runner = runner
        self.retry_policy = retry_policy or RetryPolicy()
        self.circuit_breaker = circuit_breaker or CircuitBreaker()
        self.on_job_complete = on_job_complete
    
    def run(self, job: Job) -> JobResult:
        """
        Выполняет задачу с поддержкой retry и circuit breaker.
        
        Логика выполнения:
        1. Проверяет circuit breaker
        2. Вызывает runner.run(job)
        3. Если успех:
           - записывает успех в circuit breaker
           - возвращает результат
        4. Если ошибка:
           - записывает ошибку в circuit breaker
           - увеличивает job.retries
           - если should_retry → status = RETRY
           - иначе → status = FAILED
           - возвращает JobResult
        
        Args:
            job: Задача для выполнения
        
        Returns:
            JobResult с результатом выполнения
        
        Examples:
            >>> runner = WorkerRunner(registry)
            >>> retryable = RetryableRunner(runner)
            >>> job = Job(type=JobType.TEXT_STRUCTURE, ...)
            >>> result = retryable.run(job)
        """
        logger.info(f"RetryableRunner: executing job {job.id} (retries: {job.retries}/{job.max_retries})")
        
        # Проверяем circuit breaker
        if self.circuit_breaker.is_open():
            logger.warning(
                f"Circuit breaker is OPEN for job {job.id}, "
                f"skipping execution"
            )
            return self._create_circuit_breaker_error_result(job.id)
        
        # Выполняем задачу
        result = self.runner.run(job)
        
        # Обрабатываем результат
        if result.success:
            # Успех - записываем в circuit breaker
            self.circuit_breaker.record_success()
            logger.info(f"Job {job.id} completed successfully")
            
            # Вызываем callback для интеграции с domain (если передан)
            if self.on_job_complete:
                try:
                    self.on_job_complete(job, result)
                except Exception as e:
                    logger.error(f"Error in on_job_complete callback: {e}", exc_info=True)
            
            return result
        
        # Ошибка - обрабатываем retry
        logger.warning(f"Job {job.id} failed: {result.error}")
        
        # Записываем ошибку в circuit breaker
        self.circuit_breaker.record_failure()
        
        # Вызываем callback для интеграции с domain (если передан)
        # Даже при ошибке нужно обновить Step
        if self.on_job_complete:
            try:
                self.on_job_complete(job, result)
            except Exception as e:
                logger.error(f"Error in on_job_complete callback: {e}", exc_info=True)
        
        # Увеличиваем счётчик попыток
        updated_retries = job.retries + 1
        
        # Определяем, нужно ли retry
        should_retry = self.retry_policy.should_retry(job, result.error or {})
        
        if should_retry:
            logger.info(
                f"Job {job.id} will be retried: "
                f"retries={updated_retries}/{job.max_retries}"
            )
            # Обновляем статус на RETRY
            # В реальной реализации здесь можно обновить job в хранилище
            # Но мы просто возвращаем результат с информацией о retry
            return JobResult(
                job_id=job.id,
                success=False,
                error={
                    **result.error,
                    "retry": True,
                    "retries": updated_retries,
                    "max_retries": job.max_retries,
                },
                finished_at=datetime.now(),
            )
        else:
            logger.error(
                f"Job {job.id} failed permanently: "
                f"retries={updated_retries}/{job.max_retries} exceeded"
            )
            # Превышен лимит попыток - финальная ошибка
            return JobResult(
                job_id=job.id,
                success=False,
                error={
                    **result.error,
                    "retry": False,
                    "retries": updated_retries,
                    "max_retries": job.max_retries,
                    "final": True,
                },
                finished_at=datetime.now(),
            )
    
    def _create_circuit_breaker_error_result(self, job_id) -> JobResult:
        """
        Создаёт JobResult с ошибкой circuit breaker.
        
        Args:
            job_id: Идентификатор задачи
        
        Returns:
            JobResult с success=False и информацией о circuit breaker
        """
        return JobResult(
            job_id=job_id,
            success=False,
            error={
                "code": "circuit_breaker_open",
                "message": "Circuit breaker is open, execution skipped",
            },
            finished_at=datetime.now(),
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"RetryableRunner(runner={self.runner}, "
            f"retry_policy={self.retry_policy}, "
            f"circuit_breaker={self.circuit_breaker})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"RetryableRunner(max_retries={self.retry_policy.max_retries}, "
            f"circuit_breaker={'OPEN' if self.circuit_breaker.is_open() else 'CLOSED'})"
        )

