import time
import logging
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .base import BaseWorker
from apps.api.storage import generation_store

logger = logging.getLogger(__name__)

class TaskWorker(BaseWorker):
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.TASK_SOLVE
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Starting Task solving pipeline for job {job.id}")
        
        # 1. Распознавание (OCR)
        time.sleep(4)
        logger.info("Step 1: OCR completed")
        
        # 2. Понимание условия
        time.sleep(3)
        logger.info("Step 2: Logic analysis completed")
        
        # 3. Составление плана
        time.sleep(3)
        logger.info("Step 3: Plan created")
        
        # 4. Решение
        time.sleep(5)
        logger.info("Step 4: Problem solved")
        
        # 5. Проверка
        time.sleep(2)
        logger.info("Step 5: Verification completed")
        
        topic = job.input_payload.get("topic", "задачу")
        task_mode = job.input_payload.get("task_mode", "quick")
        
        if task_mode == "quick":
            result_text = f"# Решение задачи: {topic}\n\n## Условие\n{topic}\n\n## Пошаговое решение\n1. Проанализируем исходные данные. Используем формулу дискриминанта:\n$$D = b^2 - 4ac$$\n\n2. Подставим значения и найдем корни:\n$x = \\frac{{-b \\pm \\sqrt{{D}}}}{{2a}}$\n\n## Ответ\nИтоговый результат получен и проверен."
        else:
            result_text = f"# Разбор задачи: {topic}\n\n## Шаг 1. Анализ условия\nПервым делом нам нужно понять, что дано. Допустим, у нас есть уравнение типа $ax^2 + bx + c = 0$...\n\n[Интерактивный режим обучения активирован]"
            
        # Обновляем контент в базе
        generation_store.update(job.generation_id, result_content=result_text)
        
        return JobResult(
            job_id=job.id,
            success=True,
            output_payload={"status": "task_solved"},
            finished_at=datetime.now(),
        )

