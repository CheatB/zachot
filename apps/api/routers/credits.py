"""
Роутер для работы с кредитами.
"""
import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List

from ..database import SessionLocal, User as UserDB
from ..dependencies import get_current_user
from ..services.payment_service import PaymentService
from packages.billing.credits import get_all_credit_packages, get_credit_package
from ..middleware.rate_limiter import limiter, RateLimits

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/credits", tags=["credits"])


class CreditPackageResponse(BaseModel):
    """Информация о пакете кредитов"""
    id: str
    credits: int
    price_rub: int
    name: str
    description: str
    is_perpetual: bool = True


class PurchaseCreditsRequest(BaseModel):
    """Запрос на покупку пакета кредитов"""
    package_id: str  # package_5, package_10, package_20


class PurchaseCreditsResponse(BaseModel):
    """Ответ на покупку кредитов"""
    payment_id: UUID
    payment_url: str
    order_id: str


@router.get("/packages", response_model=List[CreditPackageResponse])
async def get_credit_packages_endpoint() -> List[CreditPackageResponse]:
    """
    Возвращает список доступных пакетов кредитов.
    Публичный endpoint - не требует авторизации.
    """
    packages = get_all_credit_packages()
    return [CreditPackageResponse(**pkg) for pkg in packages]


@router.post("/purchase", response_model=PurchaseCreditsResponse)
@limiter.limit(RateLimits.PAYMENT_INIT)
async def purchase_credits(
    request: Request,
    purchase_request: PurchaseCreditsRequest,
    user: UserDB = Depends(get_current_user)
) -> PurchaseCreditsResponse:
    """
    Инициирует покупку пакета кредитов.
    Создаёт платёж и возвращает URL для оплаты.
    """
    package = get_credit_package(purchase_request.package_id)
    
    if not package:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid package_id: {purchase_request.package_id}"
        )
    
    with SessionLocal() as session:
        payment_service = PaymentService(session)
        
        # Создаём платёж типа CREDITS
        payment = await payment_service.create_payment(
            user_id=user.id,
            amount_rub=package["price_rub"],
            payment_type="CREDITS",
            period=None,  # Для разовой покупки кредитов period не нужен
            metadata={
                "package_id": purchase_request.package_id,
                "credits": package["credits"],
                "package_name": package["name"]
            }
        )
        
        logger.info(
            f"[Credits] Created payment {payment.id} for user {user.id}: "
            f"package={purchase_request.package_id}, credits={package['credits']}"
        )
        
        return PurchaseCreditsResponse(
            payment_id=payment.id,
            payment_url=payment.payment_url,
            order_id=payment.order_id
        )
