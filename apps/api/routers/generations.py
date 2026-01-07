"""
Роутер для работы с Generation.
"""

import asyncio
import json
import logging
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from ..services.export_service import export_service

from ..schemas import ActionRequest, GenerationCreateRequest, GenerationResponse, GenerationsResponse, GenerationUpdateRequest
from ..storage import generation_store
from packages.core_domain import Generation
from packages.core_domain import GenerationStateMachine, InvalidGenerationTransitionError
from packages.core_domain.enums import GenerationStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generations", tags=["generations"])


@router.get("", response_model=GenerationsResponse)
async def list_generations() -> GenerationsResponse:
    """
    Получает список всех генераций.
    """
    try:
        generations = generation_store.get_all()
        # Сортируем по дате создания (новые сверху)
        generations.sort(key=lambda x: x.created_at, reverse=True)
        return GenerationsResponse(items=generations)
    except Exception as e:
        logger.error(f"Unexpected error listing generations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.post("", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
async def create_generation(request: GenerationCreateRequest) -> GenerationResponse:
    """
    Создаёт новую Generation со статусом DRAFT.
    """
    try:
        # 1. Жесткая проверка лимитов (согласно User Spec)
        # В будущем здесь будет запрос к базе пользователей
        current_used = 2 # Mock
        limit = 5 # Mock
        if current_used >= limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Лимит генераций на этот месяц исчерпан. Пожалуйста, обновите тариф."
            )

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
            title=request.input_payload.get("topic") or request.input_payload.get("input"),
            work_type=request.work_type,
            complexity_level=request.complexity_level,
            humanity_level=request.humanity_level,
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


@router.post("/{generation_id}/actions", response_model=GenerationResponse)
async def execute_action(
    generation_id: UUID,
    request: ActionRequest,
) -> GenerationResponse:
    """
    Выполняет действие над Generation.
    
    Поддерживаемые действия:
    - "next": переход DRAFT → RUNNING
    - "confirm": переход WAITING_USER → RUNNING
    - "cancel": переход любого статуса → CANCELED
    
    Args:
        generation_id: UUID генерации
        request: Запрос с действием
    
    Returns:
        Обновлённая Generation
    
    Raises:
        HTTPException:
            - 404 если Generation не найдена
            - 400 если неизвестное действие
            - 409 если переход недопустим
    """
    try:
        # Загружаем Generation из store
        generation = generation_store.get(generation_id)
        
        if generation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generation with id {generation_id} not found",
            )
        
        # Определяем целевой статус в зависимости от действия
        action = request.action
        
        if action == "next":
            target_status = GenerationStatus.RUNNING
            # Проверяем, что текущий статус DRAFT
            if generation.status != GenerationStatus.DRAFT:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Cannot execute 'next' action: generation must be in DRAFT status, current status is {generation.status.value}",
                )
        
        elif action == "confirm":
            target_status = GenerationStatus.RUNNING
            # Проверяем, что текущий статус WAITING_USER
            if generation.status != GenerationStatus.WAITING_USER:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Cannot execute 'confirm' action: generation must be in WAITING_USER status, current status is {generation.status.value}",
                )
        
        elif action == "cancel":
            target_status = GenerationStatus.CANCELED
            # cancel можно выполнить из любого статуса
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown action: {action}. Supported actions: next, confirm, cancel",
            )
        
        # Применяем transition через GenerationStateMachine
        try:
            updated_generation = GenerationStateMachine.transition(
                generation,
                target_status
            )
        except InvalidGenerationTransitionError as e:
            logger.error(
                f"Invalid transition for generation {generation_id}: "
                f"{generation.status.value} → {target_status.value}"
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot transition from {generation.status.value} to {target_status.value}: {str(e)}",
            )
        
        # Сохраняем обновлённую Generation в store
        saved_generation = generation_store.save(updated_generation)
        
        logger.info(
            f"Executed action '{action}' on generation {generation_id}: "
            f"{generation.status.value} → {saved_generation.status.value}"
        )
        
        return GenerationResponse.model_validate(saved_generation)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error executing action on generation {generation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )



@router.get("/{generation_id}/export/{format}")
async def export_generation(generation_id: UUID, format: str):
    """
    Экспортирует результат генерации в файл (.docx или .pdf).
    """
    generation = generation_store.get(generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    # Пытаемся найти контент в input_payload или settings_payload
    # В будущем это должно быть в Artifacts
    content = generation.input_payload.get("result_content") or \
              generation.settings_payload.get("result_content") or \
              "Содержимое результата пока отсутствует."
    
    if format.lower() == "docx":
        file_stream = export_service.generate_docx(generation, content)
        filename = f"zachet_{generation_id}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif format.lower() == "pdf":
        file_stream = export_service.generate_pdf(generation, content)
        filename = f"zachet_{generation_id}.pdf"
        media_type = "application/pdf"
    elif format.lower() == "pptx":
        file_stream = export_service.generate_pptx(generation, content)
        filename = f"zachet_{generation_id}.pptx"
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'docx', 'pdf' or 'pptx'")
    
    return StreamingResponse(
        file_stream,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/{generation_id}/smart-edit", response_model=GenerationResponse)
async def smart_edit(generation_id: UUID, request: dict):
    """
    Выполняет 'умное редактирование' текста (рерайт).
    """
    generation = generation_store.get(generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    action = request.get("action")
    content = request.get("content", "")
    
    # Имитация работы LLM для разных экшенов
    edited_content = f"{content}\n\n[Текст был обработан: {action}]"
    
    # Сохраняем обновленный результат
    updated = generation_store.update(generation_id, result_content=edited_content)
    return GenerationResponse.model_validate(updated)


@router.get("/{generation_id}/events")
async def stream_generation_events(generation_id: UUID) -> StreamingResponse:
    """
    SSE endpoint для стриминга событий изменения Generation.
    
    При подключении сразу отправляет текущее состояние Generation,
    затем отправляет события при каждом изменении через pub/sub.
    
    Формат события:
    ```
    event: generation
    data: {"id": "...", "status": "...", "updated_at": "..."}
    ```
    
    Args:
        generation_id: UUID генерации
    
    Returns:
        StreamingResponse с Content-Type: text/event-stream
    
    Raises:
        HTTPException: 404 если Generation не найдена
    """
    # Проверяем, что Generation существует
    generation = generation_store.get(generation_id)
    
    if generation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generation with id {generation_id} not found",
        )
    
    logger.info(f"SSE connection opened for generation {generation_id}")
    
    async def event_generator():
        """Генератор событий SSE."""
        queue = None
        try:
            # Подписываемся на обновления
            queue = generation_store.subscribe(generation_id)
            
            # Сразу отправляем текущее состояние
            initial_event = {
                "id": str(generation.id),
                "status": generation.status.value,
                "updated_at": generation.updated_at.isoformat(),
            }
            
            yield f"event: generation\n"
            yield f"data: {json.dumps(initial_event)}\n\n"
            
            # Отправляем heartbeat каждые 30 секунд
            heartbeat_interval = 30.0
            last_heartbeat = asyncio.get_event_loop().time()
            
            # Слушаем обновления
            while True:
                try:
                    # Ждём событие с таймаутом для heartbeat
                    timeout = max(0.1, heartbeat_interval - (asyncio.get_event_loop().time() - last_heartbeat))
                    
                    try:
                        event_data = await asyncio.wait_for(queue.get(), timeout=timeout)
                        
                        # Отправляем событие
                        yield f"event: generation\n"
                        yield f"data: {json.dumps(event_data)}\n\n"
                        
                        last_heartbeat = asyncio.get_event_loop().time()
                    
                    except asyncio.TimeoutError:
                        # Отправляем heartbeat
                        yield f": heartbeat\n\n"
                        last_heartbeat = asyncio.get_event_loop().time()
                
                except asyncio.CancelledError:
                    # Клиент отключился
                    logger.info(f"SSE connection cancelled for generation {generation_id}")
                    break
                
                except Exception as e:
                    logger.error(f"Error in SSE stream for generation {generation_id}: {e}")
                    break
        
        finally:
            # Отписываемся при отключении
            if queue is not None:
                generation_store.unsubscribe(generation_id, queue)
                logger.info(f"SSE connection closed for generation {generation_id}")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Отключаем буферизацию в nginx
        },
    )
