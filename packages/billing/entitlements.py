"""
Entitlements (Billing Domain) для определения прав пользователя.

Предоставляет доменную логику для определения, что пользователь может делать прямо сейчас
на основе его подписки и решения Fair Use Policy.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from packages.fair_use.policy import FairUseDecision

from .plans import SubscriptionResolver, UserSubscription


class EntitlementSet(BaseModel):
    """
    Набор прав пользователя на выполнение операций.
    
    Определяет, что пользователь может делать прямо сейчас:
    - Может ли генерировать контент
    - Максимальное количество токенов на запрос
    - Разрешён ли streaming
    - Приоритет обработки запросов
    - Причина текущих прав
    
    Attributes:
        can_generate: Может ли пользователь генерировать контент
        max_tokens_per_request: Максимальное количество токенов на один запрос
        streaming_allowed: Разрешён ли streaming
        priority: Приоритет обработки запросов ("low", "normal", "high")
        reason: Причина текущих прав
    
    Examples:
        >>> # Полные права (активная подписка, нормальный режим)
        >>> entitlements = EntitlementSet(
        ...     can_generate=True,
        ...     max_tokens_per_request=100000,
        ...     streaming_allowed=True,
        ...     priority="normal",
        ...     reason="Active subscription, normal mode"
        ... )
        >>> 
        >>> # Ограниченные права (деградированный режим)
        >>> entitlements_degraded = EntitlementSet(
        ...     can_generate=True,
        ...     max_tokens_per_request=500,
        ...     streaming_allowed=False,
        ...     priority="low",
        ...     reason="Degraded mode due to fair use limits"
        ... )
        >>> 
        >>> # Нет прав (нет подписки или блокировка)
        >>> entitlements_blocked = EntitlementSet(
        ...     can_generate=False,
        ...     max_tokens_per_request=0,
        ...     streaming_allowed=False,
        ...     priority="low",
        ...     reason="No active subscription"
        ... )
    """
    
    can_generate: bool = Field(..., description="Может ли пользователь генерировать контент")
    max_tokens_per_request: int = Field(..., ge=0, description="Максимальное количество токенов на один запрос")
    streaming_allowed: bool = Field(..., description="Разрешён ли streaming")
    priority: Literal["low", "normal", "high"] = Field(..., description="Приоритет обработки запросов")
    reason: str = Field(..., description="Причина текущих прав")
    
    @field_validator('max_tokens_per_request')
    @classmethod
    def validate_max_tokens(cls, v: int) -> int:
        """Валидация: max_tokens_per_request должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"max_tokens_per_request must be >= 0, got {v}")
        return v
    
    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: str) -> str:
        """Валидация: priority должен быть одним из допустимых значений."""
        if v not in ("low", "normal", "high"):
            raise ValueError(f"priority must be one of: low, normal, high, got {v}")
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
            f"EntitlementSet(can_generate={self.can_generate}, "
            f"max_tokens={self.max_tokens_per_request}, "
            f"streaming={self.streaming_allowed}, priority={self.priority!r})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "ENABLED" if self.can_generate else "DISABLED"
        return (
            f"EntitlementSet[{status}] "
            f"(max_tokens={self.max_tokens_per_request}, "
            f"streaming={self.streaming_allowed}, priority={self.priority})"
        )


class EntitlementResolver:
    """
    Резолвер прав пользователя на основе подписки и Fair Use решения.
    
    Определяет, что пользователь может делать прямо сейчас, комбинируя:
    - Статус подписки пользователя (активна ли, не истекла ли)
    - Решение Fair Use Policy (нормальный/деградированный/строгий режим)
    
    Логика:
    1. Если subscription == None или невалидна → can_generate=False
    2. Если fair_use.mode == "strict" → can_generate=False
    3. Если fair_use.mode == "degraded":
       - can_generate=True
       - max_tokens_per_request = fair_use.applied_limits["max_tokens"]
       - streaming_allowed=False
       - priority="low"
    4. Если fair_use.mode == "normal":
       - can_generate=True
       - max_tokens_per_request = subscription.plan budget max_tokens
       - streaming_allowed=True
       - priority="normal"
    
    Чистая логика, без I/O, без БД, детерминированная.
    
    Examples:
        >>> from packages.billing import UserSubscription, EntitlementResolver
        >>> from packages.fair_use import FairUseDecision
        >>> from datetime import datetime, timedelta
        >>> from uuid import uuid4
        >>> 
        >>> # Активная подписка, нормальный режим
        >>> subscription = UserSubscription(
        ...     user_id=uuid4(),
        ...     plan_name="BASE_499",
        ...     status="active",
        ...     started_at=datetime.now(),
        ...     expires_at=datetime.now() + timedelta(days=30),
        ...     auto_renew=True
        ... )
        >>> 
        >>> fair_use_normal = FairUseDecision(
        ...     mode="normal",
        ...     allowed=True,
        ...     reason="normal_operation",
        ...     applied_limits={}
        ... )
        >>> 
        >>> resolver = EntitlementResolver()
        >>> entitlements = resolver.resolve(subscription, fair_use_normal, datetime.now())
        >>> 
        >>> assert entitlements.can_generate == True
        >>> assert entitlements.streaming_allowed == True
        >>> assert entitlements.priority == "normal"
    """
    
    def __init__(self):
        """Инициализирует резолвер с SubscriptionResolver для получения бюджетов."""
        self._subscription_resolver = SubscriptionResolver()
    
    def resolve(
        self,
        subscription: Optional[UserSubscription],
        fair_use_decision: FairUseDecision,
        now: datetime
    ) -> EntitlementSet:
        """
        Разрешает права пользователя на основе подписки и Fair Use решения.
        
        Комбинирует статус подписки и решение Fair Use Policy для определения
        текущих прав пользователя.
        
        Args:
            subscription: Подписка пользователя (может быть None)
            fair_use_decision: Решение Fair Use Policy
            now: Текущее время для проверки валидности подписки
        
        Returns:
            EntitlementSet с правами пользователя
        
        Examples:
            >>> # Активная подписка
            >>> resolver = EntitlementResolver()
            >>> subscription = UserSubscription(...)
            >>> fair_use = FairUseDecision(mode="normal", ...)
            >>> 
            >>> entitlements = resolver.resolve(subscription, fair_use, datetime.now())
            >>> if entitlements.can_generate:
            ...     print(f"Max tokens: {entitlements.max_tokens_per_request}")
            >>> 
            >>> # Истекшая подписка
            >>> expired_subscription = UserSubscription(
            ...     ...,
            ...     expires_at=datetime.now() - timedelta(days=1)
            ... )
            >>> entitlements = resolver.resolve(expired_subscription, fair_use, datetime.now())
            >>> assert entitlements.can_generate == False
            >>> 
            >>> # Деградированный режим
            >>> fair_use_degraded = FairUseDecision(
            ...     mode="degraded",
            ...     allowed=True,
            ...     reason="degraded_mode_limits",
            ...     applied_limits={"max_tokens": 500, "streaming": False, "priority": "low"}
            ... )
            >>> entitlements = resolver.resolve(subscription, fair_use_degraded, datetime.now())
            >>> assert entitlements.max_tokens_per_request == 500
            >>> assert entitlements.streaming_allowed == False
            >>> assert entitlements.priority == "low"
            >>> 
            >>> # Строгий режим (блокировка)
            >>> fair_use_strict = FairUseDecision(
            ...     mode="strict",
            ...     allowed=False,
            ...     reason="fair_use_block",
            ...     applied_limits={}
            ... )
            >>> entitlements = resolver.resolve(subscription, fair_use_strict, datetime.now())
            >>> assert entitlements.can_generate == False
        """
        # Проверка 1: Нет подписки или подписка невалидна
        if subscription is None:
            return EntitlementSet(
                can_generate=False,
                max_tokens_per_request=0,
                streaming_allowed=False,
                priority="low",
                reason="No subscription"
            )
        
        # Валидация подписки
        is_valid = self._subscription_resolver.validate_subscription(subscription, now)
        if not is_valid:
            return EntitlementSet(
                can_generate=False,
                max_tokens_per_request=0,
                streaming_allowed=False,
                priority="low",
                reason=f"Invalid subscription (status={subscription.status}, expired={subscription.expires_at <= now})"
            )
        
        # Проверка 2: Строгий режим Fair Use (блокировка)
        if fair_use_decision.mode == "strict":
            return EntitlementSet(
                can_generate=False,
                max_tokens_per_request=0,
                streaming_allowed=False,
                priority="low",
                reason=f"Fair use block: {fair_use_decision.reason}"
            )
        
        # Проверка 3: Деградированный режим Fair Use
        if fair_use_decision.mode == "degraded":
            # Получаем ограничения из fair_use_decision
            max_tokens = fair_use_decision.applied_limits.get("max_tokens", 500)
            streaming = fair_use_decision.applied_limits.get("streaming", False)
            priority = fair_use_decision.applied_limits.get("priority", "low")
            
            # Валидация max_tokens
            if not isinstance(max_tokens, int) or max_tokens < 0:
                max_tokens = 500
            
            # Валидация priority
            if priority not in ("low", "normal", "high"):
                priority = "low"
            
            return EntitlementSet(
                can_generate=True,
                max_tokens_per_request=max_tokens,
                streaming_allowed=streaming,
                priority=priority,
                reason=f"Degraded mode: {fair_use_decision.reason}"
            )
        
        # Проверка 4: Нормальный режим Fair Use
        if fair_use_decision.mode == "normal":
            # Получаем бюджет из подписки
            budget = self._subscription_resolver.resolve_budget(subscription)
            
            return EntitlementSet(
                can_generate=True,
                max_tokens_per_request=budget.max_tokens,
                streaming_allowed=True,
                priority="normal",
                reason=f"Normal mode: active subscription ({subscription.plan_name})"
            )
        
        # Fallback: если режим не распознан, блокируем
        return EntitlementSet(
            can_generate=False,
            max_tokens_per_request=0,
            streaming_allowed=False,
            priority="low",
            reason=f"Unknown fair use mode: {fair_use_decision.mode}"
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "EntitlementResolver()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "EntitlementResolver"


