"""
Payment Service - бизнес-логика платежей.

Координирует:
- Создание платежей в БД
- Взаимодействие с T-Bank API
- Активацию подписок
- Рекуррентные списания
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Literal, Optional
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from packages.billing.tbank_provider import get_tbank_provider, TBankPaymentProvider, TBankConfig
from packages.billing.fake_provider import FakePaymentProvider
from packages.database.src.models import Payment, Subscription, User, CreditTransaction

logger = logging.getLogger(__name__)

# Режим провайдера: "tbank" или "fake"
PAYMENT_MODE = os.getenv("PAYMENT_MODE", "fake")  # По умолчанию fake для разработки

# Конфигурация планов
PLANS = {
    "month": {
        "name": "MONTH",
        "description": 'Подписка на интернет-сервис "Зачёт" на 1 месяц',
        "amount": 49900,  # 499 руб в копейках
        "period_months": 1,
        "generations_limit": 5,
        "tokens_limit": 100000,
    },
    "quarter": {
        "name": "QUARTER", 
        "description": 'Подписка на интернет-сервис "Зачёт" на 3 месяца',
        "amount": 134700,  # 1347 руб (449 * 3)
        "period_months": 3,
        "generations_limit": 15,
        "tokens_limit": 300000,
    },
    "year": {
        "name": "YEAR",
        "description": 'Подписка на интернет-сервис "Зачёт" на 12 месяцев',
        "amount": 508800,  # 5088 руб (424 * 12)
        "period_months": 12,
        "generations_limit": 60,
        "tokens_limit": 1200000,
    },
}


class PaymentService:
    """
    Сервис для управления платежами.
    
    Обрабатывает:
    - Инициализацию платежей
    - Webhooks от Т-Банка
    - Активацию подписок
    - Рекуррентные списания
    """
    
    def __init__(self, db: Session, provider: Optional[TBankPaymentProvider] = None):
        """
        Args:
            db: Сессия БД
            provider: Провайдер платежей (по умолчанию TBank)
        """
        self.db = db
        self.provider = provider or get_tbank_provider()
    
    async def initiate_payment(
        self,
        user_id: UUID,
        period: Literal["month", "quarter", "year"],
        email: Optional[str] = None,
    ) -> dict:
        """
        Инициирует платёж для пользователя.
        
        Args:
            user_id: ID пользователя
            period: Период подписки
            email: Email для чека
        
        Returns:
            dict с payment_url и order_id
        """
        plan = PLANS.get(period)
        if not plan:
            raise ValueError(f"Unknown period: {period}")
        
        # Генерируем уникальный order_id
        order_id = f"ZCH-{uuid4().hex[:12].upper()}"
        
        logger.info(f"[PaymentService] Initiating payment: user={user_id}, period={period}, order={order_id}")
        
        # Получаем email пользователя если не передан
        if not email:
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.email and "@" in user.email:
                email = user.email
                logger.info(f"[PaymentService] Using user email: {email[:3]}***")
        
        # Создаём запись платежа в БД
        payment = Payment(
            id=uuid4(),
            user_id=user_id,
            amount=plan["amount"],
            status="NEW",
            order_id=order_id,
            description=plan["description"],
            period=period,
            is_recurrent=1,  # Первый рекуррентный платёж
            customer_key=str(user_id),  # CustomerKey для привязки карты
            customer_email=email,
        )
        self.db.add(payment)
        self.db.commit()
        
        logger.info(f"[PaymentService] Payment created in DB: id={payment.id}")
        
        # Проверяем режим провайдера
        if PAYMENT_MODE == "fake":
            # Fake режим для разработки
            logger.info(f"[PaymentService] Using FAKE payment mode")
            fake_payment_id = f"FAKE-{uuid4().hex[:8]}"
            payment.payment_id = fake_payment_id
            payment.status = "NEW"
            self.db.commit()
            
            # Возвращаем URL на страницу успешной оплаты
            success_url = os.getenv("TBANK_SUCCESS_URL", "https://app.zachet.tech/")
            fake_payment_url = f"{success_url}?payment_id={fake_payment_id}&order_id={order_id}&status=success&mode=demo"
            
            return {
                "payment_url": fake_payment_url,
                "order_id": order_id,
                "payment_id": fake_payment_id,
                "mode": "demo",
            }
        
        try:
            # Инициируем платёж в Т-Банке
            result = await self.provider.init_payment(
                order_id=order_id,
                amount=plan["amount"],
                description=plan["description"],
                customer_key=str(user_id),
                recurrent=True,
                email=email,
            )
            
            # Обновляем payment_id из ответа
            payment.payment_id = result.PaymentId
            payment.status = result.Status or "NEW"
            self.db.commit()
            
            logger.info(f"[PaymentService] TBank Init success: payment_id={result.PaymentId}")
            
            return {
                "payment_url": result.PaymentURL,
                "order_id": order_id,
                "payment_id": result.PaymentId,
            }
            
        except Exception as e:
            logger.error(f"[PaymentService] TBank Init failed: {e}")
            payment.status = "INIT_FAILED"
            self.db.commit()
            raise
    
    async def process_notification(self, data: dict) -> bool:
        """
        Обрабатывает webhook уведомление от Т-Банка.
        
        Args:
            data: Данные уведомления
        
        Returns:
            True если обработано успешно
        """
        # Верифицируем подпись
        if not self.provider.verify_notification(data):
            logger.warning("[PaymentService] Invalid notification signature")
            return False
        
        order_id = data.get("OrderId")
        status = data.get("Status")
        payment_id = data.get("PaymentId")
        rebill_id = data.get("RebillId")
        
        logger.info(f"[PaymentService] Processing notification: order={order_id}, status={status}")
        
        # Находим платёж
        payment = self.db.query(Payment).filter(Payment.order_id == order_id).first()
        if not payment:
            logger.error(f"[PaymentService] Payment not found: order_id={order_id}")
            return False
        
        # Обновляем статус
        payment.status = status
        payment.payment_id = payment_id
        payment.updated_at = datetime.utcnow()
        
        # Сохраняем RebillId для рекуррентных списаний
        if rebill_id:
            payment.rebill_id = rebill_id
            logger.info(f"[PaymentService] Saved RebillId: {rebill_id[:8]}...")
        
        # Если платёж подтверждён - активируем подписку или начисляем кредиты
        if status == "CONFIRMED":
            payment.confirmed_at = datetime.utcnow()
            if payment.payment_type == "SUBSCRIPTION":
                await self._activate_subscription(payment)
            elif payment.payment_type == "CREDITS":
                await self._add_credits(payment)
        
        self.db.commit()
        logger.info(f"[PaymentService] Notification processed: status={status}")
        
        return True
    
    async def _activate_subscription(self, payment: Payment) -> None:
        """
        Активирует подписку после успешного платежа.
        
        Args:
            payment: Подтверждённый платёж
        """
        plan = PLANS.get(payment.period)
        if not plan:
            logger.error(f"[PaymentService] Unknown plan for payment: {payment.period}")
            return
        
        user_id = payment.user_id
        now = datetime.utcnow()
        expires_at = now + timedelta(days=30 * plan["period_months"])
        
        logger.info(f"[PaymentService] Activating subscription: user={user_id}, plan={plan['name']}")
        
        # Ищем существующую подписку или создаём новую
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        if subscription:
            # Продлеваем существующую подписку
            if subscription.expires_at and subscription.expires_at > now:
                # Добавляем к существующему сроку
                expires_at = subscription.expires_at + timedelta(days=30 * plan["period_months"])
            
            subscription.plan_name = plan["name"]
            subscription.status = "ACTIVE"
            subscription.period = payment.period
            subscription.period_months = plan["period_months"]
            subscription.expires_at = expires_at
            subscription.initial_payment_id = payment.id
            subscription.generations_limit = plan["generations_limit"]
            subscription.tokens_limit = plan["tokens_limit"]
            subscription.updated_at = now
            
            logger.info(f"[PaymentService] Updated subscription: expires_at={expires_at}")
        else:
            # Создаём новую подписку
            subscription = Subscription(
                id=uuid4(),
                user_id=user_id,
                plan_name=plan["name"],
                status="ACTIVE",
                period=payment.period,
                period_months=plan["period_months"],
                started_at=now,
                expires_at=expires_at,
                auto_renew=1,
                initial_payment_id=payment.id,
                generations_limit=plan["generations_limit"],
                tokens_limit=plan["tokens_limit"],
            )
            self.db.add(subscription)
            logger.info(f"[PaymentService] Created subscription: id={subscription.id}")
        
        # Обновляем лимиты пользователя
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.plan_name = plan["name"]
            user.subscription_status = "active"
            user.generations_limit = plan["generations_limit"]
            user.tokens_limit = plan["tokens_limit"]
            user.next_billing_date = expires_at
            logger.info(f"[PaymentService] Updated user limits: generations={plan['generations_limit']}")
        
        self.db.commit()
    
    async def _add_credits(self, payment: Payment) -> None:
        """
        Начисляет кредиты пользователю после оплаты.
        
        Args:
            payment: Объект платежа
        """
        user_id = payment.user_id
        metadata = payment.metadata or {}
        credits_to_add = metadata.get("credits", 0)
        package_id = metadata.get("package_id", "unknown")
        
        if credits_to_add <= 0:
            logger.error(f"[PaymentService] Invalid credits amount: {credits_to_add}")
            return
        
        # Начисляем кредиты
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"[PaymentService] User {user_id} not found")
            return
        
        old_balance = user.credits_balance or 0
        new_balance = old_balance + credits_to_add
        user.credits_balance = new_balance
        
        # Создаём транзакцию
        transaction = CreditTransaction(
            user_id=user_id,
            amount=credits_to_add,
            balance_after=new_balance,
            transaction_type="CREDIT",
            reason=f"Покупка пакета: {package_id}",
            payment_id=payment.id,
        )
        self.db.add(transaction)
        self.db.commit()
        
        logger.info(
            f"[PaymentService] Added {credits_to_add} credits to user {user_id}. "
            f"Balance: {old_balance} → {new_balance}"
        )
    
    async def process_recurring_payments(self) -> dict:
        """
        Обрабатывает рекуррентные платежи для подписок, срок которых истекает.
        
        Вызывается cron-задачей.
        
        Returns:
            Статистика обработки
        """
        now = datetime.utcnow()
        # Ищем подписки, срок которых истекает в течение 3 дней
        expiring_soon = now + timedelta(days=3)
        
        subscriptions = self.db.query(Subscription).filter(
            Subscription.status == "ACTIVE",
            Subscription.auto_renew == 1,
            Subscription.expires_at <= expiring_soon,
            Subscription.expires_at > now,
        ).all()
        
        logger.info(f"[PaymentService] Found {len(subscriptions)} subscriptions for recurring charge")
        
        stats = {"total": len(subscriptions), "success": 0, "failed": 0}
        
        for subscription in subscriptions:
            try:
                await self._charge_subscription(subscription)
                stats["success"] += 1
            except Exception as e:
                logger.error(f"[PaymentService] Recurring charge failed: {e}")
                stats["failed"] += 1
        
        return stats
    
    async def _charge_subscription(self, subscription: Subscription) -> None:
        """
        Выполняет рекуррентное списание для подписки.
        
        Args:
            subscription: Подписка для списания
        """
        # Находим первый платёж с RebillId
        initial_payment = self.db.query(Payment).filter(
            Payment.id == subscription.initial_payment_id
        ).first()
        
        if not initial_payment or not initial_payment.rebill_id:
            logger.warning(f"[PaymentService] No RebillId for subscription: {subscription.id}")
            return
        
        plan = PLANS.get(subscription.period)
        if not plan:
            return
        
        # Создаём новый платёж для рекуррентного списания
        order_id = f"ZCH-REC-{uuid4().hex[:8].upper()}"
        
        new_payment = Payment(
            id=uuid4(),
            user_id=subscription.user_id,
            amount=plan["amount"],
            status="NEW",
            order_id=order_id,
            description=f"{plan['description']} (автопродление)",
            period=subscription.period,
            is_recurrent=2,  # Автосписание
            recurrent_parent_id=initial_payment.id,
            customer_key=str(subscription.user_id),
            customer_email=initial_payment.customer_email,
        )
        self.db.add(new_payment)
        self.db.commit()
        
        logger.info(f"[PaymentService] Initiating recurring charge: order={order_id}")
        
        try:
            # Инициируем платёж и сразу списываем
            init_result = await self.provider.init_payment(
                order_id=order_id,
                amount=plan["amount"],
                description=f"{plan['description']} (автопродление)",
                customer_key=str(subscription.user_id),
                recurrent=False,  # Для Charge не нужен флаг Recurrent
                email=initial_payment.customer_email,
            )
            
            new_payment.payment_id = init_result.PaymentId
            self.db.commit()
            
            # Выполняем списание
            charge_result = await self.provider.charge(
                payment_id=init_result.PaymentId,
                rebill_id=initial_payment.rebill_id,
                email=initial_payment.customer_email,
            )
            
            if charge_result.Success:
                logger.info(f"[PaymentService] Recurring charge success: {order_id}")
            else:
                logger.warning(f"[PaymentService] Recurring charge failed: {charge_result.ErrorCode}")
                new_payment.status = "REJECTED"
                self.db.commit()
                
        except Exception as e:
            logger.error(f"[PaymentService] Recurring charge error: {e}")
            new_payment.status = "CHARGE_FAILED"
            self.db.commit()
            raise

