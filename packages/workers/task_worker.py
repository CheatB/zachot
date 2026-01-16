import logging
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .async_base import AsyncBaseWorker
from apps.api.storage import generation_store
from apps.api.services.task_service import task_service

logger = logging.getLogger(__name__)

class TaskWorker(AsyncBaseWorker):
    """
    Асинхронный воркер для решения задач.
    
    Использует AsyncBaseWorker для эффективного управления event loop.
    Вся бизнес-логика вынесена в TaskService.
    """
    
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.TASK_SOLVE
    
    async def execute_async(self, job: Job) -> JobResult:
        """
        Асинхронно выполняет решение задачи.
        """
        logger.info(f"Starting AI Task solving for job {job.id}")
        
        generation = generation_store.get(job.generation_id)
        if not generation:
            raise ValueError(f"Generation {job.generation_id} not found")

        topic = job.input_payload.get("topic", "")
        task_mode = job.input_payload.get("task_mode", "quick")
        
        try:
            # 1. Валидация минимальной длины
            if len(topic.strip()) < 10:
                error_msg = "Слишком короткое условие. Пожалуйста, пришлите текст задачи или фото."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "too_short", "message": error_msg}, 
                    finished_at=datetime.now()
                )

            # 2. Классификация через сервис
            classification = await task_service.classify_input(topic)
            
            if classification.get("type") == "chat":
                error_msg = "Я решаю конкретные учебные задачи. Для общих вопросов или написания текстов используйте соответствующие разделы."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "not_a_task", "message": error_msg}, 
                    finished_at=datetime.now()
                )

            # 3. Решение задачи через сервис
            result_text, usage_info = await task_service.solve_task(topic, task_mode, "task")
            
            # 4. Сохранение результата
            generation_store.update(
                job.generation_id, 
                result_content=result_text, 
                status="completed",
                usage_metadata=[usage_info]
            )
            logger.info("Task solved successfully")
            
            return JobResult(
                job_id=job.id,
                success=True,
                output_payload={"status": "task_solved"},
                finished_at=datetime.now(),
            )
            
        except Exception as e:
            logger.error(f"Error solving task: {e}", exc_info=True)
            error_msg = f"Ошибка при решении задачи: {str(e)}"
            generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
            return JobResult(
                job_id=job.id,
                success=False,
                error={"code": "execution_error", "message": str(e)},
                finished_at=datetime.now()
            )
