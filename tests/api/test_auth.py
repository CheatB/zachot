import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.database import SessionLocal, AuthTokenDB

@pytest.fixture
def client():
    return TestClient(app)

def test_get_telegram_link(client):
    """
    Тест получения ссылки для авторизации через Telegram.
    """
    response = client.post("/auth/telegram/link")
    assert response.status_code == 200
    data = response.json()
    assert "link" in data
    assert "token" in data
    assert "t.me/zachot_tech_bot?start=" in data["link"]
    
    # Проверяем, что токен сохранился в базе
    with SessionLocal() as session:
        token = session.query(AuthTokenDB).filter(AuthTokenDB.token == data["token"]).first()
        assert token is not None
        assert token.is_used == 0

def test_check_telegram_auth_pending(client):
    """
    Тест проверки статуса авторизации (ожидание).
    """
    # Сначала создаем токен
    response = client.post("/auth/telegram/link")
    token = response.json()["token"]
    
    # Проверяем статус
    response = client.get(f"/auth/telegram/check/{token}")
    assert response.status_code == 200
    assert response.json()["status"] == "pending"

def test_check_telegram_auth_not_found(client):
    """
    Тест проверки несуществующего токена.
    """
    response = client.get("/auth/telegram/check/non_existent_token")
    assert response.status_code == 404

