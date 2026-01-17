import logging
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .async_base import AsyncBaseWorker
from apps.api.storage import generation_store
from apps.api.services.text_generation_service import text_generation_service
from apps.api.services.quality_control_service import quality_control_service
# humanization_service больше не используется - humanity_level учитывается в промпте генерации

logger = logging.getLogger(__name__)

class TextStructureWorker(AsyncBaseWorker):
    """
    Асинхронный воркер для генерации текстовых работ.
    
    Использует AsyncBaseWorker для эффективного управления event loop.
    Вся бизнес-логика вынесена в сервисы.
    """
    
    def can_handle(self, job: Job) -> bool:
        return job.type in [JobType.TEXT_STRUCTURE, JobType.PRESENTATION_STRUCTURE]
    
    async def execute_async(self, job: Job) -> JobResult:
        """
        Асинхронно выполняет генерацию текста.
        """
        logger.info(f"Starting AI-powered pipeline for job {job.id}, generation_id: {job.generation_id}")
        
        generation = generation_store.get(job.generation_id)
        if not generation:
            raise ValueError(f"Generation {job.generation_id} not found")

        topic = job.input_payload.get("topic", "")
        
        # Список для сбора метаданных об использовании AI
        usage_metadata = []
        
        try:
            # 1. Валидация минимального ввода
            if len(topic.strip()) < 5:
                error_msg = "Пожалуйста, введите тему работы для начала генерации."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "empty_topic", "message": error_msg}, 
                    finished_at=datetime.now()
                )
            
            # 2. Генерация структуры (если её нет)
            structure = generation.settings_payload.get("structure", [])
            if not structure:
                logger.info("Step 1: Generating structure...")
                structure = await text_generation_service.generate_structure(generation)
                generation_store.update(
                    job.generation_id, 
                    settings_payload={**generation.settings_payload, "structure": structure}
                )
                logger.info(f"Step 1: Structure generated with {len(structure)} sections")
            else:
                logger.info(f"Step 1: Using existing structure ({len(structure)} sections)")

            # 3. Подбор источников (если их нет)
            sources = generation.settings_payload.get("sources", [])
            if not sources:
                logger.info("Step 2: Selecting sources...")
                sources = await text_generation_service.generate_sources(generation)
                generation_store.update(
                    job.generation_id, 
                    settings_payload={**generation.settings_payload, "sources": sources}
                )
                logger.info(f"Step 2: {len(sources)} sources found")
            else:
                logger.info(f"Step 2: Using existing sources ({len(sources)} sources)")

            # 4. Генерация контента (поглавно)
            logger.info("Step 3: Generating full text...")
            full_text = await text_generation_service.generate_content_by_chapters(
                generation, structure, sources
            )
            
            # Проверка объёма
            volume_stats = quality_control_service.check_volume(
                full_text, 
                generation.input_payload.get('volume', 10)
            )
            logger.info(f"Volume check: {volume_stats}")
            
            # 5. Quality Control (если требуется)
            if generation.input_payload.get('apply_qc', True):
                logger.info("Step 4: Applying Quality Control...")
                full_text, qc_usage = await quality_control_service.check_quality(full_text)
                usage_metadata.append({"stage": "qc", **qc_usage})
            
            # Примечание: Этап "Очеловечивания" убран!
            # humanity_level учитывается на Step 3 (генерация контента) через промпт.
            # Claude 3.5 Sonnet генерирует текст сразу в нужном стиле.
            
            # 6. Сохранение результата
            generation_store.update(
                job.generation_id, 
                result_content=full_text, 
                status="completed",
                usage_metadata=usage_metadata
            )
            
            logger.info(f"✅ Text generation completed successfully! Final length: {len(full_text)} chars")
            
            return JobResult(
                job_id=job.id,
                success=True,
                output_payload={
                    "status": "text_generated",
                    "volume_stats": volume_stats,
                    "usage_metadata": usage_metadata
                },
                finished_at=datetime.now(),
            )
            
        except Exception as e:
            logger.error(f"Error in text generation: {e}", exc_info=True)
            error_msg = f"Ошибка при генерации текста: {str(e)}"
            generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
            return JobResult(
                job_id=job.id,
                success=False,
                error={"code": "execution_error", "message": str(e)},
                finished_at=datetime.now()
            )
