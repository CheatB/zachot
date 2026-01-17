"""
Роутер для работы с данными текущего пользователя.
"""

from uuid import UUID
from fastapi import APIRouter, HTTPException, Header, Depends
from sqlalchemy import select
from ..schemas import MeResponse
from ..database import SessionLocal, User as UserDB, get_db
from ..dependencies import get_current_user
from packages.database.src.models import AuthToken
from sqlalchemy.orm import Session

router = APIRouter(prefix="/me", tags=["user"])

@router.get("", response_model=MeResponse)
async def get_me(user: UserDB = Depends(get_current_user)):
    """
    Возвращает информацию о текущем пользователе, его подписке и лимитах.
    """
    with SessionLocal() as session:
        # Перезагружаем пользователя из сессии
        user = session.execute(select(UserDB).where(UserDB.id == user.id)).scalar_one_or_none()
        
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
async def get_referral_info(user: UserDB = Depends(get_current_user)):
    """
    Возвращает реферальную информацию пользователя.
    """
    with SessionLocal() as session:
        # Перезагружаем пользователя из сессии
        user = session.execute(select(UserDB).where(UserDB.id == user.id)).scalar_one_or_none()
        
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
