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
    
    # Система кредитов (заменяет generations_limit)
    credits_balance = Column(Integer, default=5)  # Текущий баланс кредитов
    credits_used = Column(Integer, default=0)     # Использовано за период
    
    # Legacy поля (для обратной совместимости)
    generations_used = Column(Integer, default=0)
    generations_limit = Column(Integer, default=5)
    tokens_used = Column(Integer, default=0)
    tokens_limit = Column(Integer, default=100000)
    fair_use_mode = Column(String, default="normal") # 'normal', 'degraded', 'strict'
    
    telegram_id = Column(String, unique=True, index=True, nullable=True)
    telegram_username = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    
    # Реферальная система
    referral_code = Column(String, unique=True, index=True, nullable=True)  # Уникальный код пользователя
    referred_by = Column(GUID(), ForeignKey("users.id"), nullable=True, index=True)  # Кто пригласил
    referrals_count = Column(Integer, default=0)  # Количество приглашённых
    
    generations = relationship("Generation", back_populates="user")
    credit_transactions = relationship("CreditTransaction", back_populates="user")

class Generation(Base):
    __tablename__ = "generations"
    
    id = Column(GUID(), primary_key=True, default=uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), index=True)  # Индекс для быстрого поиска по пользователю
    module = Column(String)
    status = Column(String, index=True)  # Индекс для фильтрации по статусу
    title = Column(String, nullable=True)
    work_type = Column(String, nullable=True)
    complexity_level = Column(String, default="student")
    humanity_level = Column(String, default="medium")
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Индекс для сортировки
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)  # Индекс для сортировки
    
    input_payload = Column(JSON)
    settings_payload = Column(JSON)
    result_content = Column(String, nullable=True)
    usage_metadata = Column(JSON, default=list) # [{model: str, tokens: int, cost_usd: float, stage: str}]
    
    user = relationship("User", back_populates="generations")

class Payment(Base):
    """
    Модель платежа.
    
    Статусы (согласно T-Bank API):
    - NEW: Платеж создан, ожидает оплаты
    - AUTHORIZED: Платеж авторизован (средства заблокированы)
    - CONFIRMED: Платеж подтверждён (средства списаны)
    - REJECTED: Платеж отклонён
    - REFUNDED: Платеж возвращён
    - PARTIAL_REFUNDED: Частичный возврат
    - CANCELED: Платеж отменён
    """
    __tablename__ = "payments"
    
    id = Column(GUID(), primary_key=True, default=uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), index=True)  # Индекс для поиска платежей пользователя
    amount = Column(Integer) # в копейках
    status = Column(String, default="NEW", index=True)  # Индекс для фильтрации по статусу
    payment_id = Column(String, nullable=True, index=True) # PaymentId из Т-Банка
    order_id = Column(String, unique=True, index=True) # Наш уникальный OrderId
    description = Column(String)
    
    # Рекуррентные платежи
    period = Column(String, nullable=True) # 'month', 'quarter', 'year'
    rebill_id = Column(String, nullable=True, index=True) # RebillId для повторных списаний
    recurrent_parent_id = Column(GUID(), ForeignKey("payments.id"), nullable=True) # ID первого платежа в цепочке
    is_recurrent = Column(Integer, default=0) # 0 - обычный, 1 - рекуррентный (первый), 2 - автосписание
    
    # Email для чека
    customer_email = Column(String, nullable=True)
    customer_key = Column(String, nullable=True) # CustomerKey для привязки карты
    
    # Даты
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Индекс для сортировки
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True) # Когда платёж подтверждён
    
    # Связи
    user = relationship("User")
    recurrent_parent = relationship("Payment", remote_side=[id], backref="child_payments")

class AuthToken(Base):
    __tablename__ = "auth_tokens"
    
    token = Column(String, primary_key=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=True, index=True)  # Индекс для поиска токенов пользователя
    created_at = Column(DateTime, default=datetime.utcnow)
    is_used = Column(Integer, default=0) # 0 - no, 1 - yes
    
    user = relationship("User")


class CreditTransaction(Base):
    """
    История транзакций кредитов.
    
    Типы транзакций:
    - DEBIT: Списание за генерацию
    - CREDIT: Начисление при покупке подписки
    - REFUND: Возврат при отмене генерации
    - BONUS: Бонусное начисление
    """
    __tablename__ = "credit_transactions"
    
    id = Column(GUID(), primary_key=True, default=uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), index=True)  # Уже есть индекс
    
    amount = Column(Integer)  # Положительное = начисление, отрицательное = списание
    balance_after = Column(Integer)  # Баланс после транзакции
    
    transaction_type = Column(String)  # DEBIT, CREDIT, REFUND, BONUS
    reason = Column(String)  # Причина (например, "kursach", "subscription_month")
    
    # Связь с генерацией (если списание)
    generation_id = Column(GUID(), ForeignKey("generations.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Индекс для сортировки
    
    user = relationship("User", back_populates="credit_transactions")


class Subscription(Base):
    """
    Модель подписки пользователя.
    
    Статусы:
    - ACTIVE: Подписка активна
    - PAST_DUE: Просрочена (ожидает оплаты)
    - CANCELED: Отменена пользователем
    - EXPIRED: Истекла и не продлена
    """
    __tablename__ = "subscriptions"
    
    id = Column(GUID(), primary_key=True, default=uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, index=True) # Один пользователь = одна активная подписка, индекс для быстрого поиска
    
    plan_name = Column(String, default="FREE") # FREE, MONTH, QUARTER, YEAR
    status = Column(String, default="ACTIVE", index=True) # ACTIVE, PAST_DUE, CANCELED, EXPIRED, индекс для фильтрации
    
    # Период подписки
    period = Column(String, default="month") # month, quarter, year
    period_months = Column(Integer, default=1) # 1, 3, 12
    
    # Даты
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)
    
    # Автопродление
    auto_renew = Column(Integer, default=1) # 0 - нет, 1 - да
    
    # Связь с первым платежом для рекуррентных списаний
    initial_payment_id = Column(GUID(), ForeignKey("payments.id"), nullable=True)
    
    # Кредиты (начисляются при активации подписки)
    credits_granted = Column(Integer, default=5)  # Сколько кредитов выдано при активации
    
    # Legacy поля (для обратной совместимости)
    generations_limit = Column(Integer, default=5)
    tokens_limit = Column(Integer, default=100000)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", backref="subscription")
    initial_payment = relationship("Payment")


class AuditLog(Base):
    """
    Audit trail для критичных операций.
    
    Типы событий:
    - USER_ROLE_CHANGE: Изменение роли пользователя
    - USER_CREDITS_CHANGE: Изменение кредитов пользователя
    - USER_LOGIN: Вход пользователя
    - USER_LOGOUT: Выход пользователя
    - ADMIN_ACTION: Административное действие
    - GENERATION_CREATE: Создание генерации
    - GENERATION_DELETE: Удаление генерации
    - PAYMENT_CREATE: Создание платежа
    - PAYMENT_CONFIRM: Подтверждение платежа
    """
    __tablename__ = "audit_logs"
    
    id = Column(GUID(), primary_key=True, default=uuid4)
    
    # Кто совершил действие
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=True, index=True)
    
    # Тип события
    event_type = Column(String, index=True)  # USER_ROLE_CHANGE, USER_CREDITS_CHANGE, etc.
    
    # Описание действия
    action = Column(String)  # "Changed role from user to admin"
    
    # Данные до и после изменения (JSON)
    before_data = Column(String, nullable=True)  # JSON строка
    after_data = Column(String, nullable=True)   # JSON строка
    
    # Метаданные
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Связанные объекты
    target_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)  # Если действие касается другого пользователя
    target_generation_id = Column(GUID(), ForeignKey("generations.id"), nullable=True)
    target_payment_id = Column(GUID(), ForeignKey("payments.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", foreign_keys=[user_id])
    target_user = relationship("User", foreign_keys=[target_user_id])

def create_db_engine(db_url: str):
    """
    Создает engine с оптимальными настройками connection pooling.
    
    Для PostgreSQL:
    - pool_size=10: Постоянных соединений в пуле
    - max_overflow=20: Дополнительных соединений при пиках
    - pool_timeout=30: Таймаут ожидания свободного соединения
    - pool_recycle=3600: Пересоздание соединений каждый час
    - pool_pre_ping=True: Проверка живости соединения перед использованием
    
    Для SQLite:
    - Отключаем check_same_thread для многопоточности
    """
    engine_args = {}
    
    if db_url.startswith("sqlite"):
        engine_args["connect_args"] = {"check_same_thread": False}
    else:
        # PostgreSQL connection pooling
        from sqlalchemy.pool import QueuePool
        
        engine_args.update({
            "poolclass": QueuePool,
            "pool_size": 10,           # Постоянных соединений
            "max_overflow": 20,        # Дополнительных при пиках (итого до 30)
            "pool_timeout": 30,        # Таймаут ожидания (секунды)
            "pool_recycle": 3600,      # Пересоздание каждый час
            "pool_pre_ping": True,     # Проверка живости соединения
            "echo_pool": False,        # Логирование пула (для отладки можно включить)
        })
    
    return create_engine(db_url, **engine_args)

def get_session_factory(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
