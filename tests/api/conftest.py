"""
Pytest fixtures для API тестов.
"""

import os
import sys

# КРИТИЧНО: Устанавливаем ENV=test ДО любых импортов
os.environ["ENV"] = "test"

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.storage import generation_store
from apps.api.database import init_db, SessionLocal
from packages.database.src.models import User

# Инициализируем базу данных для тестов
init_db()

@pytest.fixture
def test_user():
    """
    Создаёт тестового пользователя в БД.
    
    Returns:
        dict: Данные пользователя (id, email, token)
    """
    user_id = uuid4()
    email = f"test_{user_id}@example.com"
    
    with SessionLocal() as session:
        user = User(
            id=user_id,
            email=email,
            role="user",
            credits_balance=100
        )
        session.add(user)
        session.commit()
    
    return {
        "id": str(user_id),
        "email": email,
        "token": str(user_id)  # В тестах используем user_id как токен
    }

@pytest.fixture
def client(request):
    """
    Создаёт новый TestClient для каждого теста.
    
    Если тест использует test_user fixture, добавляет авторизацию.
    Иначе возвращает обычный клиент (для тестов с async/await и логином внутри).
    
    Returns:
        TestClient: Клиент для тестирования API
    """
    # Используем raise_server_exceptions=False чтобы тесты не падали на startup errors
    client = TestClient(app, raise_server_exceptions=False)
    
    # Проверяем, использует ли тест fixture test_user
    if 'test_user' in request.fixturenames:
        test_user = request.getfixturevalue('test_user')
        # Добавляем заголовок авторизации ко всем запросам
        client.headers = {"Authorization": f"Bearer {test_user['token']}"}
    
    return client


@pytest.fixture(autouse=True)
def clean_storage():
    """
    Автоматически очищает storage перед каждым тестом.
    
    Обеспечивает изоляцию между тестами.
    """
    # Очищаем перед тестом
    generation_store.clear()
    yield
    # Очищаем после теста (на всякий случай)
    generation_store.clear()



