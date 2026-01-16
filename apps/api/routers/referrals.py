"""
Роутер для реферальной системы.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..database import User as UserDB
from ..dependencies import get_current_user
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter(prefix="/referrals", tags=["referrals"])


class ReferralStats(BaseModel):
    """Статистика по рефералам пользователя."""
    referral_code: str
    referrals_count: int
    total_credits_earned: int
    referral_link: str


class ReferralInfo(BaseModel):
    """Информация о реферале."""
    email: Optional[str]
    created_at: str
    credits_earned: int


@router.get("/my-stats", response_model=ReferralStats)
async def get_my_referral_stats(
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ReferralStats:
    """
    Получить статистику по своим рефералам.
    """
    # Подсчитываем количество приглашённых
    referrals_count = db.query(UserDB).filter(UserDB.referred_by == user.id).count()
    
    # Обновляем счётчик, если он не совпадает
    if user.referrals_count != referrals_count:
        user.referrals_count = referrals_count
        db.commit()
    
    # Каждый реферал приносит 1 кредит
    total_credits_earned = referrals_count
    
    return ReferralStats(
        referral_code=user.referral_code or "",
        referrals_count=referrals_count,
        total_credits_earned=total_credits_earned,
        referral_link=f"https://app.zachet.tech/?ref={user.referral_code}"
    )


@router.get("/my-referrals", response_model=List[ReferralInfo])
async def get_my_referrals(
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[ReferralInfo]:
    """
    Получить список приглашённых пользователей.
    """
    referrals = db.query(UserDB).filter(UserDB.referred_by == user.id).all()
    
    return [
        ReferralInfo(
            email=ref.email if ref.email else None,
            created_at=ref.id.hex[:8] if hasattr(ref.id, 'hex') else str(ref.id)[:8],  # Используем часть ID как дату
            credits_earned=1  # 1 кредит за каждого реферала
        )
        for ref in referrals
    ]


@router.post("/validate-code")
async def validate_referral_code(
    code: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Проверить валидность реферального кода.
    """
    user = db.query(UserDB).filter(UserDB.referral_code == code).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Реферальный код не найден")
    
    return {
        "valid": True,
        "referrer_email": user.email if user.email else "Пользователь Telegram"
    }
