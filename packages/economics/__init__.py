"""
Пакет Cost Accounting для системы zachot.

Предоставляет слой учета стоимости выполнения задач независимо от LLM провайдера.
Собирает, хранит и агрегирует данные о стоимости использования LLM.

Использование:
    >>> from packages.economics import CostCollector, CostStore, CostAggregator
    >>> from packages.jobs import JobResult
    >>> 
    >>> # Создать компоненты
    >>> collector = CostCollector()
    >>> store = CostStore()
    >>> aggregator = CostAggregator(store)
    >>> 
    >>> # После выполнения задачи
    >>> job_result = worker.execute(job)
    >>> 
    >>> # Собрать данные о стоимости
    >>> cost_record = collector.collect(
    ...     job_result=job_result,
    ...     generation_id=job.generation_id,
    ...     user_id=user_id  # опционально
    ... )
    >>> 
    >>> # Сохранить запись
    >>> store.add(cost_record)
    >>> 
    >>> # Агрегировать данные
    >>> total = aggregator.total_cost_for_generation(generation_id)
    >>> print(f"Total cost: {total} RUB")
"""

from .collector import CostCollector
from .record import CostRecord
from .store import CostStore
from .aggregator import CostAggregator

__all__ = [
    "CostRecord",
    "CostCollector",
    "CostStore",
    "CostAggregator",
]


