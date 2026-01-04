"""
Fake Payment Provider (Billing Domain).

Реализация PaymentProvider для тестирования и разработки без реальных платежей.
Использует детерминированную логику для симуляции успешных и неуспешных платежей.
"""

from datetime import datetime, timedelta
from uuid import UUID, uuid4

from .payments import CheckoutSession, PaymentIntent, PaymentResult
from .provider import PaymentProvider


class FakePaymentProvider(PaymentProvider):
    """
    Фейковый платежный провайдер для тестирования и разработки.
    
    Создает fake checkout URL и симулирует проверку платежей с детерминированной логикой:
    - 80% платежей успешны
    - 20% платежей неуспешны
    
    Логика основана на хеше provider_payment_id для детерминированности:
    если один и тот же provider_payment_id проверяется несколько раз,
    результат будет одинаковым.
    
    Не выполняет реальных платежей, не делает I/O, не обращается к внешним API.
    
    Examples:
        >>> from packages.billing import PaymentIntent, FakePaymentProvider
        >>> from uuid import uuid4
        >>> from datetime import datetime
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
        >>> # Создать checkout сессию
        >>> provider = FakePaymentProvider()
        >>> session = provider.create_checkout(intent)
        >>> print(f"Checkout URL: {session.checkout_url}")
        Checkout URL: https://fake-payment.example.com/checkout/...
        >>> 
        >>> # Верифицировать платеж (детерминированная логика)
        >>> result = provider.verify_payment(session.id.hex)
        >>> print(f"Payment success: {result.success}")
        Payment success: True  # или False (80% / 20%)
    """
    
    @property
    def name(self) -> str:
        """Название провайдера: "fake"."""
        return "fake"
    
    def create_checkout(self, intent: PaymentIntent) -> CheckoutSession:
        """
        Создает fake checkout сессию.
        
        Генерирует fake URL для checkout на основе идентификатора платежного намерения.
        Сессия истекает через 15 минут после создания.
        
        Args:
            intent: Платежное намерение
        
        Returns:
            CheckoutSession с fake URL
        
        Raises:
            ValueError: Если платежное намерение невалидно
        
        Examples:
            >>> provider = FakePaymentProvider()
            >>> intent = PaymentIntent(...)
            >>> session = provider.create_checkout(intent)
            >>> # Перенаправить пользователя на session.checkout_url
        """
        if intent.amount_rub < 0:
            raise ValueError(f"amount_rub must be >= 0, got {intent.amount_rub}")
        
        # Генерируем fake checkout URL на основе идентификатора намерения
        checkout_id = intent.id.hex[:16]
        checkout_url = f"https://fake-payment.example.com/checkout/{checkout_id}"
        
        # Сессия истекает через 15 минут
        expires_at = datetime.now() + timedelta(minutes=15)
        
        return CheckoutSession(
            id=uuid4(),
            payment_intent_id=intent.id,
            provider_name=self.name,
            checkout_url=checkout_url,
            expires_at=expires_at
        )
    
    def verify_payment(self, provider_payment_id: str) -> PaymentResult:
        """
        Верифицирует платеж с детерминированной логикой.
        
        Использует хеш от provider_payment_id для детерминированности:
        один и тот же provider_payment_id всегда дает одинаковый результат.
        
        Логика:
        - Вычисляет хеш от provider_payment_id
        - Если хеш % 100 < 80 → success=True (80% успешных)
        - Если хеш % 100 >= 80 → success=False (20% неуспешных)
        
        Args:
            provider_payment_id: Идентификатор платежа у провайдера
            (обычно это UUID сессии checkout или идентификатор от провайдера)
        
        Returns:
            PaymentResult с результатом проверки
        
        Raises:
            ValueError: Если provider_payment_id невалиден
        
        Examples:
            >>> provider = FakePaymentProvider()
            >>> result = provider.verify_payment("abc123")
            >>> if result.success:
            ...     print("Payment successful!")
            ... else:
            ...     print(f"Payment failed: {result.error_code}")
        """
        if not provider_payment_id or not provider_payment_id.strip():
            raise ValueError("provider_payment_id cannot be empty")
        
        provider_payment_id = provider_payment_id.strip()
        
        # Детерминированная логика на основе хеша
        # Используем hash() для получения детерминированного значения
        # (в Python hash() детерминирован в рамках одного процесса)
        hash_value = hash(provider_payment_id)
        
        # Нормализуем хеш к положительному числу в диапазоне 0-99
        normalized_hash = abs(hash_value) % 100
        
        # 80% успешных платежей (0-79), 20% неуспешных (80-99)
        success = normalized_hash < 80
        
        if success:
            return PaymentResult(
                success=True,
                provider_payment_id=provider_payment_id,
                error_code=None
            )
        else:
            # Генерируем детерминированный код ошибки на основе хеша
            error_codes = [
                "insufficient_funds",
                "card_declined",
                "payment_timeout",
                "invalid_card",
                "network_error"
            ]
            error_code_index = normalized_hash % len(error_codes)
            error_code = error_codes[error_code_index]
            
            return PaymentResult(
                success=False,
                provider_payment_id=provider_payment_id,
                error_code=error_code
            )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "FakePaymentProvider()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "FakePaymentProvider[fake]"


