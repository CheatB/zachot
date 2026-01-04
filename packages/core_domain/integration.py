"""
Integration layer для связи workers с domain.

Предоставляет функции для обновления domain entities после выполнения jobs,
публикуя соответствующие domain events.
"""

import logging
from typing import Callable, Optional
from uuid import UUID

from packages.jobs import Job, JobResult
from packages.jobs.enums import JobStatus, JobType
from packages.core_domain.enums import GenerationStatus, StepStatus
from packages.core_domain.events import GenerationUpdated, StepUpdated
from packages.core_domain.event_dispatcher import event_dispatcher

logger = logging.getLogger(__name__)


# Callback типы для обновления domain entities
# В реальной реализации это будут функции, которые обновляют entities в хранилище
UpdateGenerationCallback = Callable[[UUID, dict], None]
UpdateStepCallback = Callable[[UUID, dict], None]
GetStepCallback = Callable[[UUID], Optional[dict]]


def handle_job_result(
    job: Job,
    result: JobResult,
    update_generation: Optional[UpdateGenerationCallback] = None,
    update_step: Optional[UpdateStepCallback] = None,
    get_step: Optional[GetStepCallback] = None,
) -> None:
    """
    Обрабатывает результат выполнения Job и обновляет domain entities.
    
    После успешного выполнения:
    - Обновляет Step (progress=100, status=SUCCEEDED)
    - Обновляет Generation (status через state machine)
    - Публикует GenerationUpdated и StepUpdated события
    
    При ошибке:
    - Обновляет Step (status=FAILED)
    - Публикует StepUpdated событие
    
    Args:
        job: Выполненная задача
        result: Результат выполнения
        update_generation: Callback для обновления Generation (опционально)
        update_step: Callback для обновления Step (опционально)
        get_step: Callback для получения Step (опционально)
    
    Note:
        Если callbacks не переданы, только публикуются события.
        Обновление entities должно быть выполнено подписчиками на события.
    """
    if not job.step_id:
        logger.debug(f"Job {job.id} has no step_id, skipping step update")
        return
    
    step_id = job.step_id
    
    if result.success:
        # Успешное выполнение
        logger.info(f"Job {job.id} succeeded, updating step {step_id} and generation {job.generation_id}")
        
        # Обновляем Step через callback (если передан)
        if update_step:
            try:
                update_step(step_id, {
                    "status": StepStatus.SUCCEEDED,
                    "progress": 100,
                    "output_payload": result.output_payload,
                })
            except Exception as e:
                logger.error(f"Error updating step {step_id}: {e}")
        
        # Публикуем StepUpdated событие
        step_event = StepUpdated(
            step_id=step_id,
            generation_id=job.generation_id,
            status=StepStatus.SUCCEEDED,
            progress=100,
        )
        event_dispatcher.publish(step_event)
        
        # Обновляем Generation через callback (если передан)
        # Определяем новый статус на основе типа задачи
        new_status = _determine_generation_status(job.type, job.generation_id, get_step)
        
        if update_generation and new_status:
            try:
                update_generation(job.generation_id, {
                    "status": new_status,
                })
            except Exception as e:
                logger.error(f"Error updating generation {job.generation_id}: {e}")
        
        # Публикуем GenerationUpdated событие
        if new_status:
            generation_event = GenerationUpdated(
                generation_id=job.generation_id,
                status=new_status,
            )
            event_dispatcher.publish(generation_event)
    
    else:
        # Ошибка выполнения
        logger.warning(f"Job {job.id} failed, updating step {step_id} to FAILED")
        
        # Обновляем Step через callback (если передан)
        if update_step:
            try:
                update_step(step_id, {
                    "status": StepStatus.FAILED,
                    "error": result.error,
                })
            except Exception as e:
                logger.error(f"Error updating step {step_id}: {e}")
        
        # Публикуем StepUpdated событие
        step_event = StepUpdated(
            step_id=step_id,
            generation_id=job.generation_id,
            status=StepStatus.FAILED,
            progress=0,  # Прогресс сбрасывается при ошибке
        )
        event_dispatcher.publish(step_event)


def _determine_generation_status(
    job_type: JobType,
    generation_id: UUID,
    get_step: Optional[GetStepCallback] = None,
) -> Optional[GenerationStatus]:
    """
    Определяет новый статус Generation на основе типа выполненной задачи.
    
    Простая логика:
    - Для финальных задач (например, TEXT_GENERATION) → GENERATED
    - Для промежуточных задач → остаётся RUNNING
    
    Args:
        job_type: Тип выполненной задачи
        generation_id: Идентификатор генерации
        get_step: Callback для получения информации о шагах (опционально)
    
    Returns:
        Новый статус Generation или None, если статус не должен измениться
    """
    # Простая логика: финальные задачи переводят в GENERATED
    final_job_types = {
        JobType.TEXT_GENERATION,
        JobType.PRESENTATION_RENDER,
        JobType.TASK_SOLVE,
    }
    
    if job_type in final_job_types:
        return GenerationStatus.GENERATED
    
    # Промежуточные задачи - остаётся RUNNING
    return GenerationStatus.RUNNING



