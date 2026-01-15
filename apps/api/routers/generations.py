from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from ..schemas import (
    GenerationCreateRequest,
    GenerationUpdateRequest,
    GenerationResponse,
    GenerationsResponse,
    ActionRequest,
)
from ..database import User as UserDB
from ..services.generation_service import generation_service
from ..storage import generation_store
from ..dependencies import get_current_user

router = APIRouter(prefix="/generations", tags=["generations"])


@router.get("", response_model=GenerationsResponse)
async def list_generations(user: UserDB = Depends(get_current_user)) -> GenerationsResponse:
    generations = generation_store.get_all_for_user(user.id)
    return GenerationsResponse(items=[GenerationResponse.model_validate(g) for g in generations])


@router.post("", response_model=GenerationResponse, status_code=201)
async def create_generation(
    request: GenerationCreateRequest,
    user: UserDB = Depends(get_current_user)
) -> GenerationResponse:
    # Since we changed schemas to use dict for payloads, we use them directly
    input_payload = request.input_payload if isinstance(request.input_payload, dict) else request.input_payload.model_dump()
    settings_payload = {}
    if request.settings_payload:
        settings_payload = request.settings_payload if isinstance(request.settings_payload, dict) else request.settings_payload.model_dump()

    saved_generation = await generation_service.create_draft(
        user=user,
        module=request.module,
        input_payload=input_payload,
        work_type=request.work_type,
        complexity=request.complexity_level,
        humanity=request.humanity_level,
        settings=settings_payload
    )
    return GenerationResponse.model_validate(saved_generation)


@router.get("/{generation_id}", response_model=GenerationResponse)
async def get_generation(generation_id: UUID, user: UserDB = Depends(get_current_user)) -> GenerationResponse:
    import logging
    logger = logging.getLogger(__name__)
    
    generation = generation_store.get(generation_id)
    if generation is None or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    # Логируем длину result_content перед отправкой
    content_length = len(generation.result_content) if generation.result_content else 0
    logger.info(f"GET /generations/{generation_id}: result_content length={content_length}")
    
    return GenerationResponse.model_validate(generation)


@router.patch("/{generation_id}", response_model=GenerationResponse)
async def update_generation(
    generation_id: UUID,
    request: GenerationUpdateRequest,
    user: UserDB = Depends(get_current_user),
) -> GenerationResponse:
    input_payload = None
    if request.input_payload is not None:
        input_payload = request.input_payload if isinstance(request.input_payload, dict) else request.input_payload.model_dump(exclude_unset=True)
    
    settings_payload = None
    if request.settings_payload is not None:
        settings_payload = request.settings_payload if isinstance(request.settings_payload, dict) else request.settings_payload.model_dump(exclude_unset=True)

    updated_gen = await generation_service.update_draft(
        generation_id=generation_id,
        user_id=user.id,
        input_payload=input_payload,
        settings_payload=settings_payload
    )
    return GenerationResponse.model_validate(updated_gen)


@router.post("/{generation_id}/actions", response_model=GenerationResponse)
async def execute_action(
    generation_id: UUID,
    request: ActionRequest,
    user: UserDB = Depends(get_current_user),
) -> GenerationResponse:
    saved_generation = await generation_service.perform_action(
        generation_id=generation_id,
        user_id=user.id,
        action=request.action
    )
    return GenerationResponse.model_validate(saved_generation)


@router.delete("/{generation_id}", status_code=204)
async def delete_generation(generation_id: UUID, user: UserDB = Depends(get_current_user)):
    generation = generation_store.get(generation_id)
    if generation is None or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    generation_store.delete(generation_id)
    return None
