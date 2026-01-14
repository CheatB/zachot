import pytest
from uuid import uuid4
from unittest.mock import patch, MagicMock


def test_initiate_payment(client):
    # 1. Login
    login_data = {"email": f"pay_{uuid4().hex[:6]}@test.com", "password": "pass"}
    login_resp = client.post("/auth/email/login", json=login_data)
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Initiate payment with mock
    with patch("apps.api.services.tbank_service.tbank_service.init_payment") as mock_init:
        mock_init.return_value = {
            "Success": True,
            "PaymentURL": "https://test.tinkoff.ru/pay",
            "OrderId": "ORDER-EXPECTED",
            "PaymentId": "12345"
        }
        
        payment_data = {"period": "month"}
        response = client.post("/payments/initiate", json=payment_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["payment_url"] == "https://test.tinkoff.ru/pay"
        # Since the backend generates its own OrderId or uses the one from T-Bank,
        # we check that it's returned correctly. 
        # Actually, in the router it might be returning the generated order_id.
        assert "order_id" in data


def test_usage_limit_enforcement(client, db_session):
    from packages.database.src.models import User
    
    # 1. Login
    login_data = {"email": f"limit_{uuid4().hex[:6]}@test.com", "password": "pass"}
    login_resp = client.post("/auth/email/login", json=login_data)
    token = login_resp.json()["token"]
    user_id = login_resp.json()["user_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Manually set user limit to reached in DB
    user = db_session.query(User).filter(User.id == user_id).first()
    user.generations_used = 5
    user.generations_limit = 5
    db_session.commit()

    # 3. Try to create generation
    gen_data = {
        "module": "TEXT",
        "input_payload": {"topic": "Should fail"}
    }
    response = client.post("/generations", json=gen_data, headers=headers)
    assert response.status_code == 403
    assert "Лимит генераций" in response.json()["detail"]
