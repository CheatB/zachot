"""
Payment Provider Interface (Billing Domain).

Определяет абстрактный интерфейс для платежных провайдеров.
Все платежные провайдеры должны реализовывать этот интерфейс.
"""

from abc import ABC, abstractmethod

from .payments import CheckoutSession, PaymentIntent, PaymentResult


class PaymentProvider(ABC):
    """
    Абстрактный базовый класс для платежных провайдеров.
    
    Определяет контракт для создания checkout сессий и верификации платежей.
    Все платежные провайдеры (FakePaymentProvider, реальные провайдеры)
    должны реализовывать этот интерфейс.
    
    Методы:
        - create_checkout: Создает сессию checkout для платежного намерения
        - verify_payment: Верифицирует платеж по идентификатору провайдера
    
    Examples:
        >>> from packages.billing import PaymentIntent, PaymentProvider
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
        >>> # Использовать провайдер (пример с FakePaymentProvider)
        >>> provider = FakePaymentProvider()
        >>> session = provider.create_checkout(intent)
        >>> print(f"Checkout URL: {session.checkout_url}")
        >>> 
        >>> # После возврата пользователя из checkout
        >>> result = provider.verify_payment(session.id.hex)
        >>> if result.success:
        ...     print("Payment successful!")
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """
        Название платежного провайдера.
        
        Returns:
            Название провайдера (например, "fake", "yookassa", "stripe")
        """
        pass
    
    @abstractmethod
    def create_checkout(self, intent: PaymentIntent) -> CheckoutSession:
        """
        Создает сессию checkout для платежного намерения.
        
        Создает сессию checkout у платежного провайдера и возвращает
        CheckoutSession с URL для перенаправления пользователя.
        
        Args:
            intent: Платежное намерение
        
        Returns:
            CheckoutSession с URL для checkout
        
        Raises:
            ValueError: Если платежное намерение невалидно
            RuntimeError: Если провайдер недоступен (для реальных провайдеров)
        
        Examples:
            >>> provider = FakePaymentProvider()
            >>> intent = PaymentIntent(...)
            >>> session = provider.create_checkout(intent)
            >>> # Перенаправить пользователя на session.checkout_url
        """
        pass
    
    @abstractmethod
    def verify_payment(self, provider_payment_id: str) -> PaymentResult:
        """
        Верифицирует платеж по идентификатору провайдера.
        
        Проверяет статус платежа у платежного провайдера по идентификатору,
        полученному при создании checkout сессии или из webhook'а.
        
        Args:
            provider_payment_id: Идентификатор платежа у провайдера
        
        Returns:
            PaymentResult с результатом проверки платежа
        
        Raises:
            ValueError: Если provider_payment_id невалиден
            RuntimeError: Если провайдер недоступен (для реальных провайдеров)
        
        Examples:
            >>> provider = FakePaymentProvider()
            >>> result = provider.verify_payment("pay_abc123")
            >>> if result.success:
            ...     # Создать UserSubscription
            ...     pass
        """
        pass
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"PaymentProvider(name={self.name!r})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"PaymentProvider[{self.name}]"


