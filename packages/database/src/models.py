from datetime import datetime
from uuid import UUID, uuid4
from typing import List, Optional
from sqlalchemy import create_engine, String, Integer, DateTime, ForeignKey, JSON, TypeDecorator, CHAR, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import sessionmaker, relationship, DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

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
    
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    role: Mapped[str] = mapped_column(String, default="user") # 'admin' or 'user'
    plan_name: Mapped[str] = mapped_column(String, default="BASE 499")
    subscription_status: Mapped[str] = mapped_column(String, default="active")
    monthly_price_rub: Mapped[int] = mapped_column(Integer, default=499)
    next_billing_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Система кредитов
    credits_balance: Mapped[int] = mapped_column(Integer, default=5)
    credits_used: Mapped[int] = mapped_column(Integer, default=0)
    
    # Legacy поля
    generations_used: Mapped[int] = mapped_column(Integer, default=0)
    generations_limit: Mapped[int] = mapped_column(Integer, default=5)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    tokens_limit: Mapped[int] = mapped_column(Integer, default=100000)
    fair_use_mode: Mapped[str] = mapped_column(String, default="normal")
    
    telegram_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    telegram_username: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    generations: Mapped[List["Generation"]] = relationship("Generation", back_populates="user")
    credit_transactions: Mapped[List["CreditTransaction"]] = relationship("CreditTransaction", back_populates="user")

class Generation(Base):
    __tablename__ = "generations"
    
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"))
    module: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    work_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    complexity_level: Mapped[str] = mapped_column(String, default="student")
    humanity_level: Mapped[int] = mapped_column(Integer, default=50)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    input_payload: Mapped[dict] = mapped_column(JSON)
    settings_payload: Mapped[dict] = mapped_column(JSON)
    result_content: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    usage_metadata: Mapped[list] = mapped_column(JSON, default=list)
    
    user: Mapped["User"] = relationship("User", back_populates="generations")

class Payment(Base):
    __tablename__ = "payments"
    
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"))
    amount: Mapped[int] = mapped_column(Integer) # в копейках
    status: Mapped[str] = mapped_column(String, default="NEW")
    payment_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    order_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    description: Mapped[str] = mapped_column(String)
    
    period: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    rebill_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    recurrent_parent_id: Mapped[Optional[UUID]] = mapped_column(GUID(), ForeignKey("payments.id"), nullable=True)
    is_recurrent: Mapped[int] = mapped_column(Integer, default=0)
    
    customer_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    customer_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    user: Mapped["User"] = relationship("User")
    recurrent_parent: Mapped[Optional["Payment"]] = relationship("Payment", remote_side=[id], backref="child_payments")

class AuthToken(Base):
    __tablename__ = "auth_tokens"
    
    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[Optional[UUID]] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_used: Mapped[int] = mapped_column(Integer, default=0)
    
    user: Mapped[Optional["User"]] = relationship("User")


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), index=True)
    
    amount: Mapped[int] = mapped_column(Integer)
    balance_after: Mapped[int] = mapped_column(Integer)
    
    transaction_type: Mapped[str] = mapped_column(String)
    reason: Mapped[str] = mapped_column(String)
    
    generation_id: Mapped[Optional[UUID]] = mapped_column(GUID(), ForeignKey("generations.id"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user: Mapped["User"] = relationship("User", back_populates="credit_transactions")


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), unique=True)
    
    plan_name: Mapped[str] = mapped_column(String, default="FREE")
    status: Mapped[str] = mapped_column(String, default="ACTIVE")
    
    period: Mapped[str] = mapped_column(String, default="month")
    period_months: Mapped[int] = mapped_column(Integer, default=1)
    
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    canceled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    auto_renew: Mapped[int] = mapped_column(Integer, default=1)
    
    initial_payment_id: Mapped[Optional[UUID]] = mapped_column(GUID(), ForeignKey("payments.id"), nullable=True)
    
    credits_granted: Mapped[int] = mapped_column(Integer, default=5)
    
    generations_limit: Mapped[int] = mapped_column(Integer, default=5)
    tokens_limit: Mapped[int] = mapped_column(Integer, default=100000)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user: Mapped["User"] = relationship("User", backref="subscription")
    initial_payment: Mapped[Optional["Payment"]] = relationship("Payment")

def create_db_engine(db_url: str):
    engine_args = {}
    if db_url.startswith("sqlite"):
        engine_args["connect_args"] = {"check_same_thread": False}
    return create_engine(db_url, **engine_args)

def get_session_factory(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
