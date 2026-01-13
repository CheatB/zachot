"""
Тесты для TBankPaymentProvider.

Проверяет:
- Генерацию токена подписи
- Инициализацию платежей
- Верификацию webhooks
- Рекуррентные списания
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import hashlib

from packages.billing.tbank_provider import (
    TBankConfig,
    TBankPaymentProvider,
    TBankInitResponse,
)


@pytest.fixture
def config():
    """Тестовая конфигурация."""
    return TBankConfig(
        terminal_key="1768061897408DEMO",
        password="QNX%z2q*FEAWJSVw",
        is_test=True,
        success_url="https://app.zachet.tech/",
        fail_url="https://app.zachet.tech/billing?status=fail",
    )


@pytest.fixture
def provider(config):
    """Тестовый провайдер."""
    return TBankPaymentProvider(config)


class TestTokenGeneration:
    """Тесты генерации токена подписи."""
    
    def test_token_generation_basic(self, provider):
        """Токен генерируется из отсортированных параметров."""
        params = {
            "TerminalKey": "1768061897408DEMO",
            "Amount": 49900,
            "OrderId": "ORDER-123",
        }
        
        token = provider._generate_token(params)
        
        # Токен должен быть 64-символьный hex (SHA-256)
        assert len(token) == 64
        assert all(c in "0123456789abcdef" for c in token)
    
    def test_token_generation_deterministic(self, provider):
        """Один и тот же набор параметров даёт один токен."""
        params = {
            "TerminalKey": "1768061897408DEMO",
            "Amount": 49900,
            "OrderId": "ORDER-123",
        }
        
        token1 = provider._generate_token(params)
        token2 = provider._generate_token(params)
        
        assert token1 == token2
    
    def test_token_excludes_nested_objects(self, provider):
        """Вложенные объекты (Receipt, DATA) исключаются из подписи."""
        params = {
            "TerminalKey": "1768061897408DEMO",
            "Amount": 49900,
            "OrderId": "ORDER-123",
            "Receipt": {"Email": "test@test.com"},  # Должно быть исключено
        }
        
        params_without_receipt = {
            "TerminalKey": "1768061897408DEMO",
            "Amount": 49900,
            "OrderId": "ORDER-123",
        }
        
        token_with = provider._generate_token(params)
        token_without = provider._generate_token(params_without_receipt)
        
        assert token_with == token_without


class TestInitPayment:
    """Тесты инициализации платежа."""
    
    @pytest.mark.asyncio
    async def test_init_payment_success(self, provider):
        """Успешная инициализация платежа."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "Success": True,
            "ErrorCode": "0",
            "PaymentId": "12345",
            "PaymentURL": "https://test.tinkoff.ru/pay/12345",
            "OrderId": "ORDER-123",
            "Amount": 49900,
            "Status": "NEW",
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(provider._client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await provider.init_payment(
                order_id="ORDER-123",
                amount=49900,
                description="Тестовый платёж",
                customer_key="user-123",
                recurrent=True,
                email="test@test.com",
            )
        
        assert result.Success is True
        assert result.PaymentId == "12345"
        assert result.PaymentURL == "https://test.tinkoff.ru/pay/12345"
    
    @pytest.mark.asyncio
    async def test_init_payment_failure(self, provider):
        """Ошибка при инициализации платежа."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "Success": False,
            "ErrorCode": "99",
            "Message": "Terminal not found",
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(provider._client, 'post', new_callable=AsyncMock, return_value=mock_response):
            with pytest.raises(RuntimeError) as exc_info:
                await provider.init_payment(
                    order_id="ORDER-123",
                    amount=49900,
                    description="Тестовый платёж",
                )
        
        assert "Terminal not found" in str(exc_info.value)


class TestVerifyNotification:
    """Тесты верификации webhooks."""
    
    def test_verify_valid_notification(self, provider):
        """Валидное уведомление проходит проверку."""
        # Создаём данные уведомления
        data = {
            "TerminalKey": "1768061897408DEMO",
            "OrderId": "ORDER-123",
            "Success": True,
            "Status": "CONFIRMED",
            "PaymentId": "12345",
            "Amount": 49900,
        }
        
        # Генерируем правильный токен
        data["Token"] = provider._generate_token(data)
        
        assert provider.verify_notification(data) is True
    
    def test_verify_invalid_notification(self, provider):
        """Невалидное уведомление не проходит проверку."""
        data = {
            "TerminalKey": "1768061897408DEMO",
            "OrderId": "ORDER-123",
            "Success": True,
            "Status": "CONFIRMED",
            "PaymentId": "12345",
            "Amount": 49900,
            "Token": "invalid_token_12345",
        }
        
        assert provider.verify_notification(data) is False
    
    def test_verify_missing_token(self, provider):
        """Уведомление без токена не проходит проверку."""
        data = {
            "TerminalKey": "1768061897408DEMO",
            "OrderId": "ORDER-123",
            "Success": True,
        }
        
        assert provider.verify_notification(data) is False


class TestCharge:
    """Тесты рекуррентного списания."""
    
    @pytest.mark.asyncio
    async def test_charge_success(self, provider):
        """Успешное рекуррентное списание."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "Success": True,
            "ErrorCode": "0",
            "PaymentId": "67890",
            "Status": "CONFIRMED",
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(provider._client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await provider.charge(
                payment_id="12345",
                rebill_id="rebill_abc123",
                email="test@test.com",
            )
        
        assert result.Success is True
        assert result.PaymentId == "67890"


class TestGetState:
    """Тесты получения статуса платежа."""
    
    @pytest.mark.asyncio
    async def test_get_state(self, provider):
        """Получение статуса платежа."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "Success": True,
            "ErrorCode": "0",
            "TerminalKey": "1768061897408DEMO",
            "Status": "CONFIRMED",
            "PaymentId": "12345",
            "OrderId": "ORDER-123",
            "Amount": 49900,
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(provider._client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await provider.get_state("12345")
        
        assert result["Status"] == "CONFIRMED"
        assert result["PaymentId"] == "12345"

