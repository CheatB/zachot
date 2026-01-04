"""
Pricing Presets - преднастройки лимитов для тарифных планов.

Предоставляет конфигурацию лимитов для различных тарифных планов.
Используется для создания LLMBudget на основе выбранного тарифа.

Это конфигурация, не бизнес-логика. Реального биллинга пока нет.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from packages.llm.base import LLMBudget


class PricingPreset(BaseModel):
    """
    Пресет лимитов для тарифного плана.
    
    Содержит месячные лимиты и настройки для тарифного плана.
    Используется для создания LLMBudget.
    
    Attributes:
        plan_name: Название тарифного плана
        monthly_token_limit: Месячный лимит токенов
        monthly_cost_limit_rub: Месячный лимит стоимости в рублях
        soft_limit: Мягкий лимит (предупреждение) или жесткий (блокировка)
        description: Описание тарифного плана
    
    Examples:
        >>> preset = PricingPreset(
        ...     plan_name="FREE",
        ...     monthly_token_limit=10000,
        ...     monthly_cost_limit_rub=0.0,
        ...     soft_limit=False,
        ...     description="Бесплатный тариф"
        ... )
    """
    
    plan_name: str = Field(..., description="Название тарифного плана")
    monthly_token_limit: int = Field(..., gt=0, description="Месячный лимит токенов")
    monthly_cost_limit_rub: float = Field(..., ge=0.0, description="Месячный лимит стоимости в рублях")
    soft_limit: bool = Field(..., description="Мягкий лимит (предупреждение) или жесткий (блокировка)")
    description: str = Field(..., description="Описание тарифного плана")
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def to_budget(self) -> LLMBudget:
        """
        Преобразует пресет в LLMBudget.
        
        Returns:
            LLMBudget с лимитами из пресета
        
        Examples:
            >>> preset = PricingPreset(...)
            >>> budget = preset.to_budget()
        """
        return LLMBudget(
            max_tokens=self.monthly_token_limit,
            max_cost_rub=self.monthly_cost_limit_rub,
            soft_limit=self.soft_limit
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        limit_type = "soft" if self.soft_limit else "hard"
        return (
            f"PricingPreset(plan={self.plan_name!r}, "
            f"tokens={self.monthly_token_limit}, cost={self.monthly_cost_limit_rub} RUB, "
            f"limit={limit_type})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"PricingPreset[{self.plan_name}] ({self.description})"


# Пресеты тарифных планов
PRICING_PRESETS: dict[str, PricingPreset] = {
    "FREE": PricingPreset(
        plan_name="FREE",
        monthly_token_limit=10000,
        monthly_cost_limit_rub=0.0,
        soft_limit=False,
        description="Бесплатный тариф. Ограниченное использование для тестирования."
    ),
    "BASE_499": PricingPreset(
        plan_name="BASE_499",
        monthly_token_limit=100000,
        monthly_cost_limit_rub=499.0,
        soft_limit=True,
        description="Базовый тариф. До 100k токенов в месяц или 499 RUB."
    ),
    "PRO": PricingPreset(
        plan_name="PRO",
        monthly_token_limit=1000000,
        monthly_cost_limit_rub=4999.0,
        soft_limit=True,
        description="Профессиональный тариф. До 1M токенов в месяц или 4999 RUB."
    ),
}


def get_pricing_preset(plan_name: str) -> LLMBudget:
    """
    Получает LLMBudget для указанного тарифного плана.
    
    Возвращает бюджет на основе преднастроенных пресетов тарифов.
    Если план не найден, выбрасывает ValueError.
    
    Args:
        plan_name: Название тарифного плана ("FREE", "BASE_499", "PRO")
    
    Returns:
        LLMBudget с лимитами для указанного тарифа
    
    Raises:
        ValueError: Если план не найден
    
    Examples:
        >>> # Получить бюджет для бесплатного тарифа
        >>> budget = get_pricing_preset("FREE")
        >>> print(f"Max tokens: {budget.max_tokens}")
        Max tokens: 10000
        >>> 
        >>> # Получить бюджет для базового тарифа
        >>> budget = get_pricing_preset("BASE_499")
        >>> print(f"Max cost: {budget.max_cost_rub} RUB")
        Max cost: 499.0 RUB
        >>> 
        >>> # Использование в BudgetEvaluator
        >>> from packages.llm_economics import UsageSummary, BudgetEvaluator
        >>> 
        >>> budget = get_pricing_preset("PRO")
        >>> usage = UsageSummary(
        ...     total_tokens=500000,
        ...     total_cost_rub=2000.0,
        ...     avg_latency_ms=1200
        ... )
        >>> 
        >>> evaluator = BudgetEvaluator()
        >>> decision = evaluator.evaluate(
        ...     budget=budget,
        ...     usage=usage,
        ...     estimated_tokens=200000,
        ...     estimated_cost_rub=1000.0
        ... )
    """
    preset = PRICING_PRESETS.get(plan_name.upper())
    
    if preset is None:
        available_plans = ", ".join(PRICING_PRESETS.keys())
        raise ValueError(
            f"Unknown pricing plan: {plan_name}. "
            f"Available plans: {available_plans}"
        )
    
    return preset.to_budget()


def list_pricing_presets() -> list[PricingPreset]:
    """
    Возвращает список всех доступных пресетов тарифов.
    
    Returns:
        Список всех PricingPreset
    
    Examples:
        >>> presets = list_pricing_presets()
        >>> for preset in presets:
        ...     print(f"{preset.plan_name}: {preset.description}")
    """
    return list(PRICING_PRESETS.values())


