"""
Circuit breaker для защиты от каскадных сбоев.

Предотвращает выполнение задач, когда система находится в нестабильном состоянии.
"""

import logging
from collections import deque
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Circuit breaker с sliding window логикой.
    
    Отслеживает успешные и неуспешные выполнения в окне времени.
    Открывается (блокирует выполнение) при превышении порога ошибок.
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        window_size_seconds: int = 60,
    ):
        """
        Инициализация circuit breaker.
        
        Args:
            failure_threshold: Количество ошибок для открытия breaker'а
            window_size_seconds: Размер окна времени в секундах для подсчёта ошибок
        """
        self.failure_threshold = failure_threshold
        self.window_size_seconds = window_size_seconds
        
        # Sliding window: храним временные метки успехов и ошибок
        self._successes: deque[datetime] = deque()
        self._failures: deque[datetime] = deque()
        
        # Состояние breaker'а
        self._is_open: bool = False
        self._opened_at: Optional[datetime] = None
    
    def record_success(self) -> None:
        """
        Записывает успешное выполнение.
        
        Добавляет временную метку успеха в sliding window.
        Если breaker был открыт, может закрыть его при достаточном количестве успехов.
        """
        now = datetime.now()
        self._successes.append(now)
        
        # Очищаем старые записи вне окна
        self._clean_old_records()
        
        # Если breaker открыт, проверяем, можно ли закрыть
        if self._is_open:
            # Простая логика: если есть успехи, закрываем
            # В более сложной реализации можно требовать N успехов подряд
            if len(self._successes) > 0:
                logger.info("Circuit breaker: closing after success")
                self._is_open = False
                self._opened_at = None
    
    def record_failure(self) -> None:
        """
        Записывает неуспешное выполнение.
        
        Добавляет временную метку ошибки в sliding window.
        Если количество ошибок превышает порог, открывает breaker.
        """
        now = datetime.now()
        self._failures.append(now)
        
        # Очищаем старые записи вне окна
        self._clean_old_records()
        
        # Проверяем, нужно ли открыть breaker
        if len(self._failures) >= self.failure_threshold:
            if not self._is_open:
                logger.warning(
                    f"Circuit breaker: opening after {len(self._failures)} failures "
                    f"(threshold: {self.failure_threshold})"
                )
                self._is_open = True
                self._opened_at = now
    
    def is_open(self) -> bool:
        """
        Проверяет, открыт ли circuit breaker.
        
        Returns:
            True, если breaker открыт (выполнение блокируется), False в противном случае
        """
        # Очищаем старые записи перед проверкой
        self._clean_old_records()
        
        # Если нет ошибок в окне, закрываем breaker
        if len(self._failures) == 0 and self._is_open:
            logger.info("Circuit breaker: closing (no failures in window)")
            self._is_open = False
            self._opened_at = None
        
        return self._is_open
    
    def _clean_old_records(self) -> None:
        """
        Очищает записи, выходящие за пределы окна времени.
        
        Удаляет временные метки успехов и ошибок, которые старше window_size_seconds.
        """
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_size_seconds)
        
        # Очищаем старые успехи
        while self._successes and self._successes[0] < cutoff:
            self._successes.popleft()
        
        # Очищаем старые ошибки
        while self._failures and self._failures[0] < cutoff:
            self._failures.popleft()
    
    def get_stats(self) -> dict:
        """
        Возвращает статистику circuit breaker.
        
        Returns:
            Словарь со статистикой: is_open, successes, failures, opened_at
        """
        self._clean_old_records()
        
        return {
            "is_open": self._is_open,
            "successes": len(self._successes),
            "failures": len(self._failures),
            "failure_threshold": self.failure_threshold,
            "window_size_seconds": self.window_size_seconds,
            "opened_at": self._opened_at.isoformat() if self._opened_at else None,
        }
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"CircuitBreaker(failure_threshold={self.failure_threshold}, "
            f"window_size={self.window_size_seconds}s, "
            f"is_open={self._is_open})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "OPEN" if self._is_open else "CLOSED"
        return (
            f"CircuitBreaker({status}, "
            f"failures={len(self._failures)}/{self.failure_threshold})"
        )



