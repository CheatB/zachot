from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, JSON, TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import sessionmaker, relationship, declarative_base

Base = declarative_base()

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
    role = Column(String, default="user") # 'admin' or 'user'
    plan_name = Column(String, default="BASE 499")
    subscription_status = Column(String, default="active")
    monthly_price_rub = Column(Integer, default=499)
    next_billing_date = Column(DateTime, default=datetime.utcnow)
    
    generations_used = Column(Integer, default=0)
    generations_limit = Column(Integer, default=5)
    tokens_used = Column(Integer, default=0)
    tokens_limit = Column(Integer, default=100000)
    fair_use_mode = Column(String, default="normal") # 'normal', 'degraded', 'strict'
    
    telegram_id = Column(String, unique=True, index=True, nullable=True)
    telegram_username = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    
    generations = relationship("Generation", back_populates="user")

class Generation(Base):
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

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(GUID(), primary_key=True, default=uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"))
    amount = Column(Integer) # в копейках
    status = Column(String, default="NEW") # NEW, AUTHORIZED, CONFIRMED, REJECTED
    payment_id = Column(String, nullable=True) # ID из Т-Банка
    order_id = Column(String, unique=True)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User")

class AuthToken(Base):
    __tablename__ = "auth_tokens"
    
    token = Column(String, primary_key=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_used = Column(Integer, default=0) # 0 - no, 1 - yes
    
    user = relationship("User")

def create_db_engine(db_url: str):
    engine_args = {}
    if db_url.startswith("sqlite"):
        engine_args["connect_args"] = {"check_same_thread": False}
    return create_engine(db_url, **engine_args)

def get_session_factory(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
