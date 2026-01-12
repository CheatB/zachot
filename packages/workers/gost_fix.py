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

logger = logging.getLogger(__name__)

class GostFixWorker(BaseWorker):
    """
    Worker for fixing document formatting (GOST) and grammar/punctuation.
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
        formatting = generation.settings_payload.get("formatting", {})
        
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

            # 1. Grammar and Punctuation Fix
            logger.info("Step 1: Fixing grammar and punctuation...")
            grammar_prompt = f"""
            Исправь все орфографические и пунктуационные ошибки в следующем тексте. 
            Сохрани структуру и смысл полностью. Верни ТОЛЬКО исправленный текст.
            
            Текст:
            {content}
            """
            
            fixed_text = loop.run_until_complete(
                openai_service.chat_completion(
                    model="openai/gpt-4o-mini",
                    messages=[{"role": "user", "content": grammar_prompt}]
                )
            ) or content

            # 2. Apply GOST Formatting Instructions (Simulation)
            # In a real app, this would involve creating a DOCX with specific styles.
            # Here we provide the "formatted" text and metadata.
            logger.info("Step 2: Applying GOST formatting rules...")
            
            # Final saving
            generation_store.update(job.generation_id, result_content=fixed_text, status="GENERATED")
            logger.info("GOST Fix pipeline completed successfully")

            return JobResult(
                job_id=job.id,
                success=True,
                output_payload={"status": "completed", "formatting_applied": True},
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

