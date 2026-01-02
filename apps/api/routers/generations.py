"""
Роутер для работы с Generation.
"""

import logging
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status

from ..schemas import GenerationCreateRequest, GenerationResponse, GenerationUpdateRequest
from ..storage import generation_store
from packages.core_domain import Generation
from packages.core_domain.enums import GenerationStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generations", tags=["generations"])


@router.post("", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
async def create_generation(request: GenerationCreateRequest) -> GenerationResponse:
    """
    Создаёт новую Generation со статусом DRAFT.
    
    Args:
        request: Данные для создания Generation
    
    Returns:
        Созданная Generation
    
    Raises:
        HTTPException: При ошибке валидации или сохранения
    """
    try:
        # Генерируем UUID для новой генерации
        generation_id = uuid4()
        # TODO: В будущем user_id должен браться из аутентификации
        user_id = uuid4()  # Временная заглушка
        
        # Создаём Generation со статусом DRAFT
        now = datetime.now()
        generation = Generation(
            id=generation_id,
            user_id=user_id,
            module=request.module,
            status=GenerationStatus.DRAFT,
            created_at=now,
            updated_at=now,
            input_payload=request.input_payload,
            settings_payload=request.settings_payload or {},
        )
        
        # Сохраняем в хранилище
        saved_generation = generation_store.create(generation)
        
        logger.info(f"Created generation {generation_id} with module {request.module.value}")
        
        # Возвращаем ответ
        return GenerationResponse.model_validate(saved_generation)
    
    except ValueError as e:
        logger.error(f"Error creating generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error creating generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/{generation_id}", response_model=GenerationResponse)
async def get_generation(generation_id: UUID) -> GenerationResponse:
    """
    Получает Generation по идентификатору.
    
    Args:
        generation_id: UUID генерации
    
    Returns:
        Generation
    
    Raises:
        HTTPException: 404 если Generation не найдена
    """
    try:
        generation = generation_store.get(generation_id)
        
        if generation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generation with id {generation_id} not found",
            )
        
        return GenerationResponse.model_validate(generation)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting generation {generation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.patch("/{generation_id}", response_model=GenerationResponse)
async def update_generation(
    generation_id: UUID,
    request: GenerationUpdateRequest,
) -> GenerationResponse:
    """
    Обновляет черновик Generation.
    
    Позволяет обновить input_payload и/или settings_payload только для
    Generation в статусе DRAFT. Обновляются только переданные поля.
    
    Args:
        generation_id: UUID генерации для обновления
        request: Данные для обновления
    
    Returns:
        Обновлённая Generation
    
    Raises:
        HTTPException: 
            - 404 если Generation не найдена
            - 409 если статус не DRAFT (конфликт состояния)
    """
    try:
        # Проверяем, что Generation существует
        generation = generation_store.get(generation_id)
        
        if generation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generation with id {generation_id} not found",
            )
        
        # Проверяем, что статус DRAFT
        if generation.status != GenerationStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot update generation with status {generation.status.value}. Only DRAFT generations can be updated.",
            )
        
        # Подготавливаем данные для обновления
        update_data = {}
        
        # Обновляем только переданные поля
        if request.input_payload is not None:
            update_data["input_payload"] = request.input_payload
        
        if request.settings_payload is not None:
            update_data["settings_payload"] = request.settings_payload
        
        # Если ничего не передано, возвращаем без изменений
        if not update_data:
            logger.warning(f"Update request for generation {generation_id} contains no fields to update")
            return GenerationResponse.model_validate(generation)
        
        # Обновляем updated_at
        update_data["updated_at"] = datetime.now()
        
        # Обновляем в хранилище
        updated_generation = generation_store.update(generation_id, **update_data)
        
        logger.info(f"Updated generation {generation_id}")
        
        return GenerationResponse.model_validate(updated_generation)
    
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Error updating generation {generation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error updating generation {generation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )

