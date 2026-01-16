import pytest
from uuid import uuid4


@pytest.mark.integration
def test_admin_model_routing(client):
    # 1. Login as normal user (should fail admin access)
    email = f"user_{uuid4().hex[:6]}@test.com"
    login_data = {"email": email, "password": "pass"}
    login_resp = client.post("/auth/email/login", json=login_data)
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    routing_resp = client.get("/admin/model-routing", headers=headers)
    assert routing_resp.status_code == 403


@pytest.mark.integration
def test_admin_user_role_update(client, db_session):
    from packages.database.src.models import User
    
    # 1. Create an admin user manually
    admin_id = uuid4()
    admin_user = User(id=admin_id, email=f"admin_{admin_id.hex[:6]}@test.com", role="admin")
    db_session.add(admin_user)
    db_session.commit()
    
    headers = {"Authorization": f"Bearer {admin_id}"}

    # 2. Create a normal user to update
    user_id = uuid4()
    user = User(id=user_id, email=f"user_{user_id.hex[:6]}@test.com", role="user")
    db_session.add(user)
    db_session.commit()

    # 3. Update role
    update_data = {"role": "admin"}
    response = client.patch(f"/admin/users/{user_id}/role", json=update_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["role"] == "admin"

    # Verify in DB
    db_session.refresh(user)
    assert user.role == "admin"


@pytest.mark.integration
def test_suggest_details_logic(client):
    login_data = {"email": f"user_{uuid4().hex[:6]}@test.com", "password": "pass"}
    login_resp = client.post("/auth/email/login", json=login_data)
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test suggest details (this will trigger our Mistral fallback if GPT-4o fails)
    data = {"topic": "Photosynthesis"}
    resp = client.post("/admin/suggest-details", json=data, headers=headers)
    assert resp.status_code == 200
    json_data = resp.json()
    assert "goal" in json_data
    assert "idea" in json_data
