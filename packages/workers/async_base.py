"""
Асинхронный базовый класс для воркеров.

Улучшает управление event loop и позволяет использовать async/await нативно.
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Optional

from packages.jobs import Job, JobResult

logger = logging.getLogger(__name__)


class AsyncBaseWorker(ABC):
    """
    Асинхронный базовый класс для воркеров.
    
    Преимущества перед BaseWorker:
    - Нативная поддержка async/await
    - Переиспользование event loop
    - Лучшая производительность
    - Упрощённый код
    """
    
    def __init__(self):
        """Инициализация воркера."""
        self._loop: Optional[asyncio.AbstractEventLoop] = None
    
    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        """
        Получает или создаёт event loop для воркера.
        
        Переиспользует существующий loop, если он активен.
        """
        if self._loop is None or self._loop.is_closed():
            try:
                # Пытаемся получить текущий loop
                self._loop = asyncio.get_event_loop()
            except RuntimeError:
                # Если нет текущего loop, создаём новый
                self._loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self._loop)
        
        return self._loop
    
    @abstractmethod
    def can_handle(self, job: Job) -> bool:
        """
        Проверяет, может ли воркер выполнить данную задачу.
        
        Args:
            job: Задача для проверки
        
        Returns:
            True, если воркер может выполнить задачу
        """
        pass
    
    @abstractmethod
    async def execute_async(self, job: Job) -> JobResult:
        """
        Асинхронно выполняет задачу.
        
        Args:
            job: Задача для выполнения
        
        Returns:
            JobResult с результатом выполнения
        
        Raises:
            Exception: Может выбрасывать любые исключения при ошибках
        """
        pass
    
    def execute(self, job: Job) -> JobResult:
        """
        Синхронная обёртка для execute_async.
        
        Обеспечивает совместимость с BaseWorker интерфейсом.
        
        Args:
            job: Задача для выполнения
        
        Returns:
            JobResult с результатом выполнения
        """
        try:
            # Запускаем асинхронную задачу в loop
            return self.loop.run_until_complete(self.execute_async(job))
        except Exception as e:
            logger.error(f"Error in {self.__class__.__name__}.execute: {e}", exc_info=True)
            raise
    
    def cleanup(self):
        """
        Очищает ресурсы воркера.
        
        Вызывается при завершении работы воркера.
        """
        if self._loop and not self._loop.is_closed():
            # Отменяем все pending задачи
            pending = asyncio.all_tasks(self._loop)
            for task in pending:
                task.cancel()
            
            # Даём задачам время на завершение
            if pending:
                self._loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
            
            # Закрываем loop
            self._loop.close()
            self._loop = None
    
    def __del__(self):
        """Деструктор для автоматической очистки."""
        self.cleanup()
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"{self.__class__.__name__}()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"{self.__class__.__name__}"
