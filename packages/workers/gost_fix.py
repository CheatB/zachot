import asyncio
import logging
import json
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .base import BaseWorker
from apps.api.storage import generation_store
from apps.api.services.openai_service import openai_service
from apps.api.services.prompt_service import prompt_service
from apps.api.services.formatting_service import formatting_service

logger = logging.getLogger(__name__)

class GostFixWorker(BaseWorker):
    """
    Worker for fixing document formatting (GOST) and grammar/punctuation.
    Использует гибридный подход: базовое форматирование (бесплатно) + опциональная ИИ-корректура
    """
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.GOST_FIX
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Starting GOST Fix pipeline for job {job.id}")
        
        generation = generation_store.get(job.generation_id)
        if not generation:
            raise ValueError(f"Generation {job.generation_id} not found")

        # In GOST_FORMAT, the input is usually in taskFiles or a topic/text
        content = job.input_payload.get("input", "") or job.input_payload.get("topic", "")
        formatting_settings = generation.settings_payload.get("formatting", {})
        
        # Проверяем, нужна ли ИИ-корректура (опциональная, за кредиты)
        use_ai_proofreading = generation.settings_payload.get("use_ai_proofreading", False)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            if not content.strip():
                error_msg = "Документ пуст или не содержит текста для обработки."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "empty_content", "message": error_msg}, 
                    finished_at=datetime.now()
                )

            # Шаг 1: Базовое форматирование (ВСЕГДА, бесплатно)
            logger.info("Step 1: Applying basic formatting (free)...")
            formatted_text = formatting_service.apply_basic_formatting(content, formatting_settings)
            
            # Шаг 2: ИИ-корректура (ОПЦИОНАЛЬНО, за кредиты)
            if use_ai_proofreading:
                logger.info("Step 2: AI proofreading (paid)...")
                proofreading_prompt = prompt_service.construct_formatting_prompt(formatted_text)
                
                formatted_text = loop.run_until_complete(
                    openai_service.chat_completion(
                        model="openai/gpt-4o-mini",
                        messages=[{"role": "user", "content": proofreading_prompt}],
                        step_type="formatting"
                    )
                ) or formatted_text
                logger.info("AI proofreading completed")
            else:
                logger.info("Step 2: Skipping AI proofreading (not requested)")
            
            # Final saving
            generation_store.update(job.generation_id, result_content=formatted_text, status="GENERATED")
            logger.info("GOST Fix pipeline completed successfully")

            return JobResult(
                job_id=job.id,
                success=True,
                output_payload={
                    "status": "completed", 
                    "formatting_applied": True,
                    "ai_proofreading_used": use_ai_proofreading
                },
                finished_at=datetime.now(),
            )
            
        except Exception as e:
            logger.error(f"Error in GostFixWorker: {e}", exc_info=True)
            error_msg = f"Ошибка при обработке документа: {str(e)}"
            generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
            return JobResult(
                job_id=job.id,
                success=False,
                error={"code": "execution_error", "message": str(e)},
                finished_at=datetime.now()
            )
        finally:
            loop.close()

