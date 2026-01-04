"""
Plans & Limits (Billing Domain) для управления тарифными планами и подписками.

Предоставляет модели и логику для описания тарифов и подписок пользователей.
Billing слой НЕ делает оплату, он описывает кто на каком тарифе и какие у него лимиты.
"""

from datetime import datetime, timedelta
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from packages.llm.base import LLMBudget
from packages.llm_economics.pricing import PRICING_PRESETS, PricingPreset


class SubscriptionPlan(BaseModel):
    """
    Тарифный план подписки.
    
    Описывает тарифный план с ценой и привязкой к PricingPreset.
    Не содержит логики оплаты, только описание тарифа.
    
    Attributes:
        name: Название тарифного плана
        monthly_price_rub: Месячная цена в рублях
        pricing_preset_name: Название PricingPreset (например, "FREE", "BASE_499", "PRO")
        description: Описание тарифного плана
        is_active: Активен ли тарифный план
    
    Examples:
        >>> plan = SubscriptionPlan(
        ...     name="BASE_499",
        ...     monthly_price_rub=499,
        ...     pricing_preset_name="BASE_499",
        ...     description="Базовый тариф за 499 руб/мес",
        ...     is_active=True
        ... )
    """
    
    name: str = Field(..., description="Название тарифного плана")
    monthly_price_rub: int = Field(..., ge=0, description="Месячная цена в рублях")
    pricing_preset_name: str = Field(..., description="Название PricingPreset")
    description: str = Field(..., description="Описание тарифного плана")
    is_active: bool = Field(..., description="Активен ли тарифный план")
    
    @field_validator('monthly_price_rub')
    @classmethod
    def validate_price(cls, v: int) -> int:
        """Валидация: monthly_price_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"monthly_price_rub must be >= 0, got {v}")
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"SubscriptionPlan(name={self.name!r}, price={self.monthly_price_rub} RUB, "
            f"preset={self.pricing_preset_name!r}, active={self.is_active})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"SubscriptionPlan[{self.name}] ({self.monthly_price_rub} RUB/month)"


class UserSubscription(BaseModel):
    """
    Подписка пользователя на тарифный план.
    
    Описывает подписку пользователя: какой тариф, статус, срок действия.
    Не содержит логики оплаты, только описание подписки.
    
    Attributes:
        user_id: Идентификатор пользователя
        plan_name: Название тарифного плана
        status: Статус подписки ("active", "past_due", "canceled")
        started_at: Время начала подписки
        expires_at: Время окончания подписки
        auto_renew: Автоматическое продление подписки
    
    Examples:
        >>> from datetime import datetime, timedelta
        >>> from uuid import uuid4
        >>> 
        >>> subscription = UserSubscription(
        ...     user_id=uuid4(),
        ...     plan_name="BASE_499",
        ...     status="active",
        ...     started_at=datetime.now(),
        ...     expires_at=datetime.now() + timedelta(days=30),
        ...     auto_renew=True
        ... )
    """
    
    user_id: UUID = Field(..., description="Идентификатор пользователя")
    plan_name: str = Field(..., description="Название тарифного плана")
    status: Literal["active", "past_due", "canceled"] = Field(..., description="Статус подписки")
    started_at: datetime = Field(..., description="Время начала подписки")
    expires_at: datetime = Field(..., description="Время окончания подписки")
    auto_renew: bool = Field(..., description="Автоматическое продление подписки")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Валидация: status должен быть одним из допустимых значений."""
        if v not in ("active", "past_due", "canceled"):
            raise ValueError(f"status must be one of: active, past_due, canceled, got {v}")
        return v
    
    @field_validator('expires_at')
    @classmethod
    def validate_expires_at(cls, v: datetime, info) -> datetime:
        """Валидация: expires_at должен быть после started_at."""
        if isinstance(v, datetime):
            started_at = info.data.get('started_at')
            if started_at and v < started_at:
                raise ValueError(f"expires_at ({v}) cannot be earlier than started_at ({started_at})")
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"UserSubscription(user_id={self.user_id!r}, plan={self.plan_name!r}, "
            f"status={self.status!r}, expires_at={self.expires_at})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"UserSubscription[{self.user_id.hex[:8]}...] "
            f"({self.plan_name}, {self.status}, expires: {self.expires_at.date()})"
        )


class SubscriptionResolver:
    """
    Резолвер подписок для получения лимитов и валидации.
    
    Предоставляет методы для:
    - Разрешения тарифного плана в PricingPreset
    - Получения LLMBudget из подписки
    - Валидации подписки (активна ли, не истекла ли)
    
    Чистая логика, без I/O, без БД, без внешних API.
    
    Examples:
        >>> from datetime import datetime, timedelta
        >>> from uuid import uuid4
        >>> from packages.billing import UserSubscription, SubscriptionResolver
        >>> 
        >>> # Подписка пользователя
        >>> subscription = UserSubscription(
        ...     user_id=uuid4(),
        ...     plan_name="BASE_499",
        ...     status="active",
        ...     started_at=datetime.now(),
        ...     expires_at=datetime.now() + timedelta(days=30),
        ...     auto_renew=True
        ... )
        >>> 
        >>> # Резолвер
        >>> resolver = SubscriptionResolver()
        >>> 
        >>> # Получить PricingPreset
        >>> preset = resolver.resolve_plan(subscription.plan_name)
        >>> print(f"Plan: {preset.description}")
        >>> 
        >>> # Получить LLMBudget
        >>> budget = resolver.resolve_budget(subscription)
        >>> print(f"Budget: {budget.max_tokens} tokens, {budget.max_cost_rub} RUB")
        >>> 
        >>> # Валидировать подписку
        >>> is_valid = resolver.validate_subscription(subscription, datetime.now())
        >>> print(f"Subscription valid: {is_valid}")
    """
    
    def resolve_plan(self, plan_name: str) -> PricingPreset:
        """
        Разрешает название тарифного плана в PricingPreset.
        
        Использует PRICING_PRESETS для получения пресета.
        Если план не найден, выбрасывает ValueError.
        
        Args:
            plan_name: Название тарифного плана
        
        Returns:
            PricingPreset для указанного плана
        
        Raises:
            ValueError: Если план не найден
        
        Examples:
            >>> resolver = SubscriptionResolver()
            >>> preset = resolver.resolve_plan("BASE_499")
            >>> print(f"Monthly limit: {preset.monthly_token_limit} tokens")
        """
        preset = PRICING_PRESETS.get(plan_name.upper())
        
        if preset is None:
            available_plans = ", ".join(PRICING_PRESETS.keys())
            raise ValueError(
                f"Unknown pricing plan: {plan_name}. "
                f"Available plans: {available_plans}"
            )
        
        return preset
    
    def resolve_budget(self, subscription: UserSubscription) -> LLMBudget:
        """
        Получает LLMBudget из подписки пользователя.
        
        Разрешает тарифный план в PricingPreset и преобразует его в LLMBudget.
        
        Args:
            subscription: Подписка пользователя
        
        Returns:
            LLMBudget с лимитами из тарифного плана
        
        Examples:
            >>> resolver = SubscriptionResolver()
            >>> subscription = UserSubscription(...)
            >>> budget = resolver.resolve_budget(subscription)
            >>> print(f"Max tokens: {budget.max_tokens}")
        """
        preset = self.resolve_plan(subscription.plan_name)
        return preset.to_budget()
    
    def validate_subscription(
        self,
        subscription: UserSubscription,
        now: datetime
    ) -> bool:
        """
        Валидирует подписку пользователя.
        
        Проверяет:
        - Статус подписки должен быть "active"
        - Подписка не должна быть истекшей (expires_at > now)
        
        Args:
            subscription: Подписка пользователя
            now: Текущее время для проверки
        
        Returns:
            True, если подписка валидна, False в противном случае
        
        Examples:
            >>> resolver = SubscriptionResolver()
            >>> subscription = UserSubscription(
            ...     user_id=uuid4(),
            ...     plan_name="BASE_499",
            ...     status="active",
            ...     started_at=datetime.now() - timedelta(days=10),
            ...     expires_at=datetime.now() + timedelta(days=20),
            ...     auto_renew=True
            ... )
            >>> 
            >>> is_valid = resolver.validate_subscription(subscription, datetime.now())
            >>> assert is_valid == True
            >>> 
            >>> # Истекшая подписка
            >>> expired_subscription = UserSubscription(
            ...     user_id=uuid4(),
            ...     plan_name="BASE_499",
            ...     status="active",
            ...     started_at=datetime.now() - timedelta(days=40),
            ...     expires_at=datetime.now() - timedelta(days=10),
            ...     auto_renew=False
            ... )
            >>> 
            >>> is_valid = resolver.validate_subscription(expired_subscription, datetime.now())
            >>> assert is_valid == False
        """
        # Проверка статуса
        if subscription.status != "active":
            return False
        
        # Проверка срока действия
        if subscription.expires_at <= now:
            return False
        
        return True
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "SubscriptionResolver()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "SubscriptionResolver"

