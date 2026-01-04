"""
In-memory хранилище записей о стоимости (CostStore).

Временное хранилище для учета стоимости. В будущем может быть заменено
на персистентное хранилище (БД, Redis и т.д.).
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from .record import CostRecord


class CostStore:
    """
    In-memory хранилище записей о стоимости.
    
    Временное хранилище для учета стоимости выполнения задач.
    Хранит записи в памяти. В будущем может быть заменено на персистентное хранилище.
    
    Examples:
        >>> store = CostStore()
        >>> 
        >>> # Добавить запись
        >>> record = CostRecord(
        ...     job_id=UUID("..."),
        ...     generation_id=UUID("..."),
        ...     provider_name="openai",
        ...     tokens_used=1500,
        ...     latency_ms=1200,
        ...     cost_rub=0.15
        ... )
        >>> store.add(record)
        >>> 
        >>> # Получить все записи
        >>> all_records = store.list()
        >>> print(f"Total records: {len(all_records)}")
        Total records: 1
        >>> 
        >>> # Фильтровать по generation_id
        >>> generation_records = store.filter(generation_id=generation_id)
        >>> 
        >>> # Фильтровать по user_id
        >>> user_records = store.filter(user_id=user_id)
        >>> 
        >>> # Фильтровать по периоду
        >>> from datetime import datetime, timedelta
        >>> date_from = datetime.now() - timedelta(days=7)
        >>> date_to = datetime.now()
        >>> period_records = store.filter(date_from=date_from, date_to=date_to)
    """
    
    def __init__(self):
        """Инициализация хранилища."""
        self._records: List[CostRecord] = []
    
    def add(self, record: CostRecord) -> None:
        """
        Добавляет запись в хранилище.
        
        Args:
            record: Запись о стоимости для добавления
        
        Examples:
            >>> store = CostStore()
            >>> record = CostRecord(...)
            >>> store.add(record)
        """
        self._records.append(record)
    
    def list(self) -> List[CostRecord]:
        """
        Возвращает все записи в хранилище.
        
        Returns:
            Список всех записей
        
        Examples:
            >>> store = CostStore()
            >>> records = store.list()
            >>> print(f"Total: {len(records)} records")
        """
        return self._records.copy()
    
    def filter(
        self,
        generation_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[CostRecord]:
        """
        Фильтрует записи по заданным критериям.
        
        Args:
            generation_id: Фильтр по идентификатору генерации
            user_id: Фильтр по идентификатору пользователя
            date_from: Начало периода (включительно)
            date_to: Конец периода (включительно)
        
        Returns:
            Список отфильтрованных записей
        
        Examples:
            >>> store = CostStore()
            >>> 
            >>> # Фильтр по generation_id
            >>> records = store.filter(generation_id=UUID("..."))
            >>> 
            >>> # Фильтр по user_id
            >>> records = store.filter(user_id=UUID("..."))
            >>> 
            >>> # Фильтр по периоду
            >>> from datetime import datetime, timedelta
            >>> date_from = datetime.now() - timedelta(days=7)
            >>> date_to = datetime.now()
            >>> records = store.filter(date_from=date_from, date_to=date_to)
            >>> 
            >>> # Комбинированный фильтр
            >>> records = store.filter(
            ...     generation_id=UUID("..."),
            ...     user_id=UUID("..."),
            ...     date_from=date_from,
            ...     date_to=date_to
            ... )
        """
        filtered = self._records
        
        if generation_id is not None:
            filtered = [r for r in filtered if r.generation_id == generation_id]
        
        if user_id is not None:
            filtered = [r for r in filtered if r.user_id == user_id]
        
        if date_from is not None:
            filtered = [r for r in filtered if r.recorded_at >= date_from]
        
        if date_to is not None:
            filtered = [r for r in filtered if r.recorded_at <= date_to]
        
        return filtered
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"CostStore(records={len(self._records)})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"CostStore({len(self._records)} records)"


