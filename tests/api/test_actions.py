import pytest
"""
Contract tests для Generation actions endpoints.
"""

from uuid import uuid4

from fastapi import status


@pytest.mark.integration
def test_actions_next_transitions_to_running(client, test_user):
    """
    Тест действия next: проверка перехода из DRAFT в RUNNING.
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
    
    # Выполняем действие next
    response = client.post(
        f"/generations/{generation_id}/actions",
        json={"action": "next"},
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["status"] == "RUNNING"
    assert data["id"] == generation_id


@pytest.mark.integration
def test_actions_invalid_transition_returns_409(client, test_user):
    """
    Тест недопустимого перехода: проверка статуса 409.
    
    Пытаемся выполнить next дважды (DRAFT → RUNNING → RUNNING недопустимо).
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
    
    # Первый next (DRAFT → RUNNING)
    first_response = client.post(
        f"/generations/{generation_id}/actions",
        json={"action": "next"},
    )
    assert first_response.status_code == status.HTTP_200_OK
    assert first_response.json()["status"] == "RUNNING"
    
    # Второй next (RUNNING → RUNNING недопустимо)
    second_response = client.post(
        f"/generations/{generation_id}/actions",
        json={"action": "next"},
    )
    
    assert second_response.status_code == status.HTTP_409_CONFLICT
    detail = second_response.json()["detail"].lower()
    # Проверяем, что в сообщении об ошибке есть информация о недопустимом действии
    assert "draft" in detail or "status" in detail or "cannot" in detail


@pytest.mark.integration
def test_actions_cancel_transitions_to_canceled(client, test_user):
    """
    Тест действия cancel: проверка перехода в CANCELED из любого статуса.
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
    next_response = client.post(
        f"/generations/{generation_id}/actions",
        json={"action": "next"},
    )
    assert next_response.status_code == status.HTTP_200_OK
    assert next_response.json()["status"] == "RUNNING"
    
    # Выполняем cancel
    cancel_response = client.post(
        f"/generations/{generation_id}/actions",
        json={"action": "cancel"},
    )
    
    assert cancel_response.status_code == status.HTTP_200_OK
    
    data = cancel_response.json()
    assert data["status"] == "CANCELED"
    assert data["id"] == generation_id

