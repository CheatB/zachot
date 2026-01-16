import logging
logger = logging.getLogger(__name__)
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Request
from ..schemas import (
    UsersAdminResponse, 
    UserRoleUpdateRequest, 
    UserAdminResponse, 
    AdminAnalyticsResponse, 
    AdminGenerationHistoryResponse,
    SuggestDetailsRequest,
    SuggestStructureRequest,
    SuggestSourcesRequest,
    SuggestTitleInfoRequest
)
from ..database import SessionLocal, User as UserDB
from ..services.model_router import model_router
from ..services.admin_service import admin_analytics_service
from ..services.ai_suggestion_service import ai_suggestion_service
from ..dependencies import get_current_user, require_admin
from packages.ai_services.src.prompt_manager import prompt_manager
from ..middleware.rate_limiter import limiter, RateLimits

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/model-routing")
async def get_model_routing(admin: UserDB = Depends(require_admin)):
    return model_router.config

@router.post("/model-routing")
async def update_model_routing(config: dict, admin: UserDB = Depends(require_admin)):
    if model_router.save_config(config):
        return {"status": "success"}
    raise HTTPException(status_code=500, detail="Failed to save configuration")

@router.get("/prompts")
async def get_prompts(admin: UserDB = Depends(require_admin)):
    return prompt_manager.prompts

@router.post("/prompts")
async def update_prompts(prompts: dict, admin: UserDB = Depends(require_admin)):
    if prompt_manager.save_config(prompts):
        return {"status": "success"}
    raise HTTPException(status_code=500, detail="Failed to save prompts")

@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def get_analytics(admin: UserDB = Depends(require_admin)):
    with SessionLocal() as session:
        return admin_analytics_service.get_analytics(session)

@router.get("/generations", response_model=AdminGenerationHistoryResponse)
async def get_generations_history(admin: UserDB = Depends(require_admin)):
    with SessionLocal() as session:
        return admin_analytics_service.get_generations_history(session)

@router.post("/suggest-structure")
@limiter.limit(RateLimits.AI_SUGGESTION)
async def suggest_structure(request: Request, req_data: SuggestStructureRequest, user: UserDB = Depends(get_current_user)):
    return await ai_suggestion_service.suggest_structure(
        topic=req_data.topic,
        goal=req_data.goal,
        idea=req_data.idea,
        module=req_data.module,
        work_type=req_data.workType,
        volume=req_data.volume,
        complexity=req_data.complexity,
        humanity=req_data.humanity,
        user_id=user.id
    )

@router.post("/suggest-sources")
@limiter.limit(RateLimits.AI_SUGGESTION)
async def suggest_sources(request: Request, req_data: SuggestSourcesRequest, user: UserDB = Depends(get_current_user)):
    return await ai_suggestion_service.suggest_sources(
        topic=req_data.topic,
        goal=req_data.goal,
        idea=req_data.idea,
        module=req_data.module,
        work_type=req_data.workType,
        complexity=req_data.complexity,
        humanity=req_data.humanity,
        user_id=user.id
    )

@router.post("/suggest-details")
@limiter.limit(RateLimits.AI_SUGGESTION)
async def suggest_details(request: Request, req_data: SuggestDetailsRequest, user: UserDB = Depends(get_current_user)):
    logger.info(f"Suggest details request: {req_data.dict()}")
    return await ai_suggestion_service.suggest_details(
        topic=req_data.topic,
        module=req_data.module,
        complexity=req_data.complexity,
        humanity=req_data.humanity
    )

@router.post("/suggest-title-info")
@limiter.limit(RateLimits.AI_SUGGESTION)
async def suggest_title_info(request: Request, req_data: SuggestTitleInfoRequest, user: UserDB = Depends(get_current_user)):
    return await ai_suggestion_service.suggest_title_info(university_short=req_data.university)

@router.get("/users", response_model=UsersAdminResponse)
async def list_users(admin: UserDB = Depends(require_admin)):
    with SessionLocal() as session:
        users = session.query(UserDB).all()
        return UsersAdminResponse(items=[
            UserAdminResponse(
                id=user.id,
                email=user.email,
                role=user.role,
                created_at=user.next_billing_date,
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
