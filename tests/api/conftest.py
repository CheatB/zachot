"""
Pytest fixtures для API тестов.
"""

import os
import pytest

# Устанавливаем окружение для тестов ПЕРЕД импортом приложения
os.environ["ENV"] = "test"

from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.storage import generation_store
from apps.api.database import init_db

# Инициализируем базу данных для тестов
init_db()

@pytest.fixture
def client():
    """
    Создаёт новый TestClient для каждого теста.
    
    Yields:
        TestClient: Клиент для тестирования API
    """
    return TestClient(app)


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



