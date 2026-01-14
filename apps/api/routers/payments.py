"""
Payments Router - API endpoints для платежей.

Endpoints:
- POST /payments/initiate - инициализация платежа
- POST /payments/webhook - webhook от Т-Банка
- GET /payments/status/{order_id} - статус платежа
"""

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from apps.api.database import get_db
from apps.api.dependencies import get_current_user
from apps.api.services.payment_service import PaymentService
from packages.database.src.models import Payment, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


# === Pydantic Models ===

class PaymentInitRequest(BaseModel):
    """Запрос на инициализацию платежа."""
    period: Literal["month", "quarter", "year"] = Field(..., description="Период подписки")
    email: str | None = Field(None, description="Email для чека (опционально)")


class PaymentInitResponse(BaseModel):
    """Ответ на инициализацию платежа."""
    payment_url: str = Field(..., description="URL платёжной формы")
    order_id: str = Field(..., description="ID заказа")


class PaymentStatusResponse(BaseModel):
    """Статус платежа."""
    order_id: str
    status: str
    amount: int
    description: str
    created_at: str


# === Endpoints ===

@router.post("/initiate", response_model=PaymentInitResponse)
async def initiate_payment(
    request: PaymentInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Инициализирует платёж для текущего пользователя.
    
    Создаёт платёж в Т-Банке и возвращает URL платёжной формы.
    """
    logger.info(f"[Payments] Initiate request: user={current_user.id}, period={request.period}")
    
    service = PaymentService(db)
    
    try:
        result = await service.initiate_payment(
            user_id=current_user.id,
            period=request.period,
            email=request.email,
        )
        
        logger.info(f"[Payments] Payment initiated: order_id={result['order_id']}")
        
        return PaymentInitResponse(
            payment_url=result["payment_url"],
            order_id=result["order_id"],
        )
        
    except Exception as e:
        logger.error(f"[Payments] Initiate failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Webhook для уведомлений от Т-Банка.
    
    Т-Банк отправляет POST с данными о статусе платежа.
    Возвращаем "OK" если обработали успешно.
    """
    try:
        data = await request.json()
        logger.info(f"[Payments] Webhook received: OrderId={data.get('OrderId')}, Status={data.get('Status')}")
        
        service = PaymentService(db)
        success = await service.process_notification(data)
        
        if success:
            logger.info("[Payments] Webhook processed successfully")
            return Response(content="OK", media_type="text/plain")
        else:
            logger.warning("[Payments] Webhook processing failed")
            return Response(content="FAIL", media_type="text/plain", status_code=400)
            
    except Exception as e:
        logger.error(f"[Payments] Webhook error: {e}")
        return Response(content="ERROR", media_type="text/plain", status_code=500)


@router.get("/status/{order_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Получает статус платежа по order_id.
    
    Пользователь может видеть только свои платежи.
    """
    payment = db.query(Payment).filter(
        Payment.order_id == order_id,
        Payment.user_id == current_user.id,
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return PaymentStatusResponse(
        order_id=payment.order_id,
        status=payment.status,
        amount=payment.amount,
        description=payment.description,
        created_at=payment.created_at.isoformat(),
    )


@router.post("/recurring/process")
async def process_recurring_payments(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Обрабатывает рекуррентные платежи.
    
    Вызывается cron-задачей или вручную админом.
    
    TODO: Добавить защиту (API key или admin auth).
    """
    # Простая защита через header
    api_key = request.headers.get("X-API-Key")
    expected_key = "zachet-recurring-secret"  # TODO: вынести в env
    
    if api_key != expected_key:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    logger.info("[Payments] Processing recurring payments...")
    
    service = PaymentService(db)
    stats = await service.process_recurring_payments()
    
    logger.info(f"[Payments] Recurring processed: {stats}")
    
    return stats

