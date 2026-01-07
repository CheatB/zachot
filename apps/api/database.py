from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, JSON, TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from .settings import settings

Base = declarative_base()

# Универсальный тип UUID для PostgreSQL и SQLite
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(32), storing as string without dashes.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, UUID):
                return "%.32x" % UUID(value).int
            else:
                return "%.32x" % value.int

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, UUID):
                return UUID(value)
            else:
                return value

class User(Base):
    __tablename__ = "users"
    
    id = Column(GUID(), primary_key=True, default=uuid4)
    email = Column(String, unique=True, index=True)
    plan_name = Column(String, default="BASE 499")
    subscription_status = Column(String, default="active")
    monthly_price_rub = Column(Integer, default=499)
    next_billing_date = Column(DateTime, default=datetime.utcnow)
    
    generations_used = Column(Integer, default=0)
    generations_limit = Column(Integer, default=5)
    tokens_used = Column(Integer, default=0)
    tokens_limit = Column(Integer, default=100000)
    
    generations = relationship("GenerationDB", back_populates="user")

class GenerationDB(Base):
    __tablename__ = "generations"
    
    id = Column(GUID(), primary_key=True, default=uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"))
    module = Column(String)
    status = Column(String)
    title = Column(String, nullable=True)
    work_type = Column(String, nullable=True)
    complexity_level = Column(String, default="student")
    humanity_level = Column(Integer, default=50)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    input_payload = Column(JSON)
    settings_payload = Column(JSON)
    result_content = Column(String, nullable=True)
    
    user = relationship("User", back_populates="generations")

# Database initialization
db_url = settings.database_url
if settings.env == "test":
    db_url = "sqlite:///./test.db"

# Для SQLite нужно разрешить threading
engine_args = {}
if db_url.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(db_url, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

