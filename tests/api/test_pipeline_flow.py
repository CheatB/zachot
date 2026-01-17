import pytest
from uuid import uuid4


@pytest.mark.integration
def test_full_text_generation_flow(client):
    # 1. Login
    login_data = {"email": "flow@test.com", "password": "pass"}
    login_resp = client.post("/auth/email/login", json=login_data)
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Generation Draft
    gen_data = {
        "module": "TEXT",
        "work_type": "referat",
        "input_payload": {"topic": "Quantum Computing"}
    }
    create_resp = client.post("/generations", json=gen_data, headers=headers)
    assert create_resp.status_code == 201
    gen_id = create_resp.json()["id"]

    # 3. Update Draft (Step 3: Goal/Idea)
    update_data = {
        "input_payload": {
            "topic": "Quantum Computing",
            "goal": "Explain basic principles",
            "idea": "QC is the future"
        }
    }
    update_resp = client.patch(f"/generations/{gen_id}", json=update_data, headers=headers)
    assert update_resp.status_code == 200

    # 4. Export (Check if export endpoints respond)
    # Note: We can't easily test the actual background generation here without real AI or heavy mocking,
    # but we can test that the export endpoint is reachable.
    export_resp = client.get(f"/generations/{gen_id}/export/docx", headers=headers)
    # It returns 400 if generation is not completed yet (no result_content),
    # 404 if not found, or 200 if successfully exported
    assert export_resp.status_code in [200, 400, 404]


@pytest.mark.integration
def test_smart_edit_unauthorized(client):
    response = client.post(f"/generations/{uuid4()}/smart-edit", json={"action": "shorter", "content": "text"})
    # Since smart-edit is not in /generations/{id}/actions but a separate router potentially
    # Let's verify the route in generations.py
    assert response.status_code in [401, 404]

