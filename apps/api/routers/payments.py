from fastapi import APIRouter, Depends, HTTPException, Request, Response
from ..database import SessionLocal, PaymentDB, User as UserDB
from ..schemas import PaymentInitRequest, PaymentInitResponse, TBankWebhook
from ..services.tbank_service import tbank_service
from .generations import get_current_user
from uuid import uuid4
from datetime import datetime, timedelta

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/initiate", response_model=PaymentInitResponse)
async def initiate_payment(
    request: PaymentInitRequest, 
    user: UserDB = Depends(get_current_user)
):
    """
    Инициализирует платеж для покупки подписки.
    """
    # Расчет суммы и описания в зависимости от периода
    base_price = 499
    if request.period == 'quarter':
        # 449 руб/мес * 3 = 1347 руб
        amount = round(base_price * 0.9) * 3  # 449 * 3 = 1347
        description = 'Подписка "Зачёт" — 3 месяца'
    elif request.period == 'year':
        amount = round(base_price * 0.85) * 12
        description = 'Подписка "Зачёт" — 12 месяцев'
    else:
        amount = base_price
        description = 'Подписка "Зачёт" — 1 месяц'

    order_id = f"ORDER_{uuid4().hex[:12]}"

    # 1. Сохраняем платеж в базе со статусом NEW
    with SessionLocal() as session:
        payment = PaymentDB(
            user_id=user.id,
            amount=amount * 100,
            order_id=order_id,
            description=description,
            status="NEW"
        )
        session.add(payment)
        session.commit()
        session.refresh(payment)

    # 2. Вызываем Т-Банк
    res = await tbank_service.init_payment(
        order_id=order_id,
        amount_rub=amount,
        description=description,
        customer_email=user.email or "customer@example.com"
    )

    if not res:
        raise HTTPException(status_code=500, detail="Failed to initiate payment with T-Bank")

    # 3. Обновляем payment_id из ответа Т-Банка
    with SessionLocal() as session:
        session.query(PaymentDB).filter(PaymentDB.order_id == order_id).update({
            "payment_id": str(res.get("PaymentId"))
        })
        session.commit()

    return PaymentInitResponse(
        payment_url=res.get("PaymentURL"),
        order_id=order_id
    )

@router.post("/webhook")
async def payment_webhook(request: Request):
    """
    Принимает уведомления об изменении статуса платежа от Т-Банка.
    """
    data = await request.json()
    
    # 1. Проверяем токен безопасности
    if not tbank_service.check_token(data):
        return Response(content="OK", status_code=200) # Т-Банк требует OK даже если токен не совпал, но мы не обрабатываем

    order_id = data.get("OrderId")
    status = data.get("Status")

    with SessionLocal() as session:
        payment = session.query(PaymentDB).filter(PaymentDB.order_id == order_id).first()
        if not payment:
            return Response(content="OK", status_code=200)

        payment.status = status
        
        # 2. Если платеж подтвержден (CONFIRMED), обновляем подписку пользователя
        if status == "CONFIRMED":
            user = session.query(UserDB).filter(UserDB.id == payment.user_id).first()
            if user:
                # Обновляем лимиты и дату
                if "12 месяцев" in payment.description:
                    user.generations_limit += 60 # 5 * 12
                    user.next_billing_date = datetime.utcnow() + timedelta(days=365)
                elif "3 месяца" in payment.description:
                    user.generations_limit += 15 # 5 * 3
                    user.next_billing_date = datetime.utcnow() + timedelta(days=90)
                else:
                    user.generations_limit += 5
                    user.next_billing_date = datetime.utcnow() + timedelta(days=30)
                
                user.subscription_status = "active"
        
        session.commit()

    return Response(content="OK", status_code=200)

@router.get("/debug/cancel")
async def debug_cancel_payment(payment_id: str):
    """
    Отладочный эндпоинт для отмены платежа (Тест №8).
    """
    res = await tbank_service.cancel_payment(payment_id)
    if not res:
        return {"status": "error", "message": "Failed to call T-Bank API"}
    return {"status": "success", "data": res}


