import pytest
from packages.core_domain.state_machine import GenerationStateMachine
from packages.core_domain.enums import GenerationStatus
from packages.core_domain import Generation
from uuid import uuid4
from datetime import datetime

def test_generation_status_transitions():
    gen_id = uuid4()
    user_id = uuid4()
    gen = Generation(
        id=gen_id,
        user_id=user_id,
        module="TEXT",
        status=GenerationStatus.DRAFT,
        title="Test",
        created_at=datetime.now(),
        updated_at=datetime.now(),
        input_payload={},
        settings_payload={}
    )
    
    # Valid transition
    updated = GenerationStateMachine.transition(gen, GenerationStatus.RUNNING)
    assert updated.status == GenerationStatus.RUNNING
    
    # Invalid transition (DRAFT -> COMPLETED directly should fail if logic dictates)
    # Note: Adjust based on real state machine rules
    with pytest.raises(Exception):
        GenerationStateMachine.transition(gen, GenerationStatus.COMPLETED)

