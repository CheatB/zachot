"""
Budget Enforcement для проверки бюджета перед выполнением LLM запросов.

Предоставляет логику принятия решений о допустимости выполнения запроса
на основе бюджета и фактического использования. Используется ДО выполнения LLM вызова.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from packages.llm.base import LLMBudget
from packages.llm_economics.usage import UsageSummary


class BudgetDecision(BaseModel):
    """
    Решение о допустимости выполнения LLM запроса.
    
    Содержит информацию о том, разрешён ли запрос, причину решения
    и оставшиеся ресурсы бюджета.
    
    Attributes:
        allowed: Разрешён ли запрос
        reason: Причина решения ("ok", "soft_limit_exceeded", "hard_limit_exceeded")
        remaining_tokens: Оставшееся количество токенов после запроса
        remaining_budget_rub: Оставшийся бюджет в рублях после запроса
    
    Examples:
        >>> decision = BudgetDecision(
        ...     allowed=True,
        ...     reason="ok",
        ...     remaining_tokens=500,
        ...     remaining_budget_rub=5.0
        ... )
        >>> if decision.allowed:
        ...     print(f"Request allowed. Remaining: {decision.remaining_tokens} tokens")
    """
    
    allowed: bool = Field(..., description="Разрешён ли запрос")
    reason: Literal["ok", "soft_limit_exceeded", "hard_limit_exceeded"] = Field(
        ..., description="Причина решения"
    )
    remaining_tokens: int = Field(..., description="Оставшееся количество токенов после запроса")
    remaining_budget_rub: float = Field(..., ge=0.0, description="Оставшийся бюджет в рублях после запроса")
    
    @field_validator('remaining_budget_rub')
    @classmethod
    def validate_remaining_budget(cls, v: float) -> float:
        """Валидация: remaining_budget_rub должен быть неотрицательным."""
        if v < 0:
            raise ValueError(f"remaining_budget_rub must be >= 0, got {v}")
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"BudgetDecision(allowed={self.allowed}, reason={self.reason!r}, "
            f"remaining_tokens={self.remaining_tokens}, "
            f"remaining_budget_rub={self.remaining_budget_rub} RUB)"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "ALLOWED" if self.allowed else "DENIED"
        return (
            f"BudgetDecision[{status}] "
            f"({self.reason}, {self.remaining_tokens} tokens remaining, "
            f"{self.remaining_budget_rub:.2f} RUB remaining)"
        )


class BudgetEvaluator:
    """
    Оценщик бюджета для проверки допустимости выполнения LLM запросов.
    
    Выполняет проверку бюджета перед выполнением запроса на основе:
    - Бюджета (LLMBudget)
    - Фактического использования (UsageSummary)
    - Оценки будущего запроса (estimated_tokens, estimated_cost_rub)
    
    Логика:
    - Hard limit (soft_limit=False): при превышении → запрет
    - Soft limit (soft_limit=True): при превышении → разрешение с предупреждением
    - Бюджет не уходит в минус (remaining >= 0)
    
    Используется ДО выполнения LLM вызова для предотвращения превышения бюджета.
    
    Examples:
        >>> from packages.llm import LLMBudget
        >>> from packages.llm_economics import UsageSummary, BudgetEvaluator
        >>> 
        >>> # Бюджет
        >>> budget = LLMBudget(
        ...     max_tokens=5000,
        ...     max_cost_rub=10.0,
        ...     soft_limit=False
        ... )
        >>> 
        >>> # Фактическое использование
        >>> usage = UsageSummary(
        ...     total_tokens=3000,
        ...     total_cost_rub=5.0,
        ...     avg_latency_ms=1200
        ... )
        >>> 
        >>> # Оценка будущего запроса
        >>> estimated_tokens = 1500
        >>> estimated_cost_rub = 2.0
        >>> 
        >>> # Проверка бюджета
        >>> evaluator = BudgetEvaluator()
        >>> decision = evaluator.evaluate(
        ...     budget=budget,
        ...     usage=usage,
        ...     estimated_tokens=estimated_tokens,
        ...     estimated_cost_rub=estimated_cost_rub
        ... )
        >>> 
        >>> if decision.allowed:
        ...     print(f"Request allowed: {decision.reason}")
        ... else:
        ...     print(f"Request denied: {decision.reason}")
    """
    
    def evaluate(
        self,
        budget: LLMBudget,
        usage: UsageSummary,
        estimated_tokens: int,
        estimated_cost_rub: float
    ) -> BudgetDecision:
        """
        Оценивает допустимость выполнения LLM запроса.
        
        Проверяет, не превысит ли запрос бюджет с учётом фактического использования.
        Вычисляет оставшиеся ресурсы после выполнения запроса.
        
        Args:
            budget: Бюджет для проверки
            usage: Фактическое использование
            estimated_tokens: Оценка количества токенов для запроса
            estimated_cost_rub: Оценка стоимости запроса в рублях
        
        Returns:
            BudgetDecision с решением и оставшимися ресурсами
        
        Examples:
            >>> evaluator = BudgetEvaluator()
            >>> 
            >>> budget = LLMBudget(
            ...     max_tokens=5000,
            ...     max_cost_rub=10.0,
            ...     soft_limit=False
            ... )
            >>> 
            >>> usage = UsageSummary(
            ...     total_tokens=3000,
            ...     total_cost_rub=5.0,
            ...     avg_latency_ms=1200
            ... )
            >>> 
            >>> decision = evaluator.evaluate(
            ...     budget=budget,
            ...     usage=usage,
            ...     estimated_tokens=1500,
            ...     estimated_cost_rub=2.0
            ... )
            >>> 
            >>> # Проверка результата
            >>> assert decision.allowed == True
            >>> assert decision.reason == "ok"
            >>> assert decision.remaining_tokens == 500
            >>> assert decision.remaining_budget_rub == 3.0
        """
        # Валидация входных данных
        if estimated_tokens < 0:
            raise ValueError(f"estimated_tokens must be >= 0, got {estimated_tokens}")
        if estimated_cost_rub < 0:
            raise ValueError(f"estimated_cost_rub must be >= 0, got {estimated_cost_rub}")
        
        # Вычисляем общее использование после запроса
        total_tokens_after = usage.total_tokens + estimated_tokens
        total_cost_after = usage.total_cost_rub + estimated_cost_rub
        
        # Вычисляем оставшиеся ресурсы
        remaining_tokens = budget.max_tokens - total_tokens_after
        remaining_budget_rub = budget.max_cost_rub - total_cost_after
        
        # Ограничиваем оставшиеся ресурсы снизу нулём (бюджет не уходит в минус)
        remaining_tokens = max(0, remaining_tokens)
        remaining_budget_rub = max(0.0, remaining_budget_rub)
        
        # Проверяем превышение лимитов
        tokens_exceeded = total_tokens_after > budget.max_tokens
        cost_exceeded = total_cost_after > budget.max_cost_rub
        limit_exceeded = tokens_exceeded or cost_exceeded
        
        # Принимаем решение
        if limit_exceeded:
            if budget.soft_limit:
                # Soft limit: разрешаем, но помечаем как превышение
                return BudgetDecision(
                    allowed=True,
                    reason="soft_limit_exceeded",
                    remaining_tokens=remaining_tokens,
                    remaining_budget_rub=remaining_budget_rub
                )
            else:
                # Hard limit: запрещаем
                return BudgetDecision(
                    allowed=False,
                    reason="hard_limit_exceeded",
                    remaining_tokens=remaining_tokens,
                    remaining_budget_rub=remaining_budget_rub
                )
        else:
            # Всё в порядке
            return BudgetDecision(
                allowed=True,
                reason="ok",
                remaining_tokens=remaining_tokens,
                remaining_budget_rub=remaining_budget_rub
            )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "BudgetEvaluator()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "BudgetEvaluator"


