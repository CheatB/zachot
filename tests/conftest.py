import pytest
import asyncio
import pytest_asyncio
from httpx import AsyncClient
from datetime import datetime, timezone
from uuid import uuid4
from apps.api.main import app
from packages.database.src.models import Base
from apps.api.database import engine, SessionLocal
from packages.core_domain import Generation, GenerationModule, GenerationStatus, Step, StepStatus

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def sample_generation():
    """
    Создаёт тестовый объект Generation для unit-тестов.
    
    Returns:
        Generation: Объект генерации в статусе DRAFT
    """
    now = datetime.now(timezone.utc)
    return Generation(
        id=uuid4(),
        user_id=uuid4(),
        module=GenerationModule.TEXT,
        work_type='referat',
        complexity_level='student',
        humanity_level='medium',
        input_payload={
            'topic': 'Test topic',
            'goal': 'Test goal',
            'idea': 'Test idea',
            'volume': 10
        },
        settings_payload={
            'structure': [],
            'sources': [],
            'formatting': {},
            'title_page': {}
        },
        status=GenerationStatus.DRAFT,
        created_at=now,
        updated_at=now
    )

@pytest.fixture
def sample_step_pending():
    """
    Создаёт тестовый объект Step в статусе PENDING.
    
    Returns:
        Step: Объект шага в статусе PENDING
    """
    return Step(
        id=uuid4(),
        generation_id=uuid4(),
        step_type='test_step',
        status=StepStatus.PENDING,
        input_payload={'test': 'data'},
        input_hash='test_hash_pending'
    )

@pytest.fixture
def sample_step_running():
    """
    Создаёт тестовый объект Step в статусе RUNNING.
    
    Returns:
        Step: Объект шага в статусе RUNNING
    """
    now = datetime.now(timezone.utc)
    return Step(
        id=uuid4(),
        generation_id=uuid4(),
        step_type='test_step',
        status=StepStatus.RUNNING,
        input_payload={'test': 'data'},
        input_hash='test_hash_running',
        started_at=now
    )

@pytest.fixture
def sample_step_finished():
    """
    Создаёт тестовый объект Step в статусе SUCCEEDED.
    
    Returns:
        Step: Объект шага в статусе SUCCEEDED
    """
    now = datetime.now(timezone.utc)
    return Step(
        id=uuid4(),
        generation_id=uuid4(),
        step_type='test_step',
        status=StepStatus.SUCCEEDED,
        input_payload={'test': 'data'},
        output_payload={'result': 'success'},
        input_hash='test_hash_finished',
        started_at=now,
        finished_at=now
    )
