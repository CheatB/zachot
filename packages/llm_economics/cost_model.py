"""
Cost Model для расчёта стоимости использования LLM провайдеров.

Предоставляет детерминированный расчёт стоимости на основе количества токенов
и ценообразования провайдера. Чистая математика, без API вызовов.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TokenCost(BaseModel):
    """
    Модель ценообразования для LLM провайдера и модели.
    
    Определяет стоимость input и output токенов для конкретной модели.
    Используется для расчёта стоимости запросов.
    
    Attributes:
        provider_name: Название провайдера (например, "openai", "deepseek")
        model_name: Название модели (например, "gpt-4", "gpt-3.5-turbo")
        input_cost_per_1k_tokens: Стоимость 1000 input токенов в рублях
        output_cost_per_1k_tokens: Стоимость 1000 output токенов в рублях
        currency: Валюта (всегда "RUB")
    
    Examples:
        >>> # OpenAI GPT-4
        >>> pricing = TokenCost(
        ...     provider_name="openai",
        ...     model_name="gpt-4",
        ...     input_cost_per_1k_tokens=0.30,
        ...     output_cost_per_1k_tokens=0.60,
        ...     currency="RUB"
        ... )
        >>> 
        >>> # DeepSeek
        >>> pricing = TokenCost(
        ...     provider_name="deepseek",
        ...     model_name="deepseek-chat",
        ...     input_cost_per_1k_tokens=0.14,
        ...     output_cost_per_1k_tokens=0.28,
        ...     currency="RUB"
        ... )
    """
    
    provider_name: str = Field(..., description="Название провайдера")
    model_name: str = Field(..., description="Название модели")
    input_cost_per_1k_tokens: float = Field(..., ge=0.0, description="Стоимость 1000 input токенов в рублях")
    output_cost_per_1k_tokens: float = Field(..., ge=0.0, description="Стоимость 1000 output токенов в рублях")
    currency: Literal["RUB"] = Field("RUB", description="Валюта")
    
    @field_validator('input_cost_per_1k_tokens')
    @classmethod
    def validate_input_cost(cls, v: float) -> float:
        """Валидация: стоимость input токенов должна быть неотрицательной."""
        if v < 0:
            raise ValueError(f"input_cost_per_1k_tokens must be >= 0, got {v}")
        return v
    
    @field_validator('output_cost_per_1k_tokens')
    @classmethod
    def validate_output_cost(cls, v: float) -> float:
        """Валидация: стоимость output токенов должна быть неотрицательной."""
        if v < 0:
            raise ValueError(f"output_cost_per_1k_tokens must be >= 0, got {v}")
        return v
    
    model_config = ConfigDict(
        frozen=True,  # Делаем модель immutable
        protected_namespaces=(),  # Разрешаем использование model_name
    )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"TokenCost(provider={self.provider_name!r}, model={self.model_name!r}, "
            f"input={self.input_cost_per_1k_tokens} RUB/1k, "
            f"output={self.output_cost_per_1k_tokens} RUB/1k)"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"TokenCost[{self.provider_name}/{self.model_name}] "
            f"({self.input_cost_per_1k_tokens} RUB/1k input, "
            f"{self.output_cost_per_1k_tokens} RUB/1k output)"
        )


class CostCalculationInput(BaseModel):
    """
    Входные данные для расчёта стоимости.
    
    Содержит информацию о количестве токенов и используемой модели.
    
    Attributes:
        input_tokens: Количество input токенов
        output_tokens: Количество output токенов
        provider_name: Название провайдера
        model_name: Название модели
    
    Examples:
        >>> input_data = CostCalculationInput(
        ...     input_tokens=1500,
        ...     output_tokens=800,
        ...     provider_name="openai",
        ...     model_name="gpt-4"
        ... )
    """
    
    input_tokens: int = Field(..., ge=0, description="Количество input токенов")
    output_tokens: int = Field(..., ge=0, description="Количество output токенов")
    provider_name: str = Field(..., description="Название провайдера")
    model_name: str = Field(..., description="Название модели")
    
    @field_validator('input_tokens')
    @classmethod
    def validate_input_tokens(cls, v: int) -> int:
        """Валидация: input_tokens должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"input_tokens must be >= 0, got {v}")
        return v
    
    @field_validator('output_tokens')
    @classmethod
    def validate_output_tokens(cls, v: int) -> int:
        """Валидация: output_tokens должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"output_tokens must be >= 0, got {v}")
        return v
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"CostCalculationInput(provider={self.provider_name!r}, "
            f"model={self.model_name!r}, input_tokens={self.input_tokens}, "
            f"output_tokens={self.output_tokens})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return (
            f"CostCalculationInput[{self.provider_name}/{self.model_name}] "
            f"({self.input_tokens} input + {self.output_tokens} output tokens)"
        )


class CostCalculationResult(BaseModel):
    """
    Результат расчёта стоимости.
    
    Содержит разбивку стоимости по input и output токенам,
    а также общую стоимость.
    
    Attributes:
        input_cost_rub: Стоимость input токенов в рублях
        output_cost_rub: Стоимость output токенов в рублях
        total_cost_rub: Общая стоимость в рублях
    
    Examples:
        >>> result = CostCalculationResult(
        ...     input_cost_rub=0.45,
        ...     output_cost_rub=0.48,
        ...     total_cost_rub=0.93
        ... )
        >>> print(f"Total: {result.total_cost_rub} RUB")
        Total: 0.93 RUB
    """
    
    input_cost_rub: float = Field(..., ge=0.0, description="Стоимость input токенов в рублях")
    output_cost_rub: float = Field(..., ge=0.0, description="Стоимость output токенов в рублях")
    total_cost_rub: float = Field(..., ge=0.0, description="Общая стоимость в рублях")
    
    @field_validator('input_cost_rub')
    @classmethod
    def validate_input_cost(cls, v: float) -> float:
        """Валидация: input_cost_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"input_cost_rub must be >= 0, got {v}")
        return v
    
    @field_validator('output_cost_rub')
    @classmethod
    def validate_output_cost(cls, v: float) -> float:
        """Валидация: output_cost_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"output_cost_rub must be >= 0, got {v}")
        return v
    
    @field_validator('total_cost_rub')
    @classmethod
    def validate_total_cost(cls, v: float) -> float:
        """Валидация: total_cost_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"total_cost_rub must be >= 0, got {v}")
        return v
    
    model_config = ConfigDict(
        frozen=True,  # Делаем модель immutable
        protected_namespaces=(),  # Разрешаем использование model_name
    )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"CostCalculationResult(input={self.input_cost_rub} RUB, "
            f"output={self.output_cost_rub} RUB, total={self.total_cost_rub} RUB)"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"CostCalculationResult(total={self.total_cost_rub:.4f} RUB)"


class CostCalculator:
    """
    Калькулятор стоимости использования LLM.
    
    Выполняет детерминированный расчёт стоимости на основе количества токенов
    и ценообразования провайдера. Чистая математика, без API вызовов.
    
    Формула расчёта:
    - input_cost = (input_tokens / 1000) * input_cost_per_1k_tokens
    - output_cost = (output_tokens / 1000) * output_cost_per_1k_tokens
    - total_cost = input_cost + output_cost
    
    Все значения округляются до 4 знаков после запятой.
    
    Examples:
        >>> from packages.llm_economics import TokenCost, CostCalculationInput, CostCalculator
        >>> 
        >>> # Определить ценообразование
        >>> pricing = TokenCost(
        ...     provider_name="openai",
        ...     model_name="gpt-4",
        ...     input_cost_per_1k_tokens=0.30,
        ...     output_cost_per_1k_tokens=0.60,
        ...     currency="RUB"
        ... )
        >>> 
        >>> # Подготовить входные данные
        >>> input_data = CostCalculationInput(
        ...     input_tokens=1500,
        ...     output_tokens=800,
        ...     provider_name="openai",
        ...     model_name="gpt-4"
        ... )
        >>> 
        >>> # Рассчитать стоимость
        >>> calculator = CostCalculator()
        >>> result = calculator.calculate(input_data, pricing)
        >>> 
        >>> print(f"Input cost: {result.input_cost_rub} RUB")
        Input cost: 0.45 RUB
        >>> print(f"Output cost: {result.output_cost_rub} RUB")
        Output cost: 0.48 RUB
        >>> print(f"Total cost: {result.total_cost_rub} RUB")
        Total cost: 0.93 RUB
    """
    
    def calculate(
        self,
        input_data: CostCalculationInput,
        pricing: TokenCost
    ) -> CostCalculationResult:
        """
        Рассчитывает стоимость использования LLM.
        
        Выполняет детерминированный расчёт на основе количества токенов
        и ценообразования. Все значения округляются до 4 знаков после запятой.
        
        Args:
            input_data: Входные данные (токены, провайдер, модель)
            pricing: Ценообразование для модели
        
        Returns:
            CostCalculationResult с разбивкой стоимости
        
        Raises:
            ValueError: Если провайдер или модель не совпадают
        
        Examples:
            >>> calculator = CostCalculator()
            >>> 
            >>> pricing = TokenCost(
            ...     provider_name="openai",
            ...     model_name="gpt-4",
            ...     input_cost_per_1k_tokens=0.30,
            ...     output_cost_per_1k_tokens=0.60,
            ...     currency="RUB"
            ... )
            >>> 
            >>> input_data = CostCalculationInput(
            ...     input_tokens=1500,
            ...     output_tokens=800,
            ...     provider_name="openai",
            ...     model_name="gpt-4"
            ... )
            >>> 
            >>> result = calculator.calculate(input_data, pricing)
            >>> 
            >>> # Проверка результата
            >>> assert result.input_cost_rub == 0.45
            >>> assert result.output_cost_rub == 0.48
            >>> assert result.total_cost_rub == 0.93
        """
        # Валидация соответствия провайдера и модели
        if input_data.provider_name != pricing.provider_name:
            raise ValueError(
                f"Provider mismatch: input has {input_data.provider_name}, "
                f"pricing has {pricing.provider_name}"
            )
        
        if input_data.model_name != pricing.model_name:
            raise ValueError(
                f"Model mismatch: input has {input_data.model_name}, "
                f"pricing has {pricing.model_name}"
            )
        
        # Расчёт стоимости input токенов
        # Формула: (tokens / 1000) * cost_per_1k
        input_cost = (input_data.input_tokens / 1000.0) * pricing.input_cost_per_1k_tokens
        
        # Расчёт стоимости output токенов
        output_cost = (input_data.output_tokens / 1000.0) * pricing.output_cost_per_1k_tokens
        
        # Общая стоимость
        total_cost = input_cost + output_cost
        
        # Округление до 4 знаков после запятой
        input_cost_rounded = round(input_cost, 4)
        output_cost_rounded = round(output_cost, 4)
        total_cost_rounded = round(total_cost, 4)
        
        return CostCalculationResult(
            input_cost_rub=input_cost_rounded,
            output_cost_rub=output_cost_rounded,
            total_cost_rub=total_cost_rounded
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "CostCalculator()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "CostCalculator"

