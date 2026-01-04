"""
Пакет Cost Model для LLM экономики.

Предоставляет ядро расчёта стоимости использования LLM провайдеров.
Независимо от конкретных провайдеров, только чистая математика.

Использование:
    >>> from packages.llm_economics import TokenCost, CostCalculationInput, CostCalculator
    >>> 
    >>> # Определить ценообразование для модели
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
    >>> print(f"Total cost: {result.total_cost_rub} RUB")
    Total cost: 0.93 RUB
"""

from .cost_model import (
    CostCalculationInput,
    CostCalculationResult,
    CostCalculator,
    TokenCost,
)
from .usage import UsageAccumulator, UsageRecord, UsageSummary
from .budget import BudgetDecision, BudgetEvaluator
from .pricing import PricingPreset, get_pricing_preset, list_pricing_presets

__all__ = [
    # Cost Model
    "TokenCost",
    "CostCalculationInput",
    "CostCalculationResult",
    "CostCalculator",
    # Usage Accounting
    "UsageRecord",
    "UsageSummary",
    "UsageAccumulator",
    # Budget Enforcement
    "BudgetDecision",
    "BudgetEvaluator",
    # Pricing Presets
    "PricingPreset",
    "get_pricing_preset",
    "list_pricing_presets",
]

