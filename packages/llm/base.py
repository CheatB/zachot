"""
Базовые интерфейсы для LLM адаптеров.

Определяет контракты для работы с различными LLM провайдерами (OpenAI, DeepSeek, Perplexity и т.д.).
Все конкретные реализации должны соответствовать этим интерфейсам.

Использование в воркерах:
    >>> from packages.llm import LLMAdapter, PromptBundle, OutputSchema, LLMBudget
    >>> 
    >>> # Создать адаптер (конкретная реализация)
    >>> adapter = OpenAIAdapter(api_key="...")
    >>> 
    >>> # Подготовить промпт
    >>> prompt = PromptBundle(
    ...     system_prompt="You are a helpful assistant.",
    ...     user_prompt="Generate a structure for this text: {text}",
    ...     metadata={"temperature": 0.7, "model_hint": "gpt-4"}
    ... )
    >>> 
    >>> # Определить схему вывода
    >>> class TextStructureSchema(OutputSchema):
    ...     def validate(self, raw_output: str) -> dict:
    ...         # Парсинг и валидация JSON из raw_output
    ...         return parsed_data
    >>> 
    >>> # Установить бюджет
    >>> budget = LLMBudget(
    ...     max_tokens=2000,
    ...     max_cost_rub=10.0,
    ...     soft_limit=True
    ... )
    >>> 
    >>> # Выполнить запрос
    >>> result = adapter.execute(
    ...     prompt=prompt,
    ...     output_schema=TextStructureSchema(),
    ...     budget=budget,
    ...     stream=False
    ... )
    >>> 
    >>> if result.success:
    ...     print(f"Output: {result.output}")
    ...     print(f"Cost: {result.cost_rub} RUB")
    ... else:
    ...     print(f"Error: {result.error}")
"""

import hashlib
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, field_validator


class PromptBundle(BaseModel):
    """
    Бандл промпта для отправки в LLM.
    
    Содержит системный промпт, пользовательский промпт и метаданные.
    Используется для дедупликации и кэширования через hash().
    
    Attributes:
        system_prompt: Системный промпт (инструкции для модели)
        user_prompt: Пользовательский промпт (основной запрос)
        metadata: Дополнительные метаданные (temperature, model_hint, etc.)
    
    Examples:
        >>> prompt = PromptBundle(
        ...     system_prompt="You are a helpful assistant.",
        ...     user_prompt="Analyze this text: {text}",
        ...     metadata={"temperature": 0.7, "model_hint": "gpt-4"}
        ... )
        >>> 
        >>> # Использование в воркере
        >>> formatted_prompt = prompt.user_prompt.format(text="Some text")
        >>> result = adapter.execute(prompt, schema, budget)
    """
    
    system_prompt: str = Field(default="", description="Системный промпт")
    user_prompt: str = Field(..., description="Пользовательский промпт")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Метаданные (temperature, model_hint, etc.)"
    )
    
    def hash(self) -> str:
        """
        Вычисляет хеш промпта для дедупликации и кэширования.
        
        Хеш основан на содержимом промпта и метаданных.
        Одинаковые промпты будут иметь одинаковый хеш.
        
        Returns:
            SHA256 хеш в виде hex-строки
        
        Examples:
            >>> prompt1 = PromptBundle(user_prompt="Hello")
            >>> prompt2 = PromptBundle(user_prompt="Hello")
            >>> prompt1.hash() == prompt2.hash()
            True
        """
        content = f"{self.system_prompt}|{self.user_prompt}|{sorted(self.metadata.items())}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    class Config:
        """Конфигурация Pydantic."""
        frozen = True  # Делаем объект неизменяемым для hash()
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        user_preview = self.user_prompt[:50] + "..." if len(self.user_prompt) > 50 else self.user_prompt
        return f"PromptBundle(user_prompt={user_preview!r}, metadata={self.metadata})"


class OutputSchema(ABC):
    """
    Абстрактный класс для схемы валидации вывода LLM.
    
    Каждая схема определяет, как парсить и валидировать сырой вывод от LLM.
    Используется для обеспечения структурированного вывода.
    
    Examples:
        >>> class JSONStructureSchema(OutputSchema):
        ...     def validate(self, raw_output: str) -> dict:
        ...         import json
        ...         data = json.loads(raw_output)
        ...         # Дополнительная валидация
        ...         if "sections" not in data:
        ...             raise ValueError("Missing 'sections' field")
        ...         return data
        >>> 
        >>> schema = JSONStructureSchema()
        >>> result = adapter.execute(prompt, schema, budget)
        >>> # result.output будет валидированным dict
    """
    
    @abstractmethod
    def validate(self, raw_output: str) -> dict:
        """
        Валидирует и парсит сырой вывод от LLM.
        
        Args:
            raw_output: Сырой текст вывода от LLM
        
        Returns:
            Валидированный dict с данными
        
        Raises:
            ValueError: Если вывод не соответствует схеме
            JSONDecodeError: Если вывод не является валидным JSON (если требуется)
        
        Examples:
            >>> schema = MySchema()
            >>> validated = schema.validate('{"key": "value"}')
            >>> print(validated)
            {'key': 'value'}
        """
        pass


class LLMBudget(BaseModel):
    """
    Бюджет для выполнения LLM запроса.
    
    Ограничивает использование токенов и стоимость запроса.
    Используется для контроля расходов и fair use.
    
    Attributes:
        max_tokens: Максимальное количество токенов (включая input + output)
        max_cost_rub: Максимальная стоимость в рублях
        soft_limit: Если True, предупреждает при превышении, но не блокирует.
                   Если False, выбрасывает исключение при превышении.
    
    Examples:
        >>> # Жесткий лимит - запрос будет отклонен при превышении
        >>> budget = LLMBudget(
        ...     max_tokens=2000,
        ...     max_cost_rub=10.0,
        ...     soft_limit=False
        ... )
        >>> 
        >>> # Мягкий лимит - предупреждение, но выполнение продолжается
        >>> budget = LLMBudget(
        ...     max_tokens=5000,
        ...     max_cost_rub=50.0,
        ...     soft_limit=True
        ... )
    """
    
    max_tokens: int = Field(..., gt=0, description="Максимальное количество токенов")
    max_cost_rub: float = Field(..., ge=0.0, description="Максимальная стоимость в рублях")
    soft_limit: bool = Field(
        default=False,
        description="Мягкий лимит (предупреждение) или жесткий (блокировка)"
    )
    
    @field_validator('max_tokens')
    @classmethod
    def validate_max_tokens(cls, v: int) -> int:
        """Валидация: max_tokens должен быть положительным."""
        if v <= 0:
            raise ValueError(f"max_tokens must be > 0, got {v}")
        return v
    
    @field_validator('max_cost_rub')
    @classmethod
    def validate_max_cost(cls, v: float) -> float:
        """Валидация: max_cost_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"max_cost_rub must be >= 0, got {v}")
        return v
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        limit_type = "soft" if self.soft_limit else "hard"
        return (
            f"LLMBudget(max_tokens={self.max_tokens}, "
            f"max_cost_rub={self.max_cost_rub}, limit={limit_type})"
        )


class LLMResult(BaseModel):
    """
    Результат выполнения LLM запроса.
    
    Содержит валидированный вывод, метрики использования и информацию о провайдере.
    Используется воркерами для обработки результатов LLM вызовов.
    
    Attributes:
        success: Флаг успешности выполнения
        output: Валидированный вывод (dict) - только если success=True
        raw_output: Сырой вывод от LLM (опционально, для отладки)
        error: Информация об ошибке (только если success=False)
        tokens_used: Количество использованных токенов
        latency_ms: Время выполнения в миллисекундах
        cost_rub: Стоимость запроса в рублях
        provider_name: Название провайдера (например, "openai", "deepseek")
    
    Examples:
        >>> result = adapter.execute(prompt, schema, budget)
        >>> 
        >>> if result.success:
        ...     # Использовать валидированный вывод
        ...     structured_data = result.output
        ...     print(f"Cost: {result.cost_rub} RUB")
        ...     print(f"Tokens: {result.tokens_used}")
        ... else:
        ...     # Обработать ошибку
        ...     print(f"Error: {result.error}")
    """
    
    success: bool = Field(..., description="Флаг успешности выполнения")
    
    output: Optional[dict] = Field(None, description="Валидированный вывод (если success=True)")
    raw_output: Optional[str] = Field(None, description="Сырой вывод от LLM (для отладки)")
    error: Optional[str] = Field(None, description="Информация об ошибке (если success=False)")
    
    tokens_used: int = Field(..., ge=0, description="Количество использованных токенов")
    latency_ms: int = Field(..., ge=0, description="Время выполнения в миллисекундах")
    cost_rub: float = Field(..., ge=0.0, description="Стоимость запроса в рублях")
    provider_name: str = Field(..., description="Название провайдера")
    
    @field_validator('tokens_used')
    @classmethod
    def validate_tokens(cls, v: int) -> int:
        """Валидация: tokens_used должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"tokens_used must be >= 0, got {v}")
        return v
    
    @field_validator('latency_ms')
    @classmethod
    def validate_latency(cls, v: int) -> int:
        """Валидация: latency_ms должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"latency_ms must be >= 0, got {v}")
        return v
    
    @field_validator('cost_rub')
    @classmethod
    def validate_cost(cls, v: float) -> float:
        """Валидация: cost_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"cost_rub must be >= 0, got {v}")
        return v
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        if self.success:
            status = f"SUCCESS (output keys: {list(self.output.keys()) if self.output else []})"
        else:
            status = f"FAILED (error: {self.error})"
        
        return (
            f"LLMResult({status}, tokens={self.tokens_used}, "
            f"cost={self.cost_rub} RUB, latency={self.latency_ms}ms, "
            f"provider={self.provider_name})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "SUCCESS" if self.success else "FAILED"
        return (
            f"LLMResult[{status}] "
            f"({self.provider_name}, {self.tokens_used} tokens, "
            f"{self.cost_rub:.2f} RUB, {self.latency_ms}ms)"
        )


class LLMAdapter(ABC):
    """
    Абстрактный базовый класс для LLM адаптеров.
    
    Определяет интерфейс для работы с различными LLM провайдерами.
    Каждый провайдер (OpenAI, DeepSeek, Perplexity) должен реализовать этот интерфейс.
    
    Адаптер используется воркерами для выполнения LLM запросов.
    Экономика и fair use строятся поверх этого интерфейса.
    
    Attributes:
        name: Название адаптера (например, "openai", "deepseek")
        supports_streaming: Поддерживает ли адаптер streaming
        max_context_tokens: Максимальный размер контекста в токенах
        default_timeout_sec: Таймаут по умолчанию в секундах
    
    Examples:
        >>> # В воркере:
        >>> from packages.llm import LLMAdapter, PromptBundle, OutputSchema, LLMBudget
        >>> 
        >>> class MyWorker(BaseWorker):
        ...     def __init__(self, llm_adapter: LLMAdapter):
        ...         self.llm_adapter = llm_adapter
        ...     
        ...     def execute(self, job: Job) -> JobResult:
        ...         # Подготовить промпт из job.input_payload
        ...         prompt = PromptBundle(
        ...             system_prompt="You are a helpful assistant.",
        ...             user_prompt=job.input_payload["text"],
        ...             metadata={"temperature": 0.7}
        ...         )
        ...         
        ...         # Определить схему вывода
        ...         class MySchema(OutputSchema):
        ...             def validate(self, raw_output: str) -> dict:
        ...                 return json.loads(raw_output)
        ...         
        ...         # Установить бюджет
        ...         budget = LLMBudget(
        ...             max_tokens=2000,
        ...             max_cost_rub=10.0,
        ...             soft_limit=False
        ...         )
        ...         
        ...         # Выполнить запрос
        ...         llm_result = self.llm_adapter.execute(
        ...             prompt=prompt,
        ...             output_schema=MySchema(),
        ...             budget=budget,
        ...             stream=False
        ...         )
        ...         
        ...         # Обработать результат
        ...         if llm_result.success:
        ...             return JobResult(
        ...                 job_id=job.id,
        ...                 success=True,
        ...                 output_payload=llm_result.output,
        ...                 finished_at=datetime.now()
        ...             )
        ...         else:
        ...             return JobResult(
        ...                 job_id=job.id,
        ...                 success=False,
        ...                 error={"message": llm_result.error},
        ...                 finished_at=datetime.now()
        ...             )
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """
        Название адаптера.
        
        Returns:
            Строка с названием (например, "openai", "deepseek", "perplexity")
        
        Examples:
            >>> adapter = OpenAIAdapter(...)
            >>> adapter.name
            'openai'
        """
        pass
    
    @property
    @abstractmethod
    def supports_streaming(self) -> bool:
        """
        Поддерживает ли адаптер streaming ответы.
        
        Returns:
            True, если поддерживается streaming, False в противном случае
        
        Examples:
            >>> adapter = OpenAIAdapter(...)
            >>> if adapter.supports_streaming:
            ...     result = adapter.execute(prompt, schema, budget, stream=True)
        """
        pass
    
    @property
    @abstractmethod
    def max_context_tokens(self) -> int:
        """
        Максимальный размер контекста в токенах.
        
        Returns:
            Максимальное количество токенов, которое может обработать модель
        
        Examples:
            >>> adapter = OpenAIAdapter(...)
            >>> if prompt_tokens > adapter.max_context_tokens:
            ...     raise ValueError("Prompt too long")
        """
        pass
    
    @property
    @abstractmethod
    def default_timeout_sec(self) -> int:
        """
        Таймаут по умолчанию в секундах.
        
        Returns:
            Таймаут в секундах для запросов
        
        Examples:
            >>> adapter = OpenAIAdapter(...)
            >>> timeout = adapter.default_timeout_sec
        """
        pass
    
    @abstractmethod
    def execute(
        self,
        prompt: PromptBundle,
        output_schema: OutputSchema,
        *,
        budget: LLMBudget,
        stream: bool = False
    ) -> LLMResult:
        """
        Выполняет LLM запрос.
        
        Основной метод для выполнения запросов к LLM.
        Валидирует промпт, проверяет бюджет, выполняет запрос,
        валидирует вывод через output_schema и возвращает результат.
        
        Args:
            prompt: Бандл промпта для отправки в LLM
            output_schema: Схема для валидации вывода
            budget: Бюджет для ограничения токенов и стоимости
            stream: Использовать ли streaming (если поддерживается)
        
        Returns:
            LLMResult с результатом выполнения
        
        Raises:
            ValueError: Если промпт слишком длинный (превышает max_context_tokens)
            ValueError: Если бюджет превышен и soft_limit=False
            TimeoutError: Если запрос превысил default_timeout_sec
            Exception: Другие ошибки провайдера (сеть, API, etc.)
        
        Examples:
            >>> adapter = OpenAIAdapter(...)
            >>> prompt = PromptBundle(user_prompt="Hello")
            >>> schema = MySchema()
            >>> budget = LLMBudget(max_tokens=100, max_cost_rub=1.0)
            >>> 
            >>> result = adapter.execute(prompt, schema, budget=budget)
            >>> 
            >>> if result.success:
            ...     print(result.output)
            ...     print(f"Cost: {result.cost_rub} RUB")
        
        Notes:
            - Адаптер должен проверять бюджет перед выполнением запроса
            - При превышении бюджета с soft_limit=False должен выбрасывать ValueError
            - При превышении бюджета с soft_limit=True должен предупреждать, но продолжать
            - Адаптер должен валидировать вывод через output_schema.validate()
            - Если валидация не удалась, должен вернуть LLMResult(success=False)
        """
        pass
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"{self.__class__.__name__}(name={self.name!r})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"{self.__class__.__name__}[{self.name}]"

