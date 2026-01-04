"""
Contract tests для Generation endpoints.
"""

from uuid import uuid4

from fastapi import status

from packages.core_domain.enums import GenerationModule, GenerationStatus


def test_create_generation_201_and_shape(client):
    """
    Тест создания Generation: проверка статуса 201 и структуры ответа.
    """
    response = client.post(
        "/generations",
        json={
            "module": "TEXT",
            "input_payload": {"topic": "Python basics"},
            "settings_payload": {"level": "beginner"},
        },
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    
    # Проверяем структуру ответа
    assert "id" in data
    assert "module" in data
    assert "status" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "input_payload" in data
    assert "settings_payload" in data
    
    # Проверяем значения
    assert data["module"] == "TEXT"
    assert data["status"] == "DRAFT"
    assert data["input_payload"] == {"topic": "Python basics"}
    assert data["settings_payload"] == {"level": "beginner"}


def test_get_generation_200(client):
    """
    Тест получения Generation: проверка статуса 200 и данных.
    """
    # Создаём Generation
    create_response = client.post(
        "/generations",
        json={
            "module": "PRESENTATION",
            "input_payload": {"topic": "AI"},
        },
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    generation_id = create_response.json()["id"]
    
    # Получаем Generation
    response = client.get(f"/generations/{generation_id}")
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["id"] == generation_id
    assert data["module"] == "PRESENTATION"
    assert data["status"] == "DRAFT"


def test_get_generation_404(client):
    """
    Тест получения несуществующей Generation: проверка статуса 404.
    """
    non_existent_id = str(uuid4())
    
    response = client.get(f"/generations/{non_existent_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


def test_patch_generation_updates_payload(client):
    """
    Тест обновления Generation: проверка обновления input_payload и settings_payload.
    """
    # Создаём Generation
    create_response = client.post(
        "/generations",
        json={
            "module": "TEXT",
            "input_payload": {"topic": "Python"},
            "settings_payload": {"level": "beginner"},
        },
    )
    generation_id = create_response.json()["id"]
    
    # Обновляем Generation
    response = client.patch(
        f"/generations/{generation_id}",
        json={
            "input_payload": {"topic": "Advanced Python"},
            "settings_payload": {"level": "advanced"},
        },
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["input_payload"] == {"topic": "Advanced Python"}
    assert data["settings_payload"] == {"level": "advanced"}
    assert data["status"] == "DRAFT"  # Статус не должен измениться


def test_patch_generation_409_when_not_draft(client):
    """
    Тест обновления Generation в статусе не DRAFT: проверка статуса 409.
    
    Сначала переводим Generation в RUNNING через actions/next.
    """
    # Создаём Generation
    create_response = client.post(
        "/generations",
        json={
            "module": "TEXT",
            "input_payload": {"topic": "Python"},
        },
    )
    generation_id = create_response.json()["id"]
    
    # Переводим в RUNNING
    action_response = client.post(
        f"/generations/{generation_id}/actions",
        json={"action": "next"},
    )
    assert action_response.status_code == status.HTTP_200_OK
    assert action_response.json()["status"] == "RUNNING"
    
    # Пытаемся обновить (должно вернуть 409)
    response = client.patch(
        f"/generations/{generation_id}",
        json={
            "input_payload": {"topic": "Updated"},
        },
    )
    
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "draft" in response.json()["detail"].lower()



