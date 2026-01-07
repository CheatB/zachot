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
    # 1. Пытаемся получить user_id из токена (имитация JWT для MVP)
    user_id = DEFAULT_USER_ID
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            user_id = UUID(token) # В MVP токен — это просто UUID пользователя
        except ValueError:
            pass

    with SessionLocal() as session:
        user = session.query(UserDB).filter(UserDB.id == user_id).first()
        
        # 2. Если пользователя нет — создаем его (авто-регистрация для MVP)
        if not user:
            user = UserDB(
                id=user_id,
                email=f"user_{user_id.hex[:8]}@zachet.tech"
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        return MeResponse(
            id=user.id,
            role=user.role,
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
            }
        )
