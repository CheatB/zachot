from .settings import settings
from packages.database.src.models import (
    Base, 
    User, 
    Generation as GenerationDB, 
    Payment as PaymentDB, 
    AuthToken as AuthTokenDB,
    CreditTransaction,
    Subscription,
    AuditLog,
    create_db_engine, 
    get_session_factory, 
    GUID
)

# Database initialization
db_url = settings.database_url
if settings.env == "test":
    db_url = "sqlite:///./test.db"

engine = create_db_engine(db_url)
SessionLocal = get_session_factory(engine)

def get_db():
    """Dependency для получения сессии БД."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
