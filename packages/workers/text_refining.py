import logging
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .base import BaseWorker

logger = logging.getLogger(__name__)

class TextRefiningWorker(BaseWorker):
    """
    Воркер для очеловечивания текста (Anti-AI).
    Использует инструкции для изменения синтаксиса и удаления маркеров ИИ.
    """
    
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.TEXT_REFINING
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Executing TEXT_REFINING job {job.id}")
        
        content = job.input_payload.get("content", "")
        humanity_level = job.input_payload.get("humanity_level", 50)
        
        # Инструкции для "очеловечивания" (промпт-инжиниринг)
        refining_instructions = [
            "Используй рваный ритм предложений",
            "Удали типичные ИИ-маркеры: 'важно отметить', 'в заключение'",
            "Добавь специфическую академическую терминологию",
            "Сделай синтаксис более естественным"
        ]
        
        logger.debug(f"Refining content with humanity level: {humanity_level}%")
        
        # Симуляция процесса (в реальности здесь вызов Claude 3.5 Sonnet)
        refined_content = content + f"\n\n[Текст очеловечен на {humanity_level}%]"
        
        output_payload = {
            "refined_content": refined_content,
            "applied_instructions": refining_instructions
        }
        
        return JobResult(
            job_id=job.id,
            success=True,
            output_payload=output_payload,
            finished_at=datetime.now()
        )

