"""
Роутер для работы с Generation.
"""

import asyncio
import json
import logging
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status, Header, Depends
from fastapi.responses import StreamingResponse, Response
from ..services.export_service import export_service

from ..schemas import ActionRequest, GenerationCreateRequest, GenerationResponse, GenerationsResponse, GenerationUpdateRequest
from ..storage import generation_store
from ..database import SessionLocal, User as UserDB
from packages.core_domain import Generation
from packages.core_domain import GenerationStateMachine, InvalidGenerationTransitionError
from packages.core_domain.enums import GenerationStatus
from packages.billing.credits import get_credit_cost, format_credits_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generations", tags=["generations"])

# Dependency to get current user
def get_current_user(authorization: str = Header(None)) -> UserDB:
    user_id = UUID("00000000-0000-0000-0000-000000000001") # Default mock
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            user_id = UUID(token)
        except ValueError:
            pass
            
    with SessionLocal() as session:
        user = session.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            # Auto-create for MVP if token looks like a UUID
            user = UserDB(id=user_id, email=f"user_{user_id.hex[:8]}@zachet.tech")
            session.add(user)
            session.commit()
            session.refresh(user)
        return user

@router.get("", response_model=GenerationsResponse)
async def list_generations(user: UserDB = Depends(get_current_user)) -> GenerationsResponse:
    """
    Получает список всех генераций текущего пользователя.
    """
    try:
        generations = generation_store.get_all_for_user(user.id)
        generations.sort(key=lambda x: x.created_at, reverse=True)
        return GenerationsResponse(items=generations)
    except Exception as e:
        logger.error(f"Unexpected error listing generations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
async def create_generation(
    request: GenerationCreateRequest,
    user: UserDB = Depends(get_current_user)
) -> GenerationResponse:
    try:
        # Проверяем баланс кредитов
        work_type = request.work_type or "other"
        required_credits = get_credit_cost(work_type)
        credits_balance = getattr(user, 'credits_balance', 5) or 5
        
        if credits_balance < required_credits:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно кредитов. Для {work_type} требуется {format_credits_text(required_credits)}, "
                       f"доступно: {format_credits_text(credits_balance)}. Пожалуйста, обновите тариф."
            )

        generation_id = uuid4()
        now = datetime.now()
        generation = Generation(
            id=generation_id,
            user_id=user.id,
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
            usage_metadata=[],
        )
        
        saved_generation = generation_store.create(generation)
        
        # Списываем кредиты после успешного создания
        with SessionLocal() as session:
            db_user = session.query(UserDB).filter(UserDB.id == user.id).first()
            if db_user:
                db_user.credits_balance = (db_user.credits_balance or 5) - required_credits
                db_user.credits_used = (db_user.credits_used or 0) + required_credits
                db_user.generations_used = (db_user.generations_used or 0) + 1
                session.commit()
                logger.info(f"Deducted {required_credits} credits from user {user.id}. New balance: {db_user.credits_balance}")
        
        logger.info(f"Created generation {generation_id} for user {user.id}")
        return GenerationResponse.model_validate(saved_generation)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating generation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{generation_id}", response_model=GenerationResponse)
async def get_generation(generation_id: UUID, user: UserDB = Depends(get_current_user)) -> GenerationResponse:
    generation = generation_store.get(generation_id)
    if generation is None or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    return GenerationResponse.model_validate(generation)


@router.patch("/{generation_id}", response_model=GenerationResponse)
async def update_generation(
    generation_id: UUID,
    request: GenerationUpdateRequest,
    user: UserDB = Depends(get_current_user),
) -> GenerationResponse:
    generation = generation_store.get(generation_id)
    if generation is None or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    if generation.status != GenerationStatus.DRAFT:
        raise HTTPException(status_code=409, detail="Only DRAFT generations can be updated.")
    
    update_data = {}
    if request.input_payload is not None: update_data["input_payload"] = request.input_payload
    if request.settings_payload is not None: update_data["settings_payload"] = request.settings_payload
    if not update_data: return GenerationResponse.model_validate(generation)
    
    return GenerationResponse.model_validate(generation_store.update(generation_id, **update_data))


@router.post("/{generation_id}/actions", response_model=GenerationResponse)
async def execute_action(
    generation_id: UUID,
    request: ActionRequest,
    user: UserDB = Depends(get_current_user),
) -> GenerationResponse:
    generation = generation_store.get(generation_id)
    if generation is None or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    action = request.action
    if action == "next":
        target_status = GenerationStatus.RUNNING
        if generation.status != GenerationStatus.DRAFT:
            raise HTTPException(status_code=409, detail="Must be in DRAFT status")
    elif action == "confirm":
        target_status = GenerationStatus.RUNNING
        if generation.status != GenerationStatus.WAITING_USER:
            raise HTTPException(status_code=409, detail="Must be in WAITING_USER status")
    elif action == "cancel":
        target_status = GenerationStatus.CANCELED
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    
    updated_generation = GenerationStateMachine.transition(generation, target_status)
    saved_generation = generation_store.save(updated_generation)
    return GenerationResponse.model_validate(saved_generation)


@router.get("/{generation_id}/export/{format}")
async def export_generation(generation_id: UUID, format: str, user: UserDB = Depends(get_current_user)):
    generation = generation_store.get(generation_id)
    if not generation or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    content = generation.result_content or "Содержимое отсутствует."
    
    if format.lower() == "docx":
        file_stream = export_service.generate_docx(generation, content)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif format.lower() == "pdf":
        file_stream = export_service.generate_pdf(generation, content)
        media_type = "application/pdf"
    elif format.lower() == "pptx":
        file_stream = export_service.generate_pptx(generation, content)
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
    
    return StreamingResponse(
        file_stream,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=zachet_{generation_id}.{format}"}
    )


@router.get("/{generation_id}/events")
async def stream_generation_events(generation_id: UUID, user: UserDB = Depends(get_current_user)) -> StreamingResponse:
    generation = generation_store.get(generation_id)
    if generation is None or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    async def event_generator():
        queue = generation_store.subscribe(generation_id)
        try:
            initial_event = {"id": str(generation.id), "status": generation.status.value, "updated_at": generation.updated_at.isoformat()}
            yield f"event: generation\ndata: {json.dumps(initial_event)}\n\n"
            while True:
                event_data = await queue.get()
                yield f"event: generation\ndata: {json.dumps(event_data)}\n\n"
        finally:
            generation_store.unsubscribe(generation_id, queue)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
