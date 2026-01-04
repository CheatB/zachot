"""
Пакет LLM адаптеров для системы zachot.

Определяет интерфейсы для работы с различными LLM провайдерами.
Все конкретные реализации (OpenAI, DeepSeek, Perplexity) должны соответствовать этим контрактам.

Использование в воркерах:
    >>> from packages.llm import LLMAdapter, PromptBundle, OutputSchema, LLMBudget, LLMResult
    >>> 
    >>> # Создать адаптер (конкретная реализация)
    >>> adapter = OpenAIAdapter(api_key="...")
    >>> 
    >>> # Выполнить запрос
    >>> result = adapter.execute(prompt, schema, budget=budget)
"""

from .base import (
    LLMAdapter,
    LLMBudget,
    LLMResult,
    OutputSchema,
    PromptBundle,
)

__all__ = [
    "LLMAdapter",
    "PromptBundle",
    "OutputSchema",
    "LLMBudget",
    "LLMResult",
]


