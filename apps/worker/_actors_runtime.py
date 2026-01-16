"""
Dramatiq actors runtime - содержит драматик-зависимый код.

Этот файл импортируется только в worker runtime для регистрации акторов.
API импортирует безопасные обёртки из actors.py, которые делают ленивый импорт отсюда.
"""

import logging
from datetime import datetime
from typing import Dict, Any

import dramatiq

from packages.jobs import Job, JobResult
from packages.workers.registry import WorkerRegistry
from packages.workers.runner import WorkerRunner
from packages.workers.retry import RetryableRunner, RetryPolicy
from packages.workers.circuit_breaker import CircuitBreaker
from packages.workers.text_structure import TextStructureWorker
from packages.workers.task_worker import TaskWorker
from packages.workers.text_refining import TextRefiningWorker
from packages.workers.gost_fix import GostFixWorker

# Опциональный импорт для интеграции с domain
try:
    from packages.core_domain.integration import handle_job_result
    DOMAIN_INTEGRATION_AVAILABLE = True
except ImportError:
    DOMAIN_INTEGRATION_AVAILABLE = False
    handle_job_result = None

logger = logging.getLogger(__name__)


def create_on_job_complete_callback():
    """
    Создаёт callback для интеграции с domain после завершения job.
    
    Returns:
        Callback функция или None, если интеграция недоступна
    """
    if not DOMAIN_INTEGRATION_AVAILABLE or handle_job_result is None:
        logger.debug("Domain integration not available, skipping on_job_complete callback")
        return None
    
    def on_job_complete(job: Job, result: JobResult) -> None:
        """
        Callback для обработки результата выполнения job.
        
        Вызывает handle_job_result для обновления domain entities
        и публикации событий.
        
        Вызывается без callbacks для обновления entities - только публикуются события.
        Обновление entities должно выполняться подписчиками на события.
        
        Args:
            job: Выполненная задача
            result: Результат выполнения
        """
        try:
            # Вызываем handle_job_result без callbacks для обновления entities
            # В этом случае только публикуются события, обновление entities
            # должно выполняться подписчиками на события
            handle_job_result(
                job=job,
                result=result,
                update_generation=None,
                update_step=None,
                get_step=None,
            )
            logger.debug(f"Domain integration callback executed for job {job.id}")
        except Exception as e:
            logger.error(f"Error in domain integration callback for job {job.id}: {e}", exc_info=True)
    
    return on_job_complete


@dramatiq.actor(time_limit=1200000)  # 20 минут (в миллисекундах)
def execute_job_impl(job_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dramatiq actor для выполнения Job (runtime реализация).
    
    Вход: сериализованный Job в виде dict (через job.dict() или job.model_dump()).
    Выход: сериализованный JobResult в виде dict (через result.dict() или result.model_dump()).
    
    Логика выполнения:
    1. Десериализует Job из dict через Job.model_validate()
    2. Создаёт WorkerRegistry
    3. Регистрирует все существующие воркеры (минимум TextStructureWorker)
    4. Создаёт WorkerRunner
    5. Оборачивает его в RetryableRunner с callback для domain integration
    6. Выполняет job через retryable_runner.run(job)
    7. Возвращает JobResult в виде dict
    
    Args:
        job_dict: Словарь с данными Job (сериализованный Job)
        
    Returns:
        Словарь с данными JobResult (сериализованный JobResult)
        
    Raises:
        ValueError: Если job_dict невалиден
        Exception: При ошибках выполнения job
    """
    try:
        # Десериализуем Job
        job = Job.model_validate(job_dict)
        
        logger.info(
            f"Starting job execution: id={job.id}, type={job.type.value}, "
            f"retries={job.retries}/{job.max_retries}"
        )
        
        # Создаём WorkerRegistry
        registry = WorkerRegistry()
        
        # Регистрируем все существующие воркеры
        registry.register(TextStructureWorker())
        registry.register(TaskWorker())
        registry.register(TextRefiningWorker())
        # TODO: Добавить другие воркеры по мере их реализации
        # registry.register(TextSourcesWorker())
        # registry.register(TextGenerationWorker())
        # и т.д.
        
        logger.debug(f"Registered {len(registry.get_all_workers())} worker(s)")
        
        # Создаём WorkerRunner
        runner = WorkerRunner(registry)
        
        # Создаём RetryableRunner с callback для domain integration
        retry_policy = RetryPolicy(max_retries=job.max_retries)
        circuit_breaker = CircuitBreaker()
        on_job_complete = create_on_job_complete_callback()
        
        retryable_runner = RetryableRunner(
            runner=runner,
            retry_policy=retry_policy,
            circuit_breaker=circuit_breaker,
            on_job_complete=on_job_complete,
        )
        
        # Логируем состояние circuit breaker, если он открыт
        if circuit_breaker.is_open():
            logger.warning(f"Circuit breaker is OPEN for job {job.id}")
        
        # Выполняем job
        result = retryable_runner.run(job)
        
        # Логируем результат
        if result.success:
            logger.info(
                f"Job {job.id} completed successfully: "
                f"type={job.type.value}, finished_at={result.finished_at}"
            )
        else:
            logger.warning(
                f"Job {job.id} failed: type={job.type.value}, "
                f"error={result.error}, finished_at={result.finished_at}"
            )
        
        # Сериализуем JobResult в dict
        return result.model_dump()
    
    except Exception as e:
        logger.error(f"Error executing job: {e}", exc_info=True)
        
        # Если job был десериализован, используем его ID
        # Иначе создаём фиктивный ID для ошибки
        job_id = job_dict.get("id") if isinstance(job_dict, dict) else None
        
        # Создаём JobResult с ошибкой
        error_result = JobResult(
            job_id=job_id,
            success=False,
            error={
                "code": "actor_error",
                "message": str(e),
                "error_type": type(e).__name__,
            },
            finished_at=datetime.now(),
        )
        
        return error_result.model_dump()


