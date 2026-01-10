"""
Пакет Billing Domain для управления тарифными планами, подписками и платежами.

Предоставляет модели и логику для:
- Описания тарифов и подписок пользователей (F1: Plans & Limits)
- Обработки платежей и checkout (F2: Checkout & Payment Provider)
- Подтверждения платежей и обработки webhook'ов (F3: Payment Confirmation & Webhook)
- Определения прав пользователя (F4: Entitlements)
- Управления жизненным циклом подписки (F5: Subscription Lifecycle)

Billing слой описывает кто на каком тарифе, какие у него лимиты, и как обрабатываются платежи.
"""

from .confirmation import (
    PaymentConfirmationResult,
    PaymentConfirmationService,
    PaymentEvent,
)
from .entitlements import EntitlementResolver, EntitlementSet
from .fake_provider import FakePaymentProvider
from .tbank_provider import (
    TBankConfig,
    TBankPaymentProvider,
    get_tbank_config,
    get_tbank_provider,
)
from .lifecycle import (
    SubscriptionEvent,
    SubscriptionLifecycleService,
    SubscriptionTransitionResult,
)
from .payments import CheckoutSession, PaymentIntent, PaymentResult
from .plans import SubscriptionPlan, SubscriptionResolver, UserSubscription
from .provider import PaymentProvider

__all__ = [
    # F1: Plans & Limits
    "SubscriptionPlan",
    "UserSubscription",
    "SubscriptionResolver",
    # F2: Checkout & Payment Provider
    "PaymentIntent",
    "CheckoutSession",
    "PaymentResult",
    "PaymentProvider",
    "FakePaymentProvider",
    "TBankConfig",
    "TBankPaymentProvider",
    "get_tbank_config",
    "get_tbank_provider",
    # F3: Payment Confirmation & Webhook
    "PaymentEvent",
    "PaymentConfirmationResult",
    "PaymentConfirmationService",
    # F4: Entitlements
    "EntitlementSet",
    "EntitlementResolver",
    # F5: Subscription Lifecycle
    "SubscriptionEvent",
    "SubscriptionTransitionResult",
    "SubscriptionLifecycleService",
]

