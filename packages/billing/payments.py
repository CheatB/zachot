"""
Payment Models (Billing Domain) для управления платежами.

Предоставляет модели для платежных намерений, сессий checkout и результатов платежей.
Это доменные модели, без I/O, без БД, без внешних API.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PaymentIntent(BaseModel):
    """
    Платежное намерение (Payment Intent).
    
    Описывает намерение пользователя оплатить подписку на тарифный план.
    Создается до начала процесса оплаты и обновляется по мере прохождения checkout.
    
    Attributes:
        id: Уникальный идентификатор платежного намерения
        user_id: Идентификатор пользователя
        plan_name: Название тарифного плана
        amount_rub: Сумма платежа в рублях
        currency: Валюта (только "RUB")
        status: Статус платежного намерения
        created_at: Время создания намерения
    
    Examples:
        >>> from uuid import uuid4
        >>> from datetime import datetime
        >>> 
        >>> intent = PaymentIntent(
        ...     id=uuid4(),
        ...     user_id=uuid4(),
        ...     plan_name="BASE_499",
        ...     amount_rub=499,
        ...     currency="RUB",
        ...     status="created",
        ...     created_at=datetime.now()
        ... )
        >>> print(f"Payment intent: {intent.amount_rub} RUB for {intent.plan_name}")
        Payment intent: 499 RUB for BASE_499
    """
    
    id: UUID = Field(..., description="Уникальный идентификатор платежного намерения")
    user_id: UUID = Field(..., description="Идентификатор пользователя")
    plan_name: str = Field(..., description="Название тарифного плана")
    amount_rub: int = Field(..., ge=0, description="Сумма платежа в рублях")
    currency: Literal["RUB"] = Field("RUB", description="Валюта")
    status: Literal["created", "pending", "paid", "failed"] = Field(
        ..., description="Статус платежного намерения"
    )
    created_at: datetime = Field(..., description="Время создания намерения")
    
    @field_validator('amount_rub')
    @classmethod
    def validate_amount(cls, v: int) -> int:
        """Валидация: amount_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"amount_rub must be >= 0, got {v}")
        return v
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Валидация: status должен быть одним из допустимых значений."""
        if v not in ("created", "pending", "paid", "failed"):
            raise ValueError(
                f"status must be one of: created, pending, paid, failed, got {v}"
            )
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"PaymentIntent(id={self.id!r}, user_id={self.user_id!r}, "
            f"plan={self.plan_name!r}, amount={self.amount_rub} RUB, "
            f"status={self.status!r})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"PaymentIntent[{self.id.hex[:8]}...] "
            f"({self.plan_name}, {self.amount_rub} RUB, {self.status})"
        )


class CheckoutSession(BaseModel):
    """
    Сессия checkout для платежа.
    
    Описывает сессию checkout, созданную платежным провайдером.
    Содержит URL для перенаправления пользователя и время истечения сессии.
    
    Attributes:
        id: Уникальный идентификатор сессии checkout
        payment_intent_id: Идентификатор платежного намерения
        provider_name: Название платежного провайдера
        checkout_url: URL для перенаправления пользователя на checkout
        expires_at: Время истечения сессии
    
    Examples:
        >>> from uuid import uuid4
        >>> from datetime import datetime, timedelta
        >>> 
        >>> session = CheckoutSession(
        ...     id=uuid4(),
        ...     payment_intent_id=uuid4(),
        ...     provider_name="fake",
        ...     checkout_url="https://fake-payment.example.com/checkout/abc123",
        ...     expires_at=datetime.now() + timedelta(minutes=15)
        ... )
        >>> print(f"Checkout URL: {session.checkout_url}")
        Checkout URL: https://fake-payment.example.com/checkout/abc123
    """
    
    id: UUID = Field(..., description="Уникальный идентификатор сессии checkout")
    payment_intent_id: UUID = Field(..., description="Идентификатор платежного намерения")
    provider_name: str = Field(..., description="Название платежного провайдера")
    checkout_url: str = Field(..., description="URL для перенаправления пользователя на checkout")
    expires_at: datetime = Field(..., description="Время истечения сессии")
    
    @field_validator('checkout_url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Валидация: checkout_url должен быть непустой строкой."""
        if not v or not v.strip():
            raise ValueError("checkout_url cannot be empty")
        return v.strip()
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"CheckoutSession(id={self.id!r}, payment_intent_id={self.payment_intent_id!r}, "
            f"provider={self.provider_name!r}, expires_at={self.expires_at})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"CheckoutSession[{self.id.hex[:8]}...] "
            f"({self.provider_name}, expires: {self.expires_at})"
        )


class PaymentResult(BaseModel):
    """
    Результат проверки платежа.
    
    Описывает результат проверки платежа у платежного провайдера.
    Используется для верификации успешности платежа после возврата пользователя из checkout.
    
    Attributes:
        success: Успешен ли платеж
        provider_payment_id: Идентификатор платежа у провайдера
        error_code: Код ошибки (если платеж не успешен)
    
    Examples:
        >>> # Успешный платеж
        >>> result = PaymentResult(
        ...     success=True,
        ...     provider_payment_id="pay_abc123",
        ...     error_code=None
        ... )
        >>> print(f"Payment success: {result.success}")
        Payment success: True
        >>> 
        >>> # Неуспешный платеж
        >>> failed_result = PaymentResult(
        ...     success=False,
        ...     provider_payment_id="pay_xyz789",
        ...     error_code="insufficient_funds"
        ... )
        >>> print(f"Payment failed: {failed_result.error_code}")
        Payment failed: insufficient_funds
    """
    
    success: bool = Field(..., description="Успешен ли платеж")
    provider_payment_id: str = Field(..., description="Идентификатор платежа у провайдера")
    error_code: Optional[str] = Field(None, description="Код ошибки (если платеж не успешен)")
    
    @field_validator('provider_payment_id')
    @classmethod
    def validate_provider_payment_id(cls, v: str) -> str:
        """Валидация: provider_payment_id должен быть непустой строкой."""
        if not v or not v.strip():
            raise ValueError("provider_payment_id cannot be empty")
        return v.strip()
    
    @field_validator('error_code')
    @classmethod
    def validate_error_code(cls, v: Optional[str]) -> Optional[str]:
        """Валидация: error_code должен быть непустой строкой, если указан."""
        if v is not None and (not v or not v.strip()):
            raise ValueError("error_code cannot be empty if provided")
        return v.strip() if v else None
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"PaymentResult(success={self.success}, "
            f"provider_payment_id={self.provider_payment_id!r}, "
            f"error_code={self.error_code!r})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "SUCCESS" if self.success else "FAILED"
        error_info = f" ({self.error_code})" if self.error_code else ""
        return f"PaymentResult[{status}]{error_info} (provider_id: {self.provider_payment_id})"


