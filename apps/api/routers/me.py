"""
Роутер для работы с данными текущего пользователя.
"""

from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from ..schemas import MeResponse
from ..database import SessionLocal, User as UserDB

router = APIRouter(prefix="/me", tags=["user"])

# Временный ID для режима интеграции (если токен не передан)
DEFAULT_USER_ID = UUID("00000000-0000-0000-0000-000000000001")

@router.get("", response_model=MeResponse)
async def get_me(authorization: str = Header(None)):
    """
    Возвращает информацию о текущем пользователе, его подписке и лимитах.
    """
    # 1. Проверяем наличие токена
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
    token = authorization.split(" ")[1]
    try:
        user_id = UUID(token) # В MVP токен — это просто UUID пользователя
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token format")

    with SessionLocal() as session:
        user = session.query(UserDB).filter(UserDB.id == user_id).first()
        
        # 2. Если пользователя нет — возвращаем 401
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return MeResponse(
            email=user.email,
            id=user.id,
            role=user.role,
            telegram_username=user.telegram_username,
            subscription={
                "planName": user.plan_name,
                "status": user.subscription_status,
                "monthlyPriceRub": user.monthly_price_rub,
                "nextBillingDate": user.next_billing_date
            },
            usage={
                "generationsUsed": user.generations_used,
                "generationsLimit": user.generations_limit,
                "tokensUsed": user.tokens_used,
                "tokensLimit": user.tokens_limit
            },
            fairUseMode=user.fair_use_mode,
            capabilities={
                "streamingAvailable": True,
                "maxTokensPerRequest": 8000 if user.plan_name.startswith("BASE") else 16000,
                "priority": "normal" if user.plan_name.startswith("BASE") else "high",
                "resultPersistence": True
            }
        )
