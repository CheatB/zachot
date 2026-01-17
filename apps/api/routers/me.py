"""
Роутер для работы с данными текущего пользователя.
"""

from uuid import UUID
from fastapi import APIRouter, HTTPException, Header
from sqlalchemy import select
from ..schemas import MeResponse
from ..database import SessionLocal, User as UserDB

router = APIRouter(prefix="/me", tags=["user"])

@router.get("", response_model=MeResponse)
async def get_me(authorization: str = Header(None)):
    """
    Возвращает информацию о текущем пользователе, его подписке и лимитах.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
    token = authorization.split(" ")[1]
    try:
        user_id = UUID(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token format")

    with SessionLocal() as session:
        user = session.execute(select(UserDB).where(UserDB.id == user_id)).scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return MeResponse(
            email=user.email,
            id=user.id,
            role=user.role,
            telegram_username=user.telegram_username,
            subscription={
                "planName": user.plan_name or "BASE 499",
                "status": user.subscription_status or "active",
                "monthlyPriceRub": user.monthly_price_rub,
                "nextBillingDate": user.next_billing_date
            },
            usage={
                "generationsUsed": user.generations_used,
                "generationsLimit": user.generations_limit,
                "tokensUsed": user.tokens_used,
                "tokensLimit": user.tokens_limit,
                "creditsBalance": user.credits_balance,
                "creditsUsed": user.credits_used,
            },
            fairUseMode=user.fair_use_mode or "normal",
            capabilities={
                "streamingAvailable": True,
                "maxTokensPerRequest": 8000 if (user.plan_name or "").startswith("BASE") else 16000,
                "priority": "normal" if (user.plan_name or "").startswith("BASE") else "high",
            "resultPersistence": True
        }
    )


@router.get("/referral-info")
async def get_referral_info(authorization: str = Header(None)):
    """
    Возвращает реферальную информацию пользователя.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
    token = authorization.split(" ")[1]
    try:
        user_id = UUID(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token format")

    with SessionLocal() as session:
        user = session.execute(select(UserDB).where(UserDB.id == user_id)).scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Считаем заработанные кредиты через реферальную программу
        # Предполагаем, что за каждого приглашенного друга = 1 кредит
        credits_earned = user.referrals_count or 0

        return {
            "referral_code": user.referral_code or "",
            "referrals_count": user.referrals_count or 0,
            "credits_earned": credits_earned
        }
