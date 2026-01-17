"""
Тесты для системы кредитов и покупки пакетов
"""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.database import SessionLocal, User as UserDB
from packages.database.src.models import Generation, Payment, CreditTransaction
from datetime import datetime


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db_session):
    """Создает тестового пользователя"""
    user = UserDB(
        id=uuid4(),
        email="test@example.com",
        telegram_username="testuser",
        role="user",
        credits_balance=10,
        subscription_status="active"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session):
    """Создает админа"""
    user = UserDB(
        id=uuid4(),
        email="admin@example.com",
        telegram_username="admin",
        role="admin",
        credits_balance=100
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_get_credit_packages(client):
    """Тест получения списка пакетов кредитов"""
    response = client.get("/credits/packages")
    assert response.status_code == 200
    
    packages = response.json()
    assert len(packages) == 3
    
    # Проверяем структуру пакетов
    for package in packages:
        assert "id" in package
        assert "credits" in package
        assert "price_rub" in package
        assert "description" in package
        assert "is_perpetual" in package
        assert package["is_perpetual"] is True


def test_purchase_credits_unauthorized(client):
    """Тест покупки кредитов без авторизации"""
    response = client.post(
        "/credits/purchase",
        json={"package_id": "credits_5"}
    )
    assert response.status_code == 401


def test_purchase_credits_success(client, test_user):
    """Тест успешной инициации покупки кредитов"""
    # Пропускаем тест, т.к. требует интеграцию с платежной системой
    pytest.skip("Requires payment gateway integration")


def test_purchase_credits_invalid_package(client, test_user):
    """Тест покупки с несуществующим пакетом"""
    # Пропускаем тест, т.к. требует интеграцию с платежной системой
    pytest.skip("Requires payment gateway integration")


def test_generation_cost_endpoint(client, test_user, db_session):
    """Тест получения стоимости генерации"""
    pytest.skip("Requires generation service integration")


def test_confirm_generation_insufficient_credits(client, test_user, db_session):
    """Тест подтверждения генерации с недостаточным балансом"""
    pytest.skip("Requires generation service integration")


def test_confirm_generation_success(client, test_user, db_session):
    """Тест успешного подтверждения генерации"""
    pytest.skip("Requires generation service integration")


def test_payment_notification_credits(client, test_user, db_session):
    """Тест обработки уведомления об оплате кредитов"""
    pytest.skip("Requires payment service integration")


def test_credit_transaction_history(client, test_user, db_session):
    """Тест истории транзакций кредитов"""
    # Создаем несколько транзакций
    transactions = [
        CreditTransaction(
            id=uuid4(),
            user_id=test_user.id,
            amount=10,
            balance_after=20,
            transaction_type="PURCHASE",
            created_at=datetime.utcnow()
        ),
        CreditTransaction(
            id=uuid4(),
            user_id=test_user.id,
            amount=-5,
            balance_after=15,
            transaction_type="GENERATION",
            created_at=datetime.utcnow()
        )
    ]
    
    for transaction in transactions:
        db_session.add(transaction)
    db_session.commit()
    
    # Проверяем что транзакции сохранены
    saved_transactions = db_session.query(CreditTransaction).filter(
        CreditTransaction.user_id == test_user.id
    ).all()
    
    assert len(saved_transactions) >= 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
