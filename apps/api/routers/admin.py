from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Header
from ..schemas import UsersAdminResponse, UserRoleUpdateRequest, UserAdminResponse
from ..database import SessionLocal, User as UserDB
from ..services.openai_service import openai_service
from .generations import get_current_user
import json

router = APIRouter(prefix="/admin", tags=["admin"])

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

@router.post("/suggest-details")
async def suggest_details(request: dict, user: UserDB = Depends(get_current_user)):
    """
    Предлагает цель и идею работы на основе темы.
    """
    topic = request.get("topic")
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    prompt = f"""
    Ты — академический консультант. На основе темы "{topic}" предложи:
    1. Цель работы (1 предложение)
    2. Основную идею (тезис) работы (1-2 предложения)
    
    Верни результат в формате JSON: {{"goal": "...", "idea": "..."}}
    """

    try:
        raw_response = await openai_service.chat_completion(
            model="openai/gpt-4o-mini",
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
