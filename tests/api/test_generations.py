import pytest
from uuid import uuid4

@pytest.mark.asyncio
async def test_create_generation_and_list(client):
    # 1. Login to get a real user
    login_data = {"email": "gen@test.com", "password": "pass"}
    login_resp = await client.post("/auth/email/login", json=login_data)
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a generation
    gen_data = {
        "module": "TEXT",
        "work_type": "referat",
        "input_payload": {"topic": "AI in medicine"}
    }
    create_resp = await client.post("/generations", json=gen_data, headers=headers)
    assert create_resp.status_code == 201
    gen_id = create_resp.json()["id"]

    # 3. List generations
    list_resp = await client.get("/generations", headers=headers)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert any(item["id"] == gen_id for item in items)

@pytest.mark.asyncio
async def test_generation_actions(client):
    login_data = {"email": "gen2@test.com", "password": "pass"}
    login_resp = await client.post("/auth/email/login", json=login_data)
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create draft
    gen_data = {
        "module": "TEXT",
        "input_payload": {"topic": "Physics"}
    }
    create_resp = await client.post("/generations", json=gen_data, headers=headers)
    gen_id = create_resp.json()["id"]

    # Action: next (to RUNNING)
    action_data = {"action": "next"}
    action_resp = await client.post(f"/generations/{gen_id}/actions", json=action_data, headers=headers)
    assert action_resp.status_code == 200
    assert action_resp.json()["status"] == "RUNNING"

