"""
Subscription Lifecycle (Billing Domain) для управления жизненным циклом подписки.

Предоставляет чистую доменную state machine для управления переходами статусов подписки.
Независим от I/O, БД и внешних API.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .plans import UserSubscription


class SubscriptionEvent(BaseModel):
    """
    Событие жизненного цикла подписки.
    
    Описывает событие, которое может изменить статус подписки.
    Используется для управления переходами между состояниями подписки.
    
    Attributes:
        type: Тип события
        occurred_at: Время наступления события
    
    Examples:
        >>> from datetime import datetime
        >>> 
        >>> # Событие об успешной оплате
        >>> event = SubscriptionEvent(
        ...     type="payment_succeeded",
        ...     occurred_at=datetime.now()
        ... )
        >>> 
        >>> # Событие об истечении подписки
        >>> expire_event = SubscriptionEvent(
        ...     type="expire",
        ...     occurred_at=datetime.now()
        ... )
    """
    
    type: Literal[
        "payment_succeeded",
        "payment_failed",
        "renew",
        "expire",
        "cancel"
    ] = Field(..., description="Тип события")
    occurred_at: datetime = Field(..., description="Время наступления события")
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Валидация: type должен быть одним из допустимых значений."""
        if v not in ("payment_succeeded", "payment_failed", "renew", "expire", "cancel"):
            raise ValueError(
                f"type must be one of: payment_succeeded, payment_failed, renew, expire, cancel, got {v}"
            )
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"SubscriptionEvent(type={self.type!r}, occurred_at={self.occurred_at})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"SubscriptionEvent[{self.type.upper()}] ({self.occurred_at})"


class SubscriptionTransitionResult(BaseModel):
    """
    Результат перехода статуса подписки.
    
    Описывает результат применения события к подписке:
    - Разрешён ли переход
    - Какой новый статус должен быть установлен
    - Причина результата
    
    Attributes:
        allowed: Разрешён ли переход
        new_status: Новый статус подписки (или "unchanged" если статус не меняется)
        reason: Причина результата
    
    Examples:
        >>> result = SubscriptionTransitionResult(
        ...     allowed=True,
        ...     new_status="active",
        ...     reason="Payment succeeded, subscription renewed"
        ... )
        >>> 
        >>> if result.allowed and result.new_status != "unchanged":
        ...     # Обновить подписку в storage
        ...     # new_subscription = subscription.model_copy(update={"status": result.new_status})
        ...     pass
    """
    
    allowed: bool = Field(..., description="Разрешён ли переход")
    new_status: Literal["active", "past_due", "canceled", "expired", "unchanged"] = Field(
        ..., description="Новый статус подписки"
    )
    reason: str = Field(..., description="Причина результата")
    
    @field_validator('new_status')
    @classmethod
    def validate_new_status(cls, v: str) -> str:
        """Валидация: new_status должен быть одним из допустимых значений."""
        if v not in ("active", "past_due", "canceled", "expired", "unchanged"):
            raise ValueError(
                f"new_status must be one of: active, past_due, canceled, expired, unchanged, got {v}"
            )
        return v
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v: str) -> str:
        """Валидация: reason должен быть непустой строкой."""
        if not v or not v.strip():
            raise ValueError("reason cannot be empty")
        return v.strip()
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"SubscriptionTransitionResult(allowed={self.allowed}, "
            f"new_status={self.new_status!r}, reason={self.reason!r})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "ALLOWED" if self.allowed else "DENIED"
        return (
            f"SubscriptionTransitionResult[{status}] "
            f"({self.new_status}, reason: {self.reason})"
        )


class SubscriptionLifecycleService:
    """
    Сервис управления жизненным циклом подписки.
    
    Реализует чистую доменную state machine для управления переходами статусов подписки.
    Обеспечивает детерминированность и идемпотентность: повторные события обрабатываются корректно.
    
    Логика переходов:
    1. canceled → всегда unchanged (отменённая подписка не может изменить статус)
    2. expired (подписка истекла, но статус ещё не "expired"):
       - payment_succeeded → unchanged (нельзя восстановить истекшую подписку через payment_succeeded)
    3. payment_succeeded:
       - active → active (renew - продление активной подписки)
       - past_due → active (восстановление из просрочки)
    4. payment_failed:
       - active → past_due (переход в просрочку)
    5. expire:
       - active → expired (истечение активной подписки)
    6. cancel:
       - любой статус → canceled (отмена подписки)
    
    UserSubscription не мутируется (immutable), возвращается только результат перехода.
    Вся логика чистая, без I/O, без БД, детерминированная.
    
    Examples:
        >>> from packages.billing import UserSubscription, SubscriptionLifecycleService, SubscriptionEvent
        >>> from datetime import datetime, timedelta
        >>> from uuid import uuid4
        >>> 
        >>> # Продление активной подписки
        >>> subscription = UserSubscription(
        ...     user_id=uuid4(),
        ...     plan_name="BASE_499",
        ...     status="active",
        ...     started_at=datetime.now(),
        ...     expires_at=datetime.now() + timedelta(days=30),
        ...     auto_renew=True
        ... )
        >>> 
        >>> service = SubscriptionLifecycleService()
        >>> event = SubscriptionEvent(
        ...     type="payment_succeeded",
        ...     occurred_at=datetime.now()
        ... )
        >>> 
        >>> result = service.apply(subscription, event, datetime.now())
        >>> if result.allowed and result.new_status == "active":
        ...     # Обновить подписку в storage
        ...     # new_subscription = subscription.model_copy(update={"status": "active"})
        ...     pass
    """
    
    def apply(
        self,
        subscription: UserSubscription,
        event: SubscriptionEvent,
        now: datetime
    ) -> SubscriptionTransitionResult:
        """
        Применяет событие к подписке и определяет переход статуса.
        
        Обрабатывает событие жизненного цикла подписки и определяет,
        должен ли статус подписки быть изменён. Обеспечивает идемпотентность.
        
        Args:
            subscription: Подписка пользователя
            event: Событие жизненного цикла
            now: Текущее время для проверки истечения подписки
        
        Returns:
            SubscriptionTransitionResult с результатом перехода
        
        Examples:
            >>> # Продление активной подписки
            >>> service = SubscriptionLifecycleService()
            >>> subscription = UserSubscription(..., status="active")
            >>> event = SubscriptionEvent(type="payment_succeeded", ...)
            >>> 
            >>> result = service.apply(subscription, event, datetime.now())
            >>> assert result.new_status == "active"
            >>> 
            >>> # Восстановление из просрочки
            >>> subscription_past_due = UserSubscription(..., status="past_due")
            >>> result = service.apply(subscription_past_due, event, datetime.now())
            >>> assert result.new_status == "active"
            >>> 
            >>> # Отмена дважды (идемпотентность)
            >>> subscription_canceled = UserSubscription(..., status="canceled")
            >>> cancel_event = SubscriptionEvent(type="cancel", ...)
            >>> result = service.apply(subscription_canceled, cancel_event, datetime.now())
            >>> assert result.new_status == "unchanged"
            >>> 
            >>> # Событие после истечения
            >>> expired_subscription = UserSubscription(
            ...     ...,
            ...     status="active",
            ...     expires_at=datetime.now() - timedelta(days=1)  # Истекла
            ... )
            >>> result = service.apply(expired_subscription, event, datetime.now())
            >>> # Если подписка истекла, payment_succeeded не восстановит её
        """
        # Проверка 1: Отменённая подписка не может изменить статус
        if subscription.status == "canceled":
            return SubscriptionTransitionResult(
                allowed=True,
                new_status="unchanged",
                reason="Canceled subscription cannot change status"
            )
        
        # Проверка 2: Истекшая подписка (expires_at < now, но статус ещё не "expired")
        is_expired = subscription.expires_at < now
        
        # Обработка событий в зависимости от типа
        if event.type == "payment_succeeded":
            # Правило: payment_succeeded
            # - active → active (renew)
            # - past_due → active
            # - expired → unchanged (нельзя восстановить истекшую подписку через payment_succeeded)
            
            if is_expired:
                return SubscriptionTransitionResult(
                    allowed=True,
                    new_status="unchanged",
                    reason="Expired subscription cannot be renewed via payment_succeeded"
                )
            
            if subscription.status == "active":
                return SubscriptionTransitionResult(
                    allowed=True,
                    new_status="active",
                    reason="Payment succeeded, subscription renewed"
                )
            
            if subscription.status == "past_due":
                return SubscriptionTransitionResult(
                    allowed=True,
                    new_status="active",
                    reason="Payment succeeded, subscription recovered from past_due"
                )
            
            # Если статус не active и не past_due, но и не expired, оставляем без изменений
            return SubscriptionTransitionResult(
                allowed=True,
                new_status="unchanged",
                reason=f"Payment succeeded, but subscription status {subscription.status} does not allow transition"
            )
        
        elif event.type == "payment_failed":
            # Правило: payment_failed
            # - active → past_due
            
            if subscription.status == "active":
                return SubscriptionTransitionResult(
                    allowed=True,
                    new_status="past_due",
                    reason="Payment failed, subscription moved to past_due"
                )
            
            # Для других статусов переход не требуется
            return SubscriptionTransitionResult(
                allowed=True,
                new_status="unchanged",
                reason=f"Payment failed, but subscription status {subscription.status} does not allow transition"
            )
        
        elif event.type == "expire":
            # Правило: expire
            # - active → expired
            
            if subscription.status == "active":
                return SubscriptionTransitionResult(
                    allowed=True,
                    new_status="expired",
                    reason="Subscription expired"
                )
            
            # Для других статусов переход не требуется
            return SubscriptionTransitionResult(
                allowed=True,
                new_status="unchanged",
                reason=f"Expire event, but subscription status {subscription.status} does not allow transition"
            )
        
        elif event.type == "cancel":
            # Правило: cancel
            # - любой статус → canceled
            
            if subscription.status == "canceled":
                # Идемпотентность: повторная отмена не меняет статус
                return SubscriptionTransitionResult(
                    allowed=True,
                    new_status="unchanged",
                    reason="Subscription already canceled"
                )
            
            return SubscriptionTransitionResult(
                allowed=True,
                new_status="canceled",
                reason="Subscription canceled"
            )
        
        elif event.type == "renew":
            # Правило: renew
            # - active → active (продление активной подписки)
            # - past_due → active (восстановление)
            
            if subscription.status == "active":
                return SubscriptionTransitionResult(
                    allowed=True,
                    new_status="active",
                    reason="Subscription renewed"
                )
            
            if subscription.status == "past_due":
                return SubscriptionTransitionResult(
                    allowed=True,
                    new_status="active",
                    reason="Subscription renewed, recovered from past_due"
                )
            
            # Для других статусов переход не требуется
            return SubscriptionTransitionResult(
                allowed=True,
                new_status="unchanged",
                reason=f"Renew event, but subscription status {subscription.status} does not allow transition"
            )
        
        # Fallback: неизвестный тип события
        return SubscriptionTransitionResult(
            allowed=False,
            new_status="unchanged",
            reason=f"Unknown event type: {event.type}"
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "SubscriptionLifecycleService()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "SubscriptionLifecycleService"


