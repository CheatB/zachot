"""
Usage Accounting для учёта фактического потребления LLM.

Предоставляет модели и инструменты для учёта использования LLM провайдеров.
Только факт использования, без логики лимитов и тарифов.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UsageRecord(BaseModel):
    """
    Запись о фактическом использовании LLM.
    
    Представляет одну запись о потреблении LLM провайдера.
    Содержит информацию о пользователе, генерации, задаче и метриках использования.
    
    Attributes:
        id: Уникальный идентификатор записи
        user_id: Идентификатор пользователя
        generation_id: Идентификатор генерации
        job_id: Идентификатор задачи
        provider_name: Название провайдера (например, "openai", "deepseek")
        model_name: Название модели (например, "gpt-4", "gpt-3.5-turbo")
        tokens_used: Количество использованных токенов
        cost_rub: Стоимость запроса в рублях
        latency_ms: Время выполнения в миллисекундах
        created_at: Время создания записи
    
    Examples:
        >>> from uuid import uuid4
        >>> from datetime import datetime
        >>> 
        >>> record = UsageRecord(
        ...     id=uuid4(),
        ...     user_id=uuid4(),
        ...     generation_id=uuid4(),
        ...     job_id=uuid4(),
        ...     provider_name="openai",
        ...     model_name="gpt-4",
        ...     tokens_used=1500,
        ...     cost_rub=0.93,
        ...     latency_ms=1200
        ... )
        >>> print(f"Usage: {record.tokens_used} tokens, {record.cost_rub} RUB")
        Usage: 1500 tokens, 0.93 RUB
    """
    
    id: UUID = Field(..., description="Уникальный идентификатор записи")
    user_id: UUID = Field(..., description="Идентификатор пользователя")
    generation_id: UUID = Field(..., description="Идентификатор генерации")
    job_id: UUID = Field(..., description="Идентификатор задачи")
    
    provider_name: str = Field(..., description="Название провайдера")
    model_name: str = Field(..., description="Название модели")
    tokens_used: int = Field(..., ge=0, description="Количество использованных токенов")
    cost_rub: float = Field(..., ge=0.0, description="Стоимость запроса в рублях")
    latency_ms: int = Field(..., ge=0, description="Время выполнения в миллисекундах")
    
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="Время создания записи"
    )
    
    @field_validator('tokens_used')
    @classmethod
    def validate_tokens(cls, v: int) -> int:
        """Валидация: tokens_used должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"tokens_used must be >= 0, got {v}")
        return v
    
    @field_validator('cost_rub')
    @classmethod
    def validate_cost(cls, v: float) -> float:
        """Валидация: cost_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"cost_rub must be >= 0, got {v}")
        return v
    
    @field_validator('latency_ms')
    @classmethod
    def validate_latency(cls, v: int) -> int:
        """Валидация: latency_ms должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"latency_ms must be >= 0, got {v}")
        return v
    
    model_config = ConfigDict(
        frozen=True,  # Делаем модель immutable
        protected_namespaces=(),  # Разрешаем использование model_name
    )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"UsageRecord(id={self.id!r}, user_id={self.user_id!r}, "
            f"generation_id={self.generation_id!r}, job_id={self.job_id!r}, "
            f"provider={self.provider_name!r}, model={self.model_name!r}, "
            f"tokens={self.tokens_used}, cost={self.cost_rub} RUB, "
            f"latency={self.latency_ms}ms)"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"UsageRecord[{self.id.hex[:8]}...] "
            f"({self.provider_name}/{self.model_name}, "
            f"{self.tokens_used} tokens, {self.cost_rub:.2f} RUB)"
        )


class UsageSummary(BaseModel):
    """
    Агрегированная сводка использования LLM.
    
    Содержит суммарные метрики использования: общее количество токенов,
    общую стоимость и среднюю латентность.
    
    Attributes:
        total_tokens: Общее количество использованных токенов
        total_cost_rub: Общая стоимость в рублях
        avg_latency_ms: Средняя латентность в миллисекундах
    
    Examples:
        >>> summary = UsageSummary(
        ...     total_tokens=5000,
        ...     total_cost_rub=3.10,
        ...     avg_latency_ms=1200
        ... )
        >>> print(f"Total: {summary.total_tokens} tokens, {summary.total_cost_rub} RUB")
        Total: 5000 tokens, 3.10 RUB
    """
    
    total_tokens: int = Field(..., ge=0, description="Общее количество использованных токенов")
    total_cost_rub: float = Field(..., ge=0.0, description="Общая стоимость в рублях")
    avg_latency_ms: int = Field(..., ge=0, description="Средняя латентность в миллисекундах")
    
    @field_validator('total_tokens')
    @classmethod
    def validate_total_tokens(cls, v: int) -> int:
        """Валидация: total_tokens должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"total_tokens must be >= 0, got {v}")
        return v
    
    @field_validator('total_cost_rub')
    @classmethod
    def validate_total_cost(cls, v: float) -> float:
        """Валидация: total_cost_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"total_cost_rub must be >= 0, got {v}")
        return v
    
    @field_validator('avg_latency_ms')
    @classmethod
    def validate_avg_latency(cls, v: int) -> int:
        """Валидация: avg_latency_ms должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"avg_latency_ms must be >= 0, got {v}")
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"UsageSummary(total_tokens={self.total_tokens}, "
            f"total_cost_rub={self.total_cost_rub} RUB, "
            f"avg_latency_ms={self.avg_latency_ms}ms)"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"UsageSummary({self.total_tokens} tokens, "
            f"{self.total_cost_rub:.2f} RUB, "
            f"avg latency {self.avg_latency_ms}ms)"
        )


class UsageAccumulator:
    """
    Аккумулятор записей использования LLM.
    
    Накопливает записи использования и предоставляет методы для агрегации.
    Не хранит данные персистентно - только in-memory для примеров.
    
    Examples:
        >>> from uuid import uuid4
        >>> from packages.llm_economics.usage import UsageRecord, UsageAccumulator
        >>> 
        >>> # Создать аккумулятор
        >>> accumulator = UsageAccumulator()
        >>> 
        >>> # Добавить записи (in-memory пример)
        >>> records = [
        ...     UsageRecord(
        ...         id=uuid4(),
        ...         user_id=uuid4(),
        ...         generation_id=uuid4(),
        ...         job_id=uuid4(),
        ...         provider_name="openai",
        ...         model_name="gpt-4",
        ...         tokens_used=1500,
        ...         cost_rub=0.93,
        ...         latency_ms=1200
        ...     ),
        ...     UsageRecord(
        ...         id=uuid4(),
        ...         user_id=uuid4(),
        ...         generation_id=uuid4(),
        ...         job_id=uuid4(),
        ...         provider_name="openai",
        ...         model_name="gpt-4",
        ...         tokens_used=2000,
        ...         cost_rub=1.20,
        ...         latency_ms=1500
        ...     ),
        ... ]
        >>> 
        >>> # Добавить записи
        >>> for record in records:
        ...     accumulator.add(record)
        >>> 
        >>> # Получить сводку
        >>> summary = accumulator.summarize(records)
        >>> print(f"Total tokens: {summary.total_tokens}")
        Total tokens: 3500
        >>> print(f"Total cost: {summary.total_cost_rub} RUB")
        Total cost: 2.13 RUB
        >>> print(f"Avg latency: {summary.avg_latency_ms}ms")
        Avg latency: 1350ms
    """
    
    def __init__(self):
        """Инициализация аккумулятора."""
        # In-memory хранилище только для примеров
        # В реальном использовании записи должны храниться в БД
        self._records: list[UsageRecord] = []
    
    def add(self, record: UsageRecord) -> None:
        """
        Добавляет запись использования.
        
        В текущей реализации добавляет запись в in-memory список.
        В реальном использовании должна сохранять в БД.
        
        Args:
            record: Запись использования для добавления
        
        Examples:
            >>> accumulator = UsageAccumulator()
            >>> record = UsageRecord(...)
            >>> accumulator.add(record)
        """
        self._records.append(record)
    
    def summarize(self, records: list[UsageRecord]) -> UsageSummary:
        """
        Агрегирует записи использования в сводку.
        
        Вычисляет суммарные метрики: общее количество токенов,
        общую стоимость и среднюю латентность.
        
        Args:
            records: Список записей для агрегации
        
        Returns:
            UsageSummary с агрегированными метриками
        
        Examples:
            >>> accumulator = UsageAccumulator()
            >>> records = [UsageRecord(...), UsageRecord(...)]
            >>> summary = accumulator.summarize(records)
            >>> print(f"Total: {summary.total_tokens} tokens")
        """
        if not records:
            return UsageSummary(
                total_tokens=0,
                total_cost_rub=0.0,
                avg_latency_ms=0
            )
        
        total_tokens = sum(record.tokens_used for record in records)
        total_cost = sum(record.cost_rub for record in records)
        
        # Средняя латентность
        total_latency = sum(record.latency_ms for record in records)
        avg_latency = total_latency // len(records) if records else 0
        
        return UsageSummary(
            total_tokens=total_tokens,
            total_cost_rub=round(total_cost, 4),  # Округление до 4 знаков
            avg_latency_ms=avg_latency
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"UsageAccumulator(records={len(self._records)})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"UsageAccumulator({len(self._records)} records)"


