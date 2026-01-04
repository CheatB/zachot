"""
Фикстуры для тестов domain layer.
"""

import pytest
from datetime import datetime
from uuid import uuid4

from packages.core_domain import (
    Generation,
    Step,
    Artifact,
    GenerationModule,
    GenerationStatus,
    StepStatus,
    ArtifactType,
    calculate_input_hash,
)


@pytest.fixture
def sample_generation():
    """Создаёт тестовую Generation в статусе DRAFT."""
    return Generation(
        id=uuid4(),
        user_id=uuid4(),
        module=GenerationModule.TEXT,
        status=GenerationStatus.DRAFT,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        input_payload={"topic": "Python basics"},
    )


@pytest.fixture
def sample_step_pending():
    """Создаёт тестовый Step в статусе PENDING."""
    return Step(
        id=uuid4(),
        generation_id=uuid4(),
        step_type="test_step",
        status=StepStatus.PENDING,
        input_payload={"test": "data"},
        input_hash=calculate_input_hash({"test": "data"}),
    )


@pytest.fixture
def sample_step_running():
    """Создаёт тестовый Step в статусе RUNNING."""
    return Step(
        id=uuid4(),
        generation_id=uuid4(),
        step_type="test_step",
        status=StepStatus.RUNNING,
        input_payload={"test": "data"},
        input_hash=calculate_input_hash({"test": "data"}),
        started_at=datetime.now(),
        progress=50,
    )


@pytest.fixture
def sample_artifact():
    """Создаёт тестовый Artifact."""
    return Artifact(
        id=uuid4(),
        generation_id=uuid4(),
        artifact_type=ArtifactType.TEXT_DOC,
        version=1,
        content="Test content",
        created_at=datetime.now(),
    )



