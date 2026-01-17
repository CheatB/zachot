from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from ..schemas import (
    GenerationCreateRequest,
    GenerationUpdateRequest,
    GenerationResponse,
    GenerationsResponse,
    GenerationCostResponse,
    ActionRequest,
)
from ..database import SessionLocal, User as UserDB
from ..services.generation_service import generation_service
from ..services.export_service import export_service
from ..storage import generation_store
from ..dependencies import get_current_user
from ..middleware.rate_limiter import limiter, RateLimits
from packages.billing.credits import get_credit_cost

router = APIRouter(prefix="/generations", tags=["generations"])


@router.get("", response_model=GenerationsResponse)
@limiter.limit(RateLimits.READ_OPERATIONS)
async def list_generations(request: Request, user: UserDB = Depends(get_current_user)) -> GenerationsResponse:
    generations = generation_store.get_all_for_user(user.id)
    return GenerationsResponse(items=[GenerationResponse.model_validate(g) for g in generations])


@router.post("", response_model=GenerationResponse, status_code=201)
@limiter.limit(RateLimits.GENERATION_CREATE)
async def create_generation(
    request: Request,
    gen_request: GenerationCreateRequest,
    user: UserDB = Depends(get_current_user)
) -> GenerationResponse:
    # Since we changed schemas to use dict for payloads, we use them directly
    input_payload = gen_request.input_payload if isinstance(gen_request.input_payload, dict) else gen_request.input_payload.model_dump()
    settings_payload = {}
    if gen_request.settings_payload:
        settings_payload = gen_request.settings_payload if isinstance(gen_request.settings_payload, dict) else gen_request.settings_payload.model_dump()

    saved_generation = await generation_service.create_draft(
        user=user,
        module=gen_request.module,
        input_payload=input_payload,
        work_type=gen_request.work_type,
        complexity=gen_request.complexity_level,
        humanity=gen_request.humanity_level,
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
        settings_payload=settings_payload,
        result_content=request.result_content
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


@router.get("/{generation_id}/cost", response_model=GenerationCostResponse)
async def get_generation_cost(
    generation_id: UUID,
    user: UserDB = Depends(get_current_user)
) -> GenerationCostResponse:
    """Возвращает стоимость генерации и баланс пользователя"""
    from packages.billing.credits import get_credit_cost
    
    generation = generation_store.get(generation_id)
    if not generation or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    work_type = generation.work_type or "other"
    required_credits = get_credit_cost(work_type)
    
    with SessionLocal() as session:
        db_user = session.query(UserDB).filter(UserDB.id == user.id).first()
        available_credits = db_user.credits_balance or 0
    
    return GenerationCostResponse(
        required_credits=required_credits,
        available_credits=available_credits,
        can_generate=available_credits >= required_credits,
        work_type=work_type
    )


@router.post("/{generation_id}/confirm", response_model=GenerationResponse)
async def confirm_generation(
    generation_id: UUID,
    user: UserDB = Depends(get_current_user)
) -> GenerationResponse:
    """
    Подтверждает генерацию и списывает кредиты.
    Переводит статус из DRAFT в RUNNING.
    """
    confirmed_generation = await generation_service.confirm_and_charge(
        generation_id=generation_id,
        user=user
    )
    return GenerationResponse.model_validate(confirmed_generation)


@router.delete("/{generation_id}", status_code=204)
async def delete_generation(generation_id: UUID, user: UserDB = Depends(get_current_user)):
    generation = generation_store.get(generation_id)
    if generation is None or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    generation_store.delete(generation_id)
    return None


@router.get("/{generation_id}/export/{format}")
async def export_generation(
    generation_id: UUID,
    format: str,
    user: UserDB = Depends(get_current_user)
):
    """
    Экспорт генерации в указанном формате (docx, pdf, pptx).
    """
    # Проверяем существование генерации и права доступа
    generation = generation_store.get(generation_id)
    if generation is None or generation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    # Проверяем, что генерация завершена
    if not generation.result_content:
        raise HTTPException(status_code=400, detail="Generation is not completed yet")
    
    # Проверяем формат
    format_lower = format.lower()
    if format_lower not in ['docx', 'pdf', 'pptx']:
        raise HTTPException(status_code=400, detail="Unsupported format. Use: docx, pdf, or pptx")
    
    # Генерируем файл
    try:
        if format_lower == 'docx':
            file_stream = export_service.generate_docx(generation, generation.result_content)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            filename = f"zachet_{generation.title or generation_id}.docx"
        elif format_lower == 'pdf':
            file_stream = export_service.generate_pdf(generation, generation.result_content)
            media_type = "application/pdf"
            filename = f"zachet_{generation.title or generation_id}.pdf"
        elif format_lower == 'pptx':
            file_stream = export_service.generate_pptx(generation, generation.result_content)
            media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            filename = f"zachet_{generation.title or generation_id}.pptx"
        
        return StreamingResponse(
            file_stream,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
