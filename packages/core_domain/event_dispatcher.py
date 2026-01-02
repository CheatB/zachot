"""
Event dispatcher для публикации и подписки на domain events.

Реализует простой in-memory pub/sub механизм для domain events.
Не использует очереди или внешние системы - только in-memory callbacks.
"""

import logging
from typing import Callable, List

from .events import DomainEvent

logger = logging.getLogger(__name__)


class DomainEventDispatcher:
    """
    Dispatcher для публикации и подписки на domain events.
    
    Реализует простой in-memory pub/sub механизм.
    Подписчики получают события синхронно при публикации.
    
    ВНИМАНИЕ: Это in-memory реализация для разработки.
    В production может быть заменена на очередь событий.
    """
    
    def __init__(self):
        """Инициализация dispatcher."""
        self._subscribers: List[Callable[[DomainEvent], None]] = []
    
    def subscribe(self, callback: Callable[[DomainEvent], None]) -> None:
        """
        Подписывается на все domain events.
        
        Args:
            callback: Функция-обработчик событий
        
        Examples:
            >>> dispatcher = DomainEventDispatcher()
            >>> def handle_event(event: DomainEvent):
            ...     print(f"Event: {event}")
            >>> dispatcher.subscribe(handle_event)
        """
        if callback not in self._subscribers:
            self._subscribers.append(callback)
            logger.debug(f"Subscriber registered: {callback.__name__}")
    
    def unsubscribe(self, callback: Callable[[DomainEvent], None]) -> None:
        """
        Отписывается от событий.
        
        Args:
            callback: Функция-обработчик для удаления
        """
        try:
            self._subscribers.remove(callback)
            logger.debug(f"Subscriber unregistered: {callback.__name__}")
        except ValueError:
            pass
    
    def publish(self, event: DomainEvent) -> None:
        """
        Публикует domain event всем подписчикам.
        
        Вызывает все зарегистрированные callback'и синхронно.
        Если callback выбрасывает исключение, оно логируется, но не прерывает
        обработку других подписчиков.
        
        Args:
            event: Событие для публикации
        
        Examples:
            >>> dispatcher = DomainEventDispatcher()
            >>> event = GenerationUpdated(generation_id=uuid4(), status=GenerationStatus.RUNNING)
            >>> dispatcher.publish(event)
        """
        logger.debug(f"Publishing event: {event}")
        
        for callback in self._subscribers:
            try:
                callback(event)
            except Exception as e:
                logger.error(
                    f"Error in event subscriber {callback.__name__}: {e}",
                    exc_info=True
                )
    
    def get_subscribers_count(self) -> int:
        """
        Возвращает количество подписчиков.
        
        Returns:
            Количество зарегистрированных подписчиков
        """
        return len(self._subscribers)
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"DomainEventDispatcher(subscribers={len(self._subscribers)})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"DomainEventDispatcher with {len(self._subscribers)} subscriber(s)"


# Глобальный экземпляр dispatcher
# В production это должно быть заменено на dependency injection
event_dispatcher = DomainEventDispatcher()

