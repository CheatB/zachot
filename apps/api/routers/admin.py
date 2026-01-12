from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Header
from ..schemas import (
    UsersAdminResponse, 
    UserRoleUpdateRequest, 
    UserAdminResponse, 
    AdminAnalyticsResponse, 
    DailyStat,
    AdminGenerationHistoryResponse,
    AdminGenerationHistoryItem,
    AdminGenerationUsage
)
from ..database import SessionLocal, User as UserDB, PaymentDB, GenerationDB
from ..services.openai_service import openai_service
from ..services.model_router import model_router
from ..services.prompt_service import prompt_service
from packages.ai_services.src.prompt_manager import prompt_manager
from .generations import get_current_user
import json
from sqlalchemy import func, cast, Date, desc

from packages.core_domain import Generation
from packages.core_domain.enums import GenerationStatus, GenerationModule
from packages.billing.credits import get_credit_cost
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/model-routing")
async def get_model_routing(admin: UserDB = Depends(get_current_user)):
    # Только админы могут видеть настройки
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return model_router.config

@router.post("/model-routing")
async def update_model_routing(config: dict, admin: UserDB = Depends(get_current_user)):
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if model_router.save_config(config):
        return {"status": "success"}
    raise HTTPException(status_code=500, detail="Failed to save configuration")

@router.get("/prompts")
async def get_prompts(admin: UserDB = Depends(get_current_user)):
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return prompt_manager.prompts

@router.post("/prompts")
async def update_prompts(prompts: dict, admin: UserDB = Depends(get_current_user)):
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if prompt_manager.save_config(prompts):
        return {"status": "success"}
    raise HTTPException(status_code=500, detail="Failed to save prompts")

@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def get_analytics(admin: UserDB = Depends(get_current_user)):
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    with SessionLocal() as session:
        # 1. Выручка (подтвержденные платежи)
        revenue_cents = session.query(func.sum(PaymentDB.amount)).filter(PaymentDB.status == "CONFIRMED").scalar() or 0
        revenue_rub = revenue_cents // 100
        
        # 2. Общее кол-во работ
        total_jobs = session.query(func.count(GenerationDB.id)).filter(GenerationDB.status != "DRAFT").scalar() or 0
        
        # 3. Затраты API (оценочно: $0.01 за 1000 токенов)
        total_tokens = session.query(func.sum(UserDB.tokens_used)).scalar() or 0
        api_costs_usd = (total_tokens / 1000) * 0.01
        
        # 4. Маржа
        # Курс доллара ~100 руб для простоты
        costs_rub = api_costs_usd * 100
        margin_percent = int(((revenue_rub - costs_rub) / revenue_rub * 100)) if revenue_rub > 0 else 0
        
        # 5. Статистика по дням (последние 7 дней)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        daily_query = session.query(
            cast(GenerationDB.created_at, Date).label('date'),
            func.count(GenerationDB.id).label('jobs')
        ).filter(
            GenerationDB.created_at >= seven_days_ago,
            GenerationDB.status != "DRAFT"
        ).group_by(
            cast(GenerationDB.created_at, Date)
        ).all()
        
        daily_stats = [
            DailyStat(
                date=str(d.date),
                tokens=int(total_tokens / 30), # Оценочно распределяем
                jobs=d.jobs
            ) for d in daily_query
        ]
        
        return AdminAnalyticsResponse(
            revenueRub=revenue_rub,
            apiCostsUsd=round(api_costs_usd, 2),
            marginPercent=margin_percent,
            totalJobs=total_jobs,
            dailyStats=daily_stats
        )

@router.get("/generations", response_model=AdminGenerationHistoryResponse)
async def get_generations_history(admin: UserDB = Depends(get_current_user)):
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    with SessionLocal() as session:
        query = session.query(
            GenerationDB, UserDB.email
        ).join(
            UserDB, GenerationDB.user_id == UserDB.id
        ).order_by(
            desc(GenerationDB.created_at)
        ).limit(100) # Limit to last 100 for performance
        
        results = query.all()
        
        items = []
        for db_gen, email in results:
            usage = db_gen.usage_metadata or []
            total_tokens = sum(u.get('tokens', 0) for u in usage)
            total_cost_usd = sum(u.get('cost_usd', 0.0) for u in usage)
            
            # Simple conversion: 1 USD = 100 RUB
            total_cost_rub = total_cost_usd * 100
            
            # Estimated revenue based on work type and credit cost
            # 1 credit approx 100 RUB (based on 499 RUB / 5 credits)
            credit_cost = get_credit_cost(db_gen.work_type or "other")
            estimated_revenue_rub = credit_cost * 100
            
            # Profit
            estimated_profit_rub = estimated_revenue_rub - total_cost_rub
            
            items.append(AdminGenerationHistoryItem(
                id=db_gen.id,
                title=db_gen.title,
                module=db_gen.module,
                status=db_gen.status,
                created_at=db_gen.created_at,
                user_email=email,
                usage_metadata=[AdminGenerationUsage(**u) for u in usage],
                total_tokens=total_tokens,
                total_cost_rub=round(total_cost_rub, 2),
                estimated_revenue_rub=float(estimated_revenue_rub),
                estimated_profit_rub=round(estimated_profit_rub, 2)
            ))
            
        return AdminGenerationHistoryResponse(items=items)

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
    model_name = model_router.get_model_for_step("structure", work_type or "other")

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
            json_mode=True,
            step_type="structure",
            work_type=work_type or "other"
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
    model_name = model_router.get_model_for_step("sources", work_type or "other")

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
            json_mode=True,
            step_type="sources",
            work_type=work_type or "other"
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
            {"title": "КиберЛенинке: Роль ИИ в образовании", "url": "https://cyberleninka.ru", "description": "Научная статья о влиянии нейросетей на учебный процесс.", "isAiSelected": True}
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
    model_name = model_router.get_model_for_step("suggest_details")

    prompt_template = prompt_manager.get_prompt("suggest_details")
    prompt = prompt_template.format(topic=topic)

    try:
        raw_response = await openai_service.chat_completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            json_mode=True,
            step_type="suggest_details"
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

    prompt_template = prompt_manager.get_prompt("suggest_title_info")
    prompt = prompt_template.format(university_short=university_short)

    try:
        raw_response = await openai_service.chat_completion(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            json_mode=True
        )
        return json.loads(raw_response or '{"university_full": "' + university_short + '", "city": "Москва"}')
    except Exception:
        return {"university_full": university_short, "city": "Москва"}
