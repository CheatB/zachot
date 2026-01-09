from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, CHAR, TypeDecorator
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
import os

Base = declarative_base()

class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True
    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(CHAR(32))
    def process_bind_param(self, value, dialect):
        if value is None: return value
        return "%.32x" % UUID(value).int
    def process_result_value(self, value, dialect):
        if value is None: return value
        return UUID(value)

class User(Base):
    __tablename__ = "users"
    id = Column(GUID(), primary_key=True, default=uuid4)
    email = Column(String, unique=True, index=True)
    telegram_id = Column(String, unique=True, index=True, nullable=True)
    telegram_username = Column(String, nullable=True)
    generations_used = Column(Integer, default=0)
    generations_limit = Column(Integer, default=5)

class AuthToken(Base):
    __tablename__ = "auth_tokens"
    token = Column(String, primary_key=True)
    user_id = Column(GUID(), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_used = Column(Integer, default=0)
    user = relationship("User")

engine = create_engine(os.getenv("DATABASE_URL", "postgresql://marka:marka_pass@localhost:5433/zachot"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

