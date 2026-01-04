"""
Роутер для работы с Job (постановка в очередь).
"""

import logging
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status

from ..schemas import JobQueuedResponse
from ..storage import generation_store
from packages.core_domain.enums import GenerationModule, GenerationStatus
from packages.jobs import Job
from packages.jobs.enums import JobType, JobStatus
from apps.worker.actors import execute_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generations", tags=["jobs"])


def _map_generation_module_to_job_type(module: GenerationModule) -> JobType:
    """
    Маппит GenerationModule в соответствующий JobType.
    
    Args:
        module: Тип модуля генерации
        
    Returns:
        Соответствующий JobType
        
    Raises:
        ValueError: Если модуль не поддерживается
    """
    mapping = {
        GenerationModule.TEXT: JobType.TEXT_STRUCTURE,
        GenerationModule.PRESENTATION: JobType.PRESENTATION_STRUCTURE,
        GenerationModule.TASK: JobType.TASK_SOLVE,
    }
    
    if module not in mapping:
        raise ValueError(f"Unsupported generation module: {module.value}")
    
    return mapping[module]


@router.post(
    "/{generation_id}/jobs",
    response_model=JobQueuedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_job(generation_id: UUID) -> JobQueuedResponse:
    """
    Ставит Job в очередь Dramatiq для асинхронного выполнения.
    
    Проверяет существование Generation и её статус (должен быть RUNNING).
    Создаёт Job на основе Generation.module и ставит его в очередь.
    
    Args:
        generation_id: UUID генерации
        
    Returns:
        JobQueuedResponse с job_id и статусом "queued"
        
    Raises:
        HTTPException:
            - 404 если Generation не найдена
            - 409 если Generation не в статусе RUNNING
    """
    # Проверяем существование Generation
    generation = generation_store.get(generation_id)
    
    if generation is None:
        logger.warning(f"Generation {generation_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generation with id {generation_id} not found",
        )
    
    # Проверяем статус Generation
    if generation.status != GenerationStatus.RUNNING:
        logger.warning(
            f"Generation {generation_id} is not in RUNNING status, "
            f"current status: {generation.status.value}"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Generation must be in RUNNING status to create a job, "
                f"current status: {generation.status.value}"
            ),
        )
    
    # Маппим Generation.module в JobType
    try:
        job_type = _map_generation_module_to_job_type(generation.module)
    except ValueError as e:
        logger.error(f"Unsupported generation module {generation.module.value}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported generation module: {generation.module.value}",
        )
    
    # Создаём Job
    job_id = uuid4()
    now = datetime.now()
    
    job = Job(
        id=job_id,
        type=job_type,
        generation_id=generation.id,
        step_id=None,
        input_payload=generation.input_payload,
        status=JobStatus.PENDING,
        retries=0,
        max_retries=3,
        created_at=now,
        started_at=None,
        finished_at=None,
    )
    
    # Сериализуем Job для очереди
    job_dict = job.model_dump(mode="json")
    
    # Ставим Job в очередь через Dramatiq
    try:
        message = execute_job.send(job_dict)
        logger.info(
            f"Job {job_id} queued for generation {generation_id}: "
            f"type={job_type.value}, message_id={message.message_id}"
        )
    except Exception as e:
        logger.error(f"Failed to queue job {job_id} for generation {generation_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to queue job",
        )
    
    # Возвращаем ответ
    return JobQueuedResponse(
        job_id=job_id,
        status="queued",
    )


