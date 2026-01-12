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
from apps.api.services.prompt_service import prompt_service

logger = logging.getLogger(__name__)

class TextStructureWorker(BaseWorker):
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.TEXT_STRUCTURE
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Starting AI-powered pipeline for job {job.id}")
        
        generation = generation_store.get(job.generation_id)
        if not generation:
            raise ValueError(f"Generation {job.generation_id} not found")

        topic = job.input_payload.get("topic", "")
        work_type = generation.work_type or "other"
        
        # --- СЛОЙ 1 & 3: Защита от пустых запросов и болтовни ---
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 1. Проверка на минимальный ввод
            if len(topic.strip()) < 5:
                error_msg = "Пожалуйста, введите тему работы для начала генерации."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "empty_topic", "message": error_msg}, 
                    finished_at=datetime.now()
                )

            # 2. Быстрая классификация (задача ли это?)
            classifier_prompt = prompt_service.construct_classifier_prompt(topic)
            raw_class = loop.run_until_complete(
                openai_service.chat_completion(
                    model="openai/gpt-4o-mini",
                    messages=[{"role": "user", "content": classifier_prompt}],
                    json_mode=True
                )
            )
            
            classification = json.loads(raw_class or '{"type": "task"}')
            if classification.get("type") == "chat":
                error_msg = "Этот раздел предназначен для создания академических работ. Пожалуйста, введите тему для реферата, статьи или курсовой."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "invalid_topic", "message": error_msg}, 
                    finished_at=datetime.now()
                )

            # --- ОСНОВНАЯ ЛОГИКА ГЕНЕРАЦИИ ---
            # ... (the rest of the code inside try)
        except Exception as e:
            logger.error(f"Error executing job {job.id}: {e}", exc_info=True)
            error_msg = f"Произошла ошибка при генерации: {str(e)}"
            generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
            return JobResult(
                job_id=job.id,
                success=False,
                error={"code": "execution_error", "message": str(e)},
                finished_at=datetime.now()
            )
        finally:
            loop.close()
