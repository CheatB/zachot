"""
Celery задачи для генерации контента.
"""

import logging
import asyncio
from apps.api.celery_app import celery_app
from apps.api.storage import generation_store
from apps.api.services.text_generation_service import text_generation_service
from apps.api.services.quality_control_service import quality_control_service
# humanization_service больше не используется - humanity_level учитывается в промпте генерации
from apps.api.services.task_service import task_service

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="generate_text_content")
def generate_text_content(self, generation_id: str):
    """
    Celery задача для генерации текстового контента.
    
    Args:
        generation_id: ID генерации
    """
    logger.info(f"Starting text generation task for {generation_id}")
    
    generation = generation_store.get(generation_id)
    if not generation:
        raise ValueError(f"Generation {generation_id} not found")
    
    # Обновляем статус
    generation_store.update(generation_id, status="RUNNING")
    
    try:
        # Создаём event loop для async функций
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 1. Генерация структуры
            self.update_state(state="PROGRESS", meta={"step": "structure", "progress": 20})
            structure = loop.run_until_complete(
                text_generation_service.generate_structure(generation)
            )
            generation_store.update(
                generation_id,
                settings_payload={**generation.settings_payload, "structure": structure}
            )
            
            # 2. Подбор источников
            self.update_state(state="PROGRESS", meta={"step": "sources", "progress": 40})
            sources = loop.run_until_complete(
                text_generation_service.generate_sources(generation)
            )
            generation_store.update(
                generation_id,
                settings_payload={**generation.settings_payload, "sources": sources}
            )
            
            # 3. Генерация контента
            self.update_state(state="PROGRESS", meta={"step": "content", "progress": 60})
            full_text = loop.run_until_complete(
                text_generation_service.generate_content_by_chapters(
                    generation, structure, sources
                )
            )
            
            # 4. Quality Control
            self.update_state(state="PROGRESS", meta={"step": "qc", "progress": 80})
            if generation.input_payload.get("apply_qc", True):
                full_text, _ = loop.run_until_complete(
                    quality_control_service.check_quality(full_text)
                )
            
            # Примечание: Этап "Очеловечивания" убран!
            # humanity_level учитывается на шаге 3 (генерация контента) через промпт.
            # Claude 3.5 Sonnet генерирует текст сразу в нужном стиле.
            
            # 5. Сохранение результата
            generation_store.update(
                generation_id,
                result_content=full_text,
                status="completed"
            )
            
            logger.info(f"✅ Text generation completed for {generation_id}")
            return {"status": "success", "generation_id": generation_id}
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"❌ Error in text generation: {e}", exc_info=True)
        generation_store.update(
            generation_id,
            result_content=f"Ошибка: {str(e)}",
            status="FAILED"
        )
        raise


@celery_app.task(bind=True, name="solve_task")
def solve_task_celery(self, generation_id: str):
    """
    Celery задача для решения учебной задачи.
    
    Args:
        generation_id: ID генерации
    """
    logger.info(f"Starting task solving for {generation_id}")
    
    generation = generation_store.get(generation_id)
    if not generation:
        raise ValueError(f"Generation {generation_id} not found")
    
    generation_store.update(generation_id, status="RUNNING")
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            topic = generation.input_payload.get("topic", "")
            task_mode = generation.input_payload.get("task_mode", "quick")
            
            # Классификация
            self.update_state(state="PROGRESS", meta={"step": "classify", "progress": 30})
            classification = loop.run_until_complete(
                task_service.classify_input(topic)
            )
            
            if classification.get("type") == "chat":
                error_msg = "Это не похоже на учебную задачу"
                generation_store.update(generation_id, result_content=error_msg, status="FAILED")
                return {"status": "failed", "reason": "not_a_task"}
            
            # Решение
            self.update_state(state="PROGRESS", meta={"step": "solve", "progress": 70})
            result_text, _ = loop.run_until_complete(
                task_service.solve_task(topic, task_mode, "task")
            )
            
            generation_store.update(
                generation_id,
                result_content=result_text,
                status="completed"
            )
            
            logger.info(f"✅ Task solved for {generation_id}")
            return {"status": "success", "generation_id": generation_id}
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"❌ Error solving task: {e}", exc_info=True)
        generation_store.update(
            generation_id,
            result_content=f"Ошибка: {str(e)}",
            status="FAILED"
        )
        raise
