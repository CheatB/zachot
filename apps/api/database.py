from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from .settings import settings

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
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
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"))
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
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

