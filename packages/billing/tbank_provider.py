"""
T-Bank Payment Provider (Billing Domain).

Реализация PaymentProvider для интеграции с API эквайринга Т-Банка.
Документация: https://developer.tbank.ru/eacq/intro/developer/setup_js/

Поддерживает:
- Инициализацию платежей (Init)
- Рекуррентные платежи (Charge)
- Проверку статуса (GetState)
- Отмену платежей (Cancel)
"""

import hashlib
import hmac
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Optional
from uuid import UUID, uuid4

import httpx
from pydantic import BaseModel, Field

from .payments import CheckoutSession, PaymentIntent, PaymentResult
from .provider import PaymentProvider

logger = logging.getLogger(__name__)


class TBankConfig(BaseModel):
    """Конфигурация Т-Банка."""
    terminal_key: str = Field(..., description="Terminal Key из ЛК Т-Банка")
    password: str = Field(..., description="Пароль терминала")
    is_test: bool = Field(True, description="Тестовый режим")
    notification_url: Optional[str] = Field(None, description="URL для webhooks")
    success_url: str = Field("https://app.zachet.tech/", description="URL после успешной оплаты")
    fail_url: str = Field("https://app.zachet.tech/billing?status=fail", description="URL после неуспешной оплаты")
    
    @property
    def api_url(self) -> str:
        """URL API Т-Банка."""
        if self.is_test:
            return "https://rest-api-test.tinkoff.ru/v2"
        return "https://securepay.tinkoff.ru/v2"


class TBankInitRequest(BaseModel):
    """Запрос на инициализацию платежа."""
    TerminalKey: str
    Amount: int  # в копейках
    OrderId: str
    Description: str
    Token: str  # подпись запроса
    CustomerKey: Optional[str] = None  # для рекуррентных платежей
    Recurrent: Optional[str] = None  # "Y" для рекуррентных
    NotificationURL: Optional[str] = None
    SuccessURL: Optional[str] = None
    FailURL: Optional[str] = None
    DATA: Optional[dict] = None  # дополнительные данные
    Receipt: Optional[dict] = None  # данные для чека 54-ФЗ


class TBankInitResponse(BaseModel):
    """Ответ на инициализацию платежа."""
    Success: bool
    ErrorCode: str = "0"
    Message: Optional[str] = None
    Details: Optional[str] = None
    TerminalKey: Optional[str] = None
    Status: Optional[str] = None
    PaymentId: Optional[str] = None
    OrderId: Optional[str] = None
    Amount: Optional[int] = None
    PaymentURL: Optional[str] = None


class TBankChargeRequest(BaseModel):
    """Запрос на рекуррентное списание."""
    TerminalKey: str
    PaymentId: str
    RebillId: str
    Token: str
    SendEmail: Optional[bool] = None
    InfoEmail: Optional[str] = None


class TBankGetStateRequest(BaseModel):
    """Запрос статуса платежа."""
    TerminalKey: str
    PaymentId: str
    Token: str


class TBankPaymentProvider(PaymentProvider):
    """
    Платежный провайдер Т-Банка.
    
    Реализует полный цикл платежей:
    - Init: создание платежа
    - Charge: рекуррентное списание по RebillId
    - GetState: проверка статуса платежа
    - Cancel: отмена платежа
    
    Examples:
        >>> config = TBankConfig(
        ...     terminal_key="1768061897408DEMO",
        ...     password="QNX%z2q*FEAWJSVw",
        ...     is_test=True
        ... )
        >>> provider = TBankPaymentProvider(config)
        >>> 
        >>> # Инициализация платежа
        >>> result = await provider.init_payment(
        ...     order_id="ORDER-123",
        ...     amount=49900,  # 499 руб в копейках
        ...     description="Подписка Зачёт на 1 месяц",
        ...     customer_key="user-uuid",
        ...     recurrent=True,
        ...     email="user@example.com"
        ... )
        >>> print(f"Payment URL: {result.PaymentURL}")
    """
    
    def __init__(self, config: TBankConfig):
        """
        Инициализация провайдера.
        
        Args:
            config: Конфигурация Т-Банка
        """
        self.config = config
        self._client = httpx.AsyncClient(timeout=30.0)
        logger.info(f"[TBank] Initialized provider (test_mode={config.is_test})")
    
    @property
    def name(self) -> str:
        """Название провайдера."""
        return "tbank"
    
    def _generate_token(self, params: dict) -> str:
        """
        Генерирует токен подписи запроса.
        
        Алгоритм:
        1. Добавить Password к параметрам
        2. Отсортировать по ключам
        3. Конкатенировать значения
        4. SHA-256 хеш
        
        Args:
            params: Параметры запроса (без Token)
        
        Returns:
            Токен подписи
        """
        # Добавляем пароль
        sign_params = {**params, "Password": self.config.password}
        
        # Удаляем вложенные объекты (Receipt, DATA и т.д.)
        sign_params = {k: v for k, v in sign_params.items() 
                      if not isinstance(v, (dict, list)) and v is not None}
        
        # Сортируем и конкатенируем
        sorted_keys = sorted(sign_params.keys())
        concat_str = "".join(str(sign_params[k]) for k in sorted_keys)
        
        # SHA-256
        token = hashlib.sha256(concat_str.encode()).hexdigest()
        
        logger.debug(f"[TBank] Generated token for params: {list(sign_params.keys())}")
        return token
    
    async def init_payment(
        self,
        order_id: str,
        amount: int,
        description: str,
        customer_key: Optional[str] = None,
        recurrent: bool = False,
        email: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> TBankInitResponse:
        """
        Инициализирует платеж в Т-Банке.
        
        Args:
            order_id: Уникальный ID заказа
            amount: Сумма в копейках
            description: Описание платежа
            customer_key: ID клиента для рекуррентных платежей
            recurrent: Флаг рекуррентного платежа
            email: Email для чека
            phone: Телефон для чека
        
        Returns:
            TBankInitResponse с PaymentURL и PaymentId
        
        Raises:
            RuntimeError: Если API вернул ошибку
        """
        logger.info(f"[TBank] Init payment: order_id={order_id}, amount={amount}, recurrent={recurrent}")
        
        # Базовые параметры
        params = {
            "TerminalKey": self.config.terminal_key,
            "Amount": amount,
            "OrderId": order_id,
            "Description": description,
        }
        
        # Рекуррентные платежи
        if recurrent and customer_key:
            params["Recurrent"] = "Y"
            params["CustomerKey"] = customer_key
            logger.info(f"[TBank] Recurrent payment with CustomerKey: {customer_key[:8]}...")
        
        # URLs
        if self.config.notification_url:
            params["NotificationURL"] = self.config.notification_url
        params["SuccessURL"] = self.config.success_url
        params["FailURL"] = self.config.fail_url
        
        # Чек 54-ФЗ (обязательно email или phone)
        if email or phone:
            receipt = {
                "Taxation": "usn_income",  # УСН доходы
                "Items": [{
                    "Name": description[:64],  # Максимум 64 символа
                    "Price": amount,
                    "Quantity": 1,
                    "Amount": amount,
                    "PaymentMethod": "full_payment",
                    "PaymentObject": "service",
                    "Tax": "none",
                }]
            }
            if email:
                receipt["Email"] = email
            if phone:
                receipt["Phone"] = phone
            params["Receipt"] = receipt
        
        # Генерируем токен
        params["Token"] = self._generate_token(params)
        
        # Отправляем запрос
        url = f"{self.config.api_url}/Init"
        logger.debug(f"[TBank] Request to {url}")
        
        try:
            response = await self._client.post(url, json=params)
            response.raise_for_status()
            data = response.json()
            
            result = TBankInitResponse(**data)
            
            if result.Success:
                logger.info(f"[TBank] Init success: PaymentId={result.PaymentId}, URL={result.PaymentURL}")
            else:
                logger.error(f"[TBank] Init failed: {result.ErrorCode} - {result.Message}")
                raise RuntimeError(f"TBank Init failed: {result.ErrorCode} - {result.Message}")
            
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"[TBank] HTTP error during Init: {e}")
            raise RuntimeError(f"TBank API error: {e}")
    
    async def charge(
        self,
        payment_id: str,
        rebill_id: str,
        email: Optional[str] = None,
    ) -> TBankInitResponse:
        """
        Выполняет рекуррентное списание.
        
        Args:
            payment_id: ID платежа из Init
            rebill_id: RebillId из успешного первого платежа
            email: Email для уведомления
        
        Returns:
            TBankInitResponse с результатом списания
        """
        logger.info(f"[TBank] Charge: payment_id={payment_id}, rebill_id={rebill_id[:8]}...")
        
        params = {
            "TerminalKey": self.config.terminal_key,
            "PaymentId": payment_id,
            "RebillId": rebill_id,
        }
        
        if email:
            params["SendEmail"] = True
            params["InfoEmail"] = email
        
        params["Token"] = self._generate_token(params)
        
        url = f"{self.config.api_url}/Charge"
        
        try:
            response = await self._client.post(url, json=params)
            response.raise_for_status()
            data = response.json()
            
            result = TBankInitResponse(**data)
            
            if result.Success:
                logger.info(f"[TBank] Charge success: PaymentId={result.PaymentId}")
            else:
                logger.error(f"[TBank] Charge failed: {result.ErrorCode} - {result.Message}")
            
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"[TBank] HTTP error during Charge: {e}")
            raise RuntimeError(f"TBank API error: {e}")
    
    async def get_state(self, payment_id: str) -> dict:
        """
        Получает статус платежа.
        
        Args:
            payment_id: ID платежа из Init
        
        Returns:
            Данные о статусе платежа
        """
        logger.info(f"[TBank] GetState: payment_id={payment_id}")
        
        params = {
            "TerminalKey": self.config.terminal_key,
            "PaymentId": payment_id,
        }
        params["Token"] = self._generate_token(params)
        
        url = f"{self.config.api_url}/GetState"
        
        try:
            response = await self._client.post(url, json=params)
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"[TBank] GetState result: Status={data.get('Status')}")
            return data
            
        except httpx.HTTPError as e:
            logger.error(f"[TBank] HTTP error during GetState: {e}")
            raise RuntimeError(f"TBank API error: {e}")
    
    def verify_notification(self, data: dict) -> bool:
        """
        Верифицирует webhook уведомление от Т-Банка.
        
        Args:
            data: Данные уведомления
        
        Returns:
            True если подпись валидна
        """
        received_token = data.get("Token")
        if not received_token:
            logger.warning("[TBank] Notification without Token")
            return False
        
        # Убираем Token из данных для проверки
        check_data = {k: v for k, v in data.items() if k != "Token"}
        expected_token = self._generate_token(check_data)
        
        is_valid = received_token == expected_token
        
        if not is_valid:
            logger.warning(f"[TBank] Invalid notification token")
        else:
            logger.info(f"[TBank] Notification verified: OrderId={data.get('OrderId')}, Status={data.get('Status')}")
        
        return is_valid
    
    # Реализация абстрактных методов PaymentProvider
    
    def create_checkout(self, intent: PaymentIntent) -> CheckoutSession:
        """
        Создаёт checkout сессию (синхронный метод).
        
        Note: Для Т-Банка рекомендуется использовать async init_payment напрямую.
        """
        raise NotImplementedError("Use async init_payment() instead")
    
    def verify_payment(self, provider_payment_id: str) -> PaymentResult:
        """
        Верифицирует платёж (синхронный метод).
        
        Note: Для Т-Банка рекомендуется использовать async get_state напрямую.
        """
        raise NotImplementedError("Use async get_state() instead")
    
    async def close(self):
        """Закрывает HTTP клиент."""
        await self._client.aclose()
        logger.info("[TBank] Provider closed")


# Конфигурация по умолчанию из переменных окружения
def get_tbank_config() -> TBankConfig:
    """
    Получает конфигурацию Т-Банка из переменных окружения.
    
    Environment variables:
        TBANK_TERMINAL_KEY: Terminal Key
        TBANK_PASSWORD: Пароль терминала
        TBANK_TEST_MODE: "true" для тестового режима
        TBANK_NOTIFICATION_URL: URL для webhooks
    
    Returns:
        TBankConfig
    """
    return TBankConfig(
        terminal_key=os.getenv("TBANK_TERMINAL_KEY", "1768061897408DEMO"),
        password=os.getenv("TBANK_PASSWORD", "QNX%z2q*FEAWJSVw"),
        is_test=os.getenv("TBANK_TEST_MODE", "true").lower() == "true",
        notification_url=os.getenv("TBANK_NOTIFICATION_URL"),
        success_url=os.getenv("TBANK_SUCCESS_URL", "https://app.zachet.tech/"),
        fail_url=os.getenv("TBANK_FAIL_URL", "https://app.zachet.tech/billing?status=fail"),
    )


# Синглтон провайдера
_provider: Optional[TBankPaymentProvider] = None


def get_tbank_provider() -> TBankPaymentProvider:
    """
    Получает синглтон провайдера Т-Банка.
    
    Returns:
        TBankPaymentProvider
    """
    global _provider
    if _provider is None:
        _provider = TBankPaymentProvider(get_tbank_config())
    return _provider

