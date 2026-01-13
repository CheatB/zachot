"""
Тесты для PaymentService.

Проверяет:
- Инициализацию платежей
- Обработку webhooks
- Активацию подписок
- Рекуррентные платежи
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from uuid import uuid4

from apps.api.services.payment_service import PaymentService, PLANS
from packages.database.src.models import Payment, Subscription, User


@pytest.fixture
def mock_db():
    """Мок сессии БД."""
    return MagicMock()


@pytest.fixture
def mock_provider():
    """Мок провайдера платежей."""
    provider = MagicMock()
    provider.init_payment = AsyncMock()
    provider.charge = AsyncMock()
    provider.verify_notification = MagicMock(return_value=True)
    return provider


@pytest.fixture
def service(mock_db, mock_provider):
    """Сервис платежей с моками."""
    return PaymentService(mock_db, mock_provider)


class TestInitiatePayment:
    """Тесты инициализации платежа."""
    
    @pytest.mark.asyncio
    async def test_initiate_payment_month(self, service, mock_db, mock_provider):
        """Инициализация месячного платежа."""
        user_id = uuid4()
        
        # Настраиваем мок пользователя
        mock_user = MagicMock()
        mock_user.email = "test@example.com"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Настраиваем мок провайдера
        mock_provider.init_payment.return_value = MagicMock(
            Success=True,
            PaymentId="12345",
            PaymentURL="https://test.tinkoff.ru/pay/12345",
            Status="NEW",
        )
        
        result = await service.initiate_payment(user_id, "month")
        
        # Проверяем результат
        assert "payment_url" in result
        assert "order_id" in result
        assert result["payment_url"] == "https://test.tinkoff.ru/pay/12345"
        
        # Проверяем вызов провайдера
        mock_provider.init_payment.assert_called_once()
        call_args = mock_provider.init_payment.call_args
        assert call_args.kwargs["amount"] == 49900
        assert call_args.kwargs["recurrent"] is True
    
    @pytest.mark.asyncio
    async def test_initiate_payment_year(self, service, mock_db, mock_provider):
        """Инициализация годового платежа."""
        user_id = uuid4()
        
        mock_user = MagicMock()
        mock_user.email = "test@example.com"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        mock_provider.init_payment.return_value = MagicMock(
            Success=True,
            PaymentId="12345",
            PaymentURL="https://test.tinkoff.ru/pay/12345",
            Status="NEW",
        )
        
        result = await service.initiate_payment(user_id, "year")
        
        # Проверяем сумму годового плана
        call_args = mock_provider.init_payment.call_args
        assert call_args.kwargs["amount"] == 508800  # 5088 руб


class TestProcessNotification:
    """Тесты обработки webhooks."""
    
    @pytest.mark.asyncio
    async def test_process_confirmed_payment(self, service, mock_db, mock_provider):
        """Обработка подтверждённого платежа."""
        # Настраиваем мок платежа
        mock_payment = MagicMock()
        mock_payment.id = uuid4()
        mock_payment.user_id = uuid4()
        mock_payment.period = "month"
        mock_payment.status = "NEW"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_payment
        
        # Настраиваем мок пользователя
        mock_user = MagicMock()
        mock_user.id = mock_payment.user_id
        
        # Данные уведомления
        data = {
            "OrderId": "ORDER-123",
            "Status": "CONFIRMED",
            "PaymentId": "12345",
            "RebillId": "rebill_abc",
            "Token": "valid_token",
        }
        
        result = await service.process_notification(data)
        
        assert result is True
        assert mock_payment.status == "CONFIRMED"
        assert mock_payment.rebill_id == "rebill_abc"
    
    @pytest.mark.asyncio
    async def test_process_invalid_signature(self, service, mock_db, mock_provider):
        """Отклонение уведомления с неверной подписью."""
        mock_provider.verify_notification.return_value = False
        
        data = {
            "OrderId": "ORDER-123",
            "Status": "CONFIRMED",
            "Token": "invalid_token",
        }
        
        result = await service.process_notification(data)
        
        assert result is False


class TestPlans:
    """Тесты конфигурации планов."""
    
    def test_month_plan(self):
        """Проверка месячного плана."""
        plan = PLANS["month"]
        assert plan["amount"] == 49900
        assert plan["period_months"] == 1
        assert plan["generations_limit"] == 5
    
    def test_quarter_plan(self):
        """Проверка квартального плана."""
        plan = PLANS["quarter"]
        assert plan["amount"] == 134700
        assert plan["period_months"] == 3
        assert plan["generations_limit"] == 15
    
    def test_year_plan(self):
        """Проверка годового плана."""
        plan = PLANS["year"]
        assert plan["amount"] == 508800
        assert plan["period_months"] == 12
        assert plan["generations_limit"] == 60
    
    def test_all_plans_have_required_fields(self):
        """Все планы имеют обязательные поля."""
        required_fields = ["name", "description", "amount", "period_months", "generations_limit", "tokens_limit"]
        
        for period, plan in PLANS.items():
            for field in required_fields:
                assert field in plan, f"Plan {period} missing field: {field}"

