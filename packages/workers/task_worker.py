import asyncio
import logging
import json
from datetime import datetime
from uuid import uuid4
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .base import BaseWorker
from apps.api.storage import generation_store
from apps.api.services.openai_service import openai_service
from apps.api.services.model_router import model_router
from apps.api.services.prompt_service import prompt_service

logger = logging.getLogger(__name__)

class TaskWorker(BaseWorker):
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.TASK_SOLVE
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Starting AI Task solving for job {job.id}")
        
        generation = generation_store.get(job.generation_id)
        if not generation:
            raise ValueError(f"Generation {job.generation_id} not found")

        topic = job.input_payload.get("topic", "")
        
        # --- СЛОЙ 1 & 3: Классификатор и защита от болтовни ---
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # --- ВАЛИДАЦИЯ ДЛЯ ЗАДАЧ ---
            # Для задач валидация НЕОБХОДИМА, т.к.:
            # 1. Решение происходит в 1 клик (нет промежуточных шагов как в текстовых работах)
            # 2. Выше риск использования как "доступ к ChatGPT"
            # 3. Классификатор точнее определяет задачи vs чат
            
            # 1. Проверка на минимальную длину
            if len(topic.strip()) < 10:
                error_msg = "Слишком короткое условие. Пожалуйста, пришлите текст задачи или фото."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "too_short", "message": error_msg}, 
                    finished_at=datetime.now()
                )

            # 2. Семантическая классификация - отсекаем "chat" запросы
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
                error_msg = "Я решаю конкретные учебные задачи. Для общих вопросов или написания текстов используйте соответствующие разделы."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "not_a_task", "message": error_msg}, 
                    finished_at=datetime.now()
                )

            # --- ОСНОВНАЯ ЛОГИКА РЕШЕНИЯ ---
            # Выбор модели
            model_name = model_router.get_model_for_step("task_solve", "task")
            
            task_mode = job.input_payload.get("task_mode", "quick")
            
            # Конструируем промпт (СЛОЙ 4: Ограничение ширины)
            mode_instruction = ""
            if task_mode == "quick":
                mode_instruction = "Выдай КРАТКОЕ, точное решение и финальный ответ. Без лишних вступлений."
            else:
                mode_instruction = "Выдай максимально подробный пошаговый разбор. Каждый шаг должен содержать формулы и логику. Не пиши общих лекций."

            prompt = f"""
            Реши задачу из условия: {topic}
            
            ПРАВИЛА (АНТИ-ХАК):
            - СТРОГО академический стиль.
            - Для формул используй LaTeX.
            - {mode_instruction}
            - Если в условии нет задачи — вежливо откажи.
            """

            logger.info(f"Solving task using {model_name}...")
            
            result_text = loop.run_until_complete(
                openai_service.chat_completion(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    step_type="task_solve",
                    work_type="task"
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
