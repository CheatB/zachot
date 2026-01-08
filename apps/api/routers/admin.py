from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Header
from ..schemas import UsersAdminResponse, UserRoleUpdateRequest, UserAdminResponse
from ..database import SessionLocal, User as UserDB
from ..services.openai_service import openai_service
from ..services.model_router import model_router
from .generations import get_current_user
import json

from ..services.prompt_service import prompt_service
from packages.core_domain import Generation
from packages.core_domain.enums import GenerationStatus, GenerationModule
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/suggest-structure")
async def suggest_structure(request: dict, user: UserDB = Depends(get_current_user)):
    """
    Предлагает структуру работы на основе темы, цели и идеи.
    """
    topic = request.get("topic")
    goal = request.get("goal")
    idea = request.get("idea")
    work_type = request.get("workType")
    volume = request.get("volume", 10)
    complexity = request.get("complexity", "student")

    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    # Используем динамический роутинг
    model_config = model_router.get_model_for_step("structure")
    model_name = model_config["model"]

    # Создаем фиктивный объект Generation для PromptService
    dummy_gen = Generation(
        id=UUID("00000000-0000-0000-0000-000000000000"),
        user_id=user.id,
        module=GenerationModule.TEXT,
        status=GenerationStatus.DRAFT,
        work_type=work_type,
        complexity_level=complexity,
        input_payload={"topic": topic, "goal": goal, "idea": idea, "volume": volume},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    prompt = prompt_service.construct_structure_prompt(dummy_gen)

    try:
        raw_response = await openai_service.chat_completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            json_mode=True
        )
        
        if not raw_response:
            raise ValueError("Failed to get response from AI")
            
        return json.loads(raw_response)
    except Exception as e:
        return {"structure": [
            {"title": "Введение", "level": 1},
            {"title": "Глава 1. Обзор предметной области", "level": 1},
            {"title": "Глава 2. Практическая часть", "level": 1},
            {"title": "Заключение", "level": 1},
            {"title": "Список литературы", "level": 1}
        ]}

def require_admin(user: UserDB = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/users", response_model=UsersAdminResponse)
async def list_users(admin: UserDB = Depends(require_admin)):
    with SessionLocal() as session:
        users = session.query(UserDB).all()
        return UsersAdminResponse(items=[
            UserAdminResponse(
                id=user.id,
                email=user.email,
                role=user.role,
                created_at=user.next_billing_date, # For MVP we use this as reg date proxy
                generations_used=user.generations_used,
                generations_limit=user.generations_limit,
                tokens_used=user.tokens_used,
                tokens_limit=user.tokens_limit,
                subscription_status=user.subscription_status
            ) for user in users
        ])

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID, 
    request: UserRoleUpdateRequest, 
    admin: UserDB = Depends(require_admin)
):
    with SessionLocal() as session:
        user = session.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.role = request.role
        session.commit()
        return {"status": "success", "role": user.role}

@router.post("/suggest-sources")
async def suggest_sources(request: dict, user: UserDB = Depends(get_current_user)):
    """
    Предлагает источники литературы на основе темы.
    """
    topic = request.get("topic")
    work_type = request.get("workType")
    complexity = request.get("complexity", "student")

    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    # Используем динамический роутинг
    model_config = model_router.get_model_for_step("sources")
    model_name = model_config["model"]

    # Создаем фиктивный объект Generation для PromptService
    dummy_gen = Generation(
        id=UUID("00000000-0000-0000-0000-000000000000"),
        user_id=user.id,
        module=GenerationModule.TEXT,
        status=GenerationStatus.DRAFT,
        work_type=work_type,
        complexity_level=complexity,
        input_payload={"topic": topic},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    prompt = prompt_service.construct_sources_prompt(dummy_gen)

    try:
        raw_response = await openai_service.chat_completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            json_mode=True
        )
        
        if not raw_response:
            raise ValueError("Failed to get response from AI")
            
        data = json.loads(raw_response)
        # Добавляем флаг isAiSelected
        for source in data.get("sources", []):
            source["isAiSelected"] = True
        return data
    except Exception as e:
        return {"sources": [
            {"title": "КиберЛенинка: Роль ИИ в образовании", "url": "https://cyberleninka.ru", "description": "Научная статья о влиянии нейросетей на учебный процесс.", "isAiSelected": True}
        ]}

@router.post("/suggest-details")
async def suggest_details(request: dict, user: UserDB = Depends(get_current_user)):
    """
    Предлагает цель и идею работы на основе темы.
    """
    topic = request.get("topic")
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    # Используем динамический роутинг из настроек
    model_config = model_router.get_model_for_step("suggest_details")
    model_name = model_config["model"]

    prompt = f"""
    Ты — академический консультант. На основе темы "{topic}" предложи:
    1. Цель работы (1 предложение)
    2. Основную идею (тезис) работы (1-2 предложения)
    
    Верни результат в формате JSON: {{"goal": "...", "idea": "..."}}
    """

    try:
        raw_response = await openai_service.chat_completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            json_mode=True
        )
        
        if not raw_response:
            raise ValueError("Failed to get response from AI")
            
        return json.loads(raw_response)
    except Exception as e:
        return {"goal": "Исследовать основные аспекты темы", "idea": "Работа направлена на глубокий анализ выбранного направления."}

@router.post("/suggest-title-info")
async def suggest_title_info(request: dict, user: UserDB = Depends(get_current_user)):
    """
    Дополняет информацию для титульного листа (полное название ВУЗа, город).
    """
    university_short = request.get("university")
    if not university_short:
        raise HTTPException(status_code=400, detail="University name is required")

    prompt = f"""
    Ты — сотрудник отдела кадров университета. По краткому названию вуза "{university_short}" найди:
    1. Полное официальное название (например, для МГУ это "Московский государственный университет имени М.В. Ломоносова").
    2. Город, в котором находится главный корпус.
    
    Верни результат в формате JSON: {{"university_full": "...", "city": "..."}}
    """

    try:
        raw_response = await openai_service.chat_completion(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            json_mode=True
        )
        return json.loads(raw_response or '{"university_full": "' + university_short + '", "city": "Москва"}')
    except Exception:
        return {"university_full": university_short, "city": "Москва"}
