import asyncio
import logging
import json
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .base import BaseWorker
from apps.api.storage import generation_store
from apps.api.services.openai_service import openai_service
from apps.api.services.model_router import model_router

logger = logging.getLogger(__name__)

class TaskWorker(BaseWorker):
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.TASK_SOLVE
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Starting AI Task solving for job {job.id}")
        
        generation = generation_store.get(job.generation_id)
        if not generation:
            raise ValueError(f"Generation {job.generation_id} not found")

        # 1. Выбор модели (Умный каскад)
        model_config = model_router.get_model_for_step("task_solve", generation.complexity_level)
        model_name = model_config["model"]
        
        topic = job.input_payload.get("topic", "задачу")
        task_mode = job.input_payload.get("task_mode", "quick")
        
        # Конструируем промпт
        mode_instruction = ""
        if task_mode == "quick":
            mode_instruction = "Выдай краткое, точное решение и финальный ответ."
        else:
            mode_instruction = "Выдай максимально подробный пошаговый разбор с объяснением теории."

        prompt = f"""
        Реши следующую задачу:
        {topic}
        
        ИНСТРУКЦИЯ:
        - Используй академический стиль.
        - Для формул используй LaTeX разметку (например, $x^2$ или $$D = b^2 - 4ac$$).
        - {mode_instruction}
        """

        logger.info(f"Solving task using {model_name}...")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result_text = loop.run_until_complete(
                openai_service.chat_completion(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}]
                )
            )
            
            if not result_text:
                raise ValueError("Failed to get solution from AI")
                
            # Обновляем контент в базе
            generation_store.update(job.generation_id, result_content=result_text, status="completed")
            logger.info("Task solved successfully")
            
            return JobResult(
                job_id=job.id,
                success=True,
                output_payload={"status": "task_solved", "model": model_name},
                finished_at=datetime.now(),
            )
        finally:
            loop.close()

