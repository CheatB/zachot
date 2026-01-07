"""
Роутер для работы с данными текущего пользователя.
"""

from uuid import UUID, uuid4
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from ..schemas import MeResponse

router = APIRouter(prefix="/me", tags=["user"])

# Временный ID для режима интеграции
MOCK_USER_ID = UUID("00000000-0000-0000-0000-000000000001")

@router.get("", response_model=MeResponse)
async def get_me():
    """
    Возвращает информацию о текущем пользователе, его подписке и лимитах.
    """
    # В будущем здесь будет реальная логика получения пользователя из JWT/session
    return MeResponse(
        id=MOCK_USER_ID,
        subscription={
            "planName": "Студент Плюс",
            "status": "active",
            "monthlyPriceRub": 499,
            "nextBillingDate": datetime.now() + timedelta(days=15)
        },
        usage={
            "generationsUsed": 2,
            "generationsLimit": 5,
            "tokensUsed": 34200,
            "tokensLimit": 100000
        }
    )




