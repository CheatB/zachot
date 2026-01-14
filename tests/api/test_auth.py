import pytest
from uuid import UUID


def test_email_login_and_me(client):
    # 1. Login/Register
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    response = client.post("/auth/email/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    token = data["token"]
    user_id = data["user_id"]

    # 2. Check /me
    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get("/me", headers=headers)
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["id"] == user_id
    assert me_data["email"] == "test@example.com"


def test_me_unauthorized(client):
    response = client.get("/me")
    assert response.status_code == 401


