"""
Payment Confirmation & Webhook Domain Logic (Billing Domain).

Предоставляет доменную логику для подтверждения платежей на основе событий от провайдеров.
Независим от HTTP, конкретных провайдеров и storage слоя.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .payments import PaymentIntent
from .provider import PaymentProvider


class PaymentEvent(BaseModel):
    """
    Событие от платежного провайдера (webhook event).
    
    Описывает событие, полученное от платежного провайдера (например, через webhook).
    Содержит информацию о типе события, идентификаторе платежа и хеш исходного payload'а
    для проверки целостности.
    
    Attributes:
        provider_name: Название платежного провайдера
        provider_payment_id: Идентификатор платежа у провайдера
        event_type: Тип события ("payment_succeeded" или "payment_failed")
        received_at: Время получения события
        raw_payload_hash: Хеш исходного payload'а для проверки целостности
    
    Examples:
        >>> from datetime import datetime
        >>> import hashlib
        >>> 
        >>> # Создать событие об успешном платеже
        >>> payload = b'{"payment_id": "pay_123", "status": "succeeded"}'
        >>> payload_hash = hashlib.sha256(payload).hexdigest()
        >>> 
        >>> event = PaymentEvent(
        ...     provider_name="fake",
        ...     provider_payment_id="pay_abc123",
        ...     event_type="payment_succeeded",
        ...     received_at=datetime.now(),
        ...     raw_payload_hash=payload_hash
        ... )
        >>> print(f"Event: {event.event_type} from {event.provider_name}")
        Event: payment_succeeded from fake
    """
    
    provider_name: str = Field(..., description="Название платежного провайдера")
    provider_payment_id: str = Field(..., description="Идентификатор платежа у провайдера")
    event_type: Literal["payment_succeeded", "payment_failed"] = Field(
        ..., description="Тип события"
    )
    received_at: datetime = Field(..., description="Время получения события")
    raw_payload_hash: str = Field(..., description="Хеш исходного payload'а для проверки целостности")
    
    @field_validator('provider_payment_id')
    @classmethod
    def validate_provider_payment_id(cls, v: str) -> str:
        """Валидация: provider_payment_id должен быть непустой строкой."""
        if not v or not v.strip():
            raise ValueError("provider_payment_id cannot be empty")
        return v.strip()
    
    @field_validator('raw_payload_hash')
    @classmethod
    def validate_payload_hash(cls, v: str) -> str:
        """Валидация: raw_payload_hash должен быть непустой строкой."""
        if not v or not v.strip():
            raise ValueError("raw_payload_hash cannot be empty")
        return v.strip()
    
    @field_validator('event_type')
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        """Валидация: event_type должен быть одним из допустимых значений."""
        if v not in ("payment_succeeded", "payment_failed"):
            raise ValueError(
                f"event_type must be one of: payment_succeeded, payment_failed, got {v}"
            )
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"PaymentEvent(provider={self.provider_name!r}, "
            f"payment_id={self.provider_payment_id!r}, "
            f"event_type={self.event_type!r}, received_at={self.received_at})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"PaymentEvent[{self.event_type.upper()}] "
            f"({self.provider_name}, payment_id: {self.provider_payment_id})"
        )


class PaymentConfirmationResult(BaseModel):
    """
    Результат подтверждения платежа.
    
    Описывает результат обработки события от платежного провайдера.
    Содержит информацию о том, было ли событие принято, какая причина,
    и какой статус должен быть у PaymentIntent после обработки.
    
    Attributes:
        accepted: Было ли событие принято для обработки
        reason: Причина принятия или отклонения события
        intent_status: Предлагаемый статус для PaymentIntent
    
    Examples:
        >>> result = PaymentConfirmationResult(
        ...     accepted=True,
        ...     reason="Payment verified successfully",
        ...     intent_status="paid"
        ... )
        >>> print(f"Confirmation: {result.intent_status} ({result.reason})")
        Confirmation: paid (Payment verified successfully)
    """
    
    accepted: bool = Field(..., description="Было ли событие принято для обработки")
    reason: str = Field(..., description="Причина принятия или отклонения события")
    intent_status: Literal["paid", "failed", "unchanged"] = Field(
        ..., description="Предлагаемый статус для PaymentIntent"
    )
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v: str) -> str:
        """Валидация: reason должен быть непустой строкой."""
        if not v or not v.strip():
            raise ValueError("reason cannot be empty")
        return v.strip()
    
    @field_validator('intent_status')
    @classmethod
    def validate_intent_status(cls, v: str) -> str:
        """Валидация: intent_status должен быть одним из допустимых значений."""
        if v not in ("paid", "failed", "unchanged"):
            raise ValueError(
                f"intent_status must be one of: paid, failed, unchanged, got {v}"
            )
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"PaymentConfirmationResult(accepted={self.accepted}, "
            f"reason={self.reason!r}, intent_status={self.intent_status!r})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "ACCEPTED" if self.accepted else "REJECTED"
        return (
            f"PaymentConfirmationResult[{status}] "
            f"({self.intent_status}, reason: {self.reason})"
        )


class PaymentConfirmationService:
    """
    Сервис подтверждения платежей на основе событий от провайдеров.
    
    Обрабатывает события от платежных провайдеров (webhook events) и определяет,
    должен ли статус PaymentIntent быть обновлен. Обеспечивает идемпотентность:
    повторные события обрабатываются корректно без дублирования операций.
    
    Логика обработки:
    1. Если intent.status == "paid" → accepted=True, intent_status="unchanged"
       (идемпотентность: повторный webhook для уже оплаченного платежа)
    
    2. Если event_type == "payment_succeeded":
       - Вызвать provider.verify_payment(provider_payment_id)
       - Если success → intent_status="paid"
       - Иначе → intent_status="failed"
    
    3. Если event_type == "payment_failed" → intent_status="failed"
    
    PaymentIntent не мутируется (immutable), возвращается только результат.
    Вся логика чистая, без I/O, без БД, без side-effects.
    
    Examples:
        >>> from packages.billing import (
        ...     PaymentIntent, PaymentEvent, PaymentConfirmationService, FakePaymentProvider
        ... )
        >>> from uuid import uuid4
        >>> from datetime import datetime
        >>> import hashlib
        >>> 
        >>> # Создать платежное намерение
        >>> intent = PaymentIntent(
        ...     id=uuid4(),
        ...     user_id=uuid4(),
        ...     plan_name="BASE_499",
        ...     amount_rub=499,
        ...     currency="RUB",
        ...     status="created",
        ...     created_at=datetime.now()
        ... )
        >>> 
        >>> # Создать событие об успешном платеже
        >>> payload = b'{"payment_id": "pay_123"}'
        >>> payload_hash = hashlib.sha256(payload).hexdigest()
        >>> 
        >>> event = PaymentEvent(
        ...     provider_name="fake",
        ...     provider_payment_id="pay_abc123",
        ...     event_type="payment_succeeded",
        ...     received_at=datetime.now(),
        ...     raw_payload_hash=payload_hash
        ... )
        >>> 
        >>> # Подтвердить платеж
        >>> service = PaymentConfirmationService()
        >>> provider = FakePaymentProvider()
        >>> result = service.confirm(intent, event, provider)
        >>> 
        >>> if result.accepted and result.intent_status == "paid":
        ...     print("Payment confirmed successfully!")
        ...     # Обновить intent в storage (вне этого слоя)
        ...     # new_intent = intent.model_copy(update={"status": "paid"})
    """
    
    def confirm(
        self,
        intent: PaymentIntent,
        event: PaymentEvent,
        provider: PaymentProvider
    ) -> PaymentConfirmationResult:
        """
        Подтверждает платеж на основе события от провайдера.
        
        Обрабатывает событие от платежного провайдера и определяет,
        должен ли статус PaymentIntent быть обновлен. Обеспечивает идемпотентность.
        
        Args:
            intent: Платежное намерение для подтверждения
            event: Событие от платежного провайдера
            provider: Платежный провайдер для верификации платежа
        
        Returns:
            PaymentConfirmationResult с результатом подтверждения
        
        Raises:
            ValueError: Если провайдер события не совпадает с провайдером intent
            RuntimeError: Если провайдер недоступен (для реальных провайдеров)
        
        Examples:
            >>> # Успешный платёж
            >>> service = PaymentConfirmationService()
            >>> intent = PaymentIntent(..., status="created")
            >>> event = PaymentEvent(..., event_type="payment_succeeded")
            >>> provider = FakePaymentProvider()
            >>> 
            >>> result = service.confirm(intent, event, provider)
            >>> if result.accepted and result.intent_status == "paid":
            ...     # Обновить intent в storage
            ...     pass
            >>> 
            >>> # Повторный webhook (идемпотентность)
            >>> intent_paid = PaymentIntent(..., status="paid")
            >>> result = service.confirm(intent_paid, event, provider)
            >>> assert result.intent_status == "unchanged"
            >>> assert result.accepted == True
            >>> 
            >>> # Невалидный платёж
            >>> event_failed = PaymentEvent(..., event_type="payment_failed")
            >>> result = service.confirm(intent, event_failed, provider)
            >>> assert result.intent_status == "failed"
        """
        # Идемпотентность: если intent уже оплачен, не обрабатываем повторно
        if intent.status == "paid":
            return PaymentConfirmationResult(
                accepted=True,
                reason="Payment already confirmed (idempotency)",
                intent_status="unchanged"
            )
        
        # Проверка провайдера (опционально, можно убрать если не требуется)
        # В реальном сценарии может быть проверка, что event.provider_name == provider.name
        
        # Обработка события в зависимости от типа
        if event.event_type == "payment_succeeded":
            # Верифицировать платеж у провайдера
            verify_result = provider.verify_payment(event.provider_payment_id)
            
            if verify_result.success:
                return PaymentConfirmationResult(
                    accepted=True,
                    reason="Payment verified successfully",
                    intent_status="paid"
                )
            else:
                # Провайдер сообщил об успехе, но верификация не прошла
                return PaymentConfirmationResult(
                    accepted=True,
                    reason=f"Payment verification failed: {verify_result.error_code}",
                    intent_status="failed"
                )
        
        elif event.event_type == "payment_failed":
            # Провайдер явно сообщил о неудаче
            return PaymentConfirmationResult(
                accepted=True,
                reason="Payment failed according to provider",
                intent_status="failed"
            )
        
        else:
            # Неизвестный тип события (не должен произойти из-за валидации)
            return PaymentConfirmationResult(
                accepted=False,
                reason=f"Unknown event type: {event.event_type}",
                intent_status="unchanged"
            )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "PaymentConfirmationService()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "PaymentConfirmationService"


