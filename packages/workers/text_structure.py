import time
import logging
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .base import BaseWorker
from apps.api.storage import generation_store

logger = logging.getLogger(__name__)

class TextStructureWorker(BaseWorker):
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.TEXT_STRUCTURE
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Starting simulated pipeline for job {job.id}")
        
        # 1. Симуляция этапа 'Анализ'
        time.sleep(3)
        logger.info("Step 1: Analysis completed")
        
        # 2. Симуляция этапа 'Источники'
        time.sleep(5)
        logger.info("Step 2: Sources found")
        
        # 3. Симуляция этапа 'Написание текста'
        topic = job.input_payload.get("topic", "тему")
        time.sleep(5)
        
        result_text = f"# {topic}\n\n## Введение\nДанная работа посвящена исследованию {topic}. Мы проанализировали основные аспекты...\n\n## Глава 1. Теоретические основы\nВ этой главе рассматриваются фундаментальные принципы {topic}...\n\n## Заключение\nТаким образом, можно сделать вывод, что {topic} является важным направлением развития..."
        
        # Обновляем контент в базе
        generation_store.update(job.generation_id, result_content=result_text)
        
        return JobResult(
            job_id=job.id,
            success=True,
            output_payload={"status": "all_steps_completed"},
            finished_at=datetime.now(),
        )
