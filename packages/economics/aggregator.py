"""
Агрегатор данных о стоимости (CostAggregator).

Вычисляет агрегированные метрики стоимости по различным критериям.
"""

from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from .store import CostStore


class CostAggregator:
    """
    Агрегатор данных о стоимости.
    
    Вычисляет агрегированные метрики стоимости на основе данных из CostStore.
    Предоставляет методы для подсчета общей стоимости по различным критериям.
    
    Examples:
        >>> store = CostStore()
        >>> aggregator = CostAggregator(store)
        >>> 
        >>> # Общая стоимость для генерации
        >>> total = aggregator.total_cost_for_generation(generation_id)
        >>> print(f"Total cost: {total} RUB")
        Total cost: 1.50 RUB
        >>> 
        >>> # Общая стоимость для пользователя
        >>> total = aggregator.total_cost_for_user(user_id)
        >>> print(f"Total cost: {total} RUB")
        Total cost: 10.00 RUB
        >>> 
        >>> # Общая стоимость за период
        >>> from datetime import datetime, timedelta
        >>> date_from = datetime.now() - timedelta(days=7)
        >>> date_to = datetime.now()
        >>> total = aggregator.total_cost_for_period(date_from, date_to)
        >>> print(f"Total cost: {total} RUB")
        Total cost: 50.00 RUB
    """
    
    def __init__(self, store: CostStore):
        """
        Инициализация агрегатора.
        
        Args:
            store: Хранилище записей о стоимости
        """
        self.store = store
    
    def total_cost_for_generation(self, generation_id: UUID) -> float:
        """
        Вычисляет общую стоимость для генерации.
        
        Суммирует стоимость всех записей, связанных с указанной генерацией.
        
        Args:
            generation_id: Идентификатор генерации
        
        Returns:
            Общая стоимость в рублях
        
        Examples:
            >>> aggregator = CostAggregator(store)
            >>> total = aggregator.total_cost_for_generation(generation_id)
            >>> print(f"Total cost for generation: {total:.2f} RUB")
            Total cost for generation: 1.50 RUB
        """
        records = self.store.filter(generation_id=generation_id)
        return sum(record.cost_rub for record in records)
    
    def total_cost_for_user(self, user_id: UUID) -> float:
        """
        Вычисляет общую стоимость для пользователя.
        
        Суммирует стоимость всех записей, связанных с указанным пользователем.
        
        Args:
            user_id: Идентификатор пользователя
        
        Returns:
            Общая стоимость в рублях
        
        Examples:
            >>> aggregator = CostAggregator(store)
            >>> total = aggregator.total_cost_for_user(user_id)
            >>> print(f"Total cost for user: {total:.2f} RUB")
            Total cost for user: 10.00 RUB
        """
        records = self.store.filter(user_id=user_id)
        return sum(record.cost_rub for record in records)
    
    def total_cost_for_period(
        self,
        date_from: datetime,
        date_to: datetime
    ) -> float:
        """
        Вычисляет общую стоимость за период.
        
        Суммирует стоимость всех записей в указанном периоде.
        
        Args:
            date_from: Начало периода (включительно)
            date_to: Конец периода (включительно)
        
        Returns:
            Общая стоимость в рублях
        
        Examples:
            >>> from datetime import datetime, timedelta
            >>> aggregator = CostAggregator(store)
            >>> 
            >>> date_from = datetime.now() - timedelta(days=7)
            >>> date_to = datetime.now()
            >>> total = aggregator.total_cost_for_period(date_from, date_to)
            >>> print(f"Total cost for period: {total:.2f} RUB")
            Total cost for period: 50.00 RUB
        """
        records = self.store.filter(date_from=date_from, date_to=date_to)
        return sum(record.cost_rub for record in records)
    
    def stats_for_generation(self, generation_id: UUID) -> Dict[str, float]:
        """
        Вычисляет статистику для генерации.
        
        Возвращает словарь с агрегированными метриками:
        - total_cost_rub: общая стоимость
        - total_tokens: общее количество токенов
        - total_latency_ms: общая латентность
        - avg_cost_per_token: средняя стоимость за токен
        
        Args:
            generation_id: Идентификатор генерации
        
        Returns:
            Словарь со статистикой
        
        Examples:
            >>> aggregator = CostAggregator(store)
            >>> stats = aggregator.stats_for_generation(generation_id)
            >>> print(f"Total cost: {stats['total_cost_rub']} RUB")
            >>> print(f"Total tokens: {stats['total_tokens']}")
        """
        records = self.store.filter(generation_id=generation_id)
        
        if not records:
            return {
                "total_cost_rub": 0.0,
                "total_tokens": 0,
                "total_latency_ms": 0,
                "avg_cost_per_token": 0.0
            }
        
        total_cost = sum(r.cost_rub for r in records)
        total_tokens = sum(r.tokens_used for r in records)
        total_latency = sum(r.latency_ms for r in records)
        avg_cost_per_token = total_cost / total_tokens if total_tokens > 0 else 0.0
        
        return {
            "total_cost_rub": total_cost,
            "total_tokens": total_tokens,
            "total_latency_ms": total_latency,
            "avg_cost_per_token": avg_cost_per_token
        }
    
    def stats_for_user(self, user_id: UUID) -> Dict[str, float]:
        """
        Вычисляет статистику для пользователя.
        
        Возвращает словарь с агрегированными метриками:
        - total_cost_rub: общая стоимость
        - total_tokens: общее количество токенов
        - total_latency_ms: общая латентность
        - avg_cost_per_token: средняя стоимость за токен
        
        Args:
            user_id: Идентификатор пользователя
        
        Returns:
            Словарь со статистикой
        
        Examples:
            >>> aggregator = CostAggregator(store)
            >>> stats = aggregator.stats_for_user(user_id)
            >>> print(f"Total cost: {stats['total_cost_rub']} RUB")
        """
        records = self.store.filter(user_id=user_id)
        
        if not records:
            return {
                "total_cost_rub": 0.0,
                "total_tokens": 0,
                "total_latency_ms": 0,
                "avg_cost_per_token": 0.0
            }
        
        total_cost = sum(r.cost_rub for r in records)
        total_tokens = sum(r.tokens_used for r in records)
        total_latency = sum(r.latency_ms for r in records)
        avg_cost_per_token = total_cost / total_tokens if total_tokens > 0 else 0.0
        
        return {
            "total_cost_rub": total_cost,
            "total_tokens": total_tokens,
            "total_latency_ms": total_latency,
            "avg_cost_per_token": avg_cost_per_token
        }
    
    def stats_for_period(
        self,
        date_from: datetime,
        date_to: datetime
    ) -> Dict[str, float]:
        """
        Вычисляет статистику за период.
        
        Возвращает словарь с агрегированными метриками:
        - total_cost_rub: общая стоимость
        - total_tokens: общее количество токенов
        - total_latency_ms: общая латентность
        - avg_cost_per_token: средняя стоимость за токен
        
        Args:
            date_from: Начало периода (включительно)
            date_to: Конец периода (включительно)
        
        Returns:
            Словарь со статистикой
        
        Examples:
            >>> from datetime import datetime, timedelta
            >>> aggregator = CostAggregator(store)
            >>> 
            >>> date_from = datetime.now() - timedelta(days=7)
            >>> date_to = datetime.now()
            >>> stats = aggregator.stats_for_period(date_from, date_to)
            >>> print(f"Total cost: {stats['total_cost_rub']} RUB")
        """
        records = self.store.filter(date_from=date_from, date_to=date_to)
        
        if not records:
            return {
                "total_cost_rub": 0.0,
                "total_tokens": 0,
                "total_latency_ms": 0,
                "avg_cost_per_token": 0.0
            }
        
        total_cost = sum(r.cost_rub for r in records)
        total_tokens = sum(r.tokens_used for r in records)
        total_latency = sum(r.latency_ms for r in records)
        avg_cost_per_token = total_cost / total_tokens if total_tokens > 0 else 0.0
        
        return {
            "total_cost_rub": total_cost,
            "total_tokens": total_tokens,
            "total_latency_ms": total_latency,
            "avg_cost_per_token": avg_cost_per_token
        }
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"CostAggregator(store={self.store})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"CostAggregator"


