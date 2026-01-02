"""
Временное in-memory хранилище для Generation.

ВНИМАНИЕ: Это временное хранилище для разработки и тестирования.
В production должно быть заменено на реальную БД.
"""

import asyncio
from typing import Optional
from uuid import UUID

from packages.core_domain import Generation


class InMemoryGenerationStore:
    """
    In-memory хранилище для Generation.
    
    Использует словарь для хранения генераций в памяти.
    Данные теряются при перезапуске приложения.
    """
    
    def __init__(self):
        """Инициализация хранилища."""
        self._storage: dict[UUID, Generation] = {}
        # Pub/sub для SSE: generation_id -> list[asyncio.Queue]
        self._subscribers: dict[UUID, list[asyncio.Queue]] = {}
    
    def create(self, generation: Generation) -> Generation:
        """
        Сохраняет Generation в хранилище.
        
        Args:
            generation: Объект Generation для сохранения
        
        Returns:
            Сохранённый объект Generation
        
        Raises:
            ValueError: Если generation с таким id уже существует
        """
        if generation.id in self._storage:
            raise ValueError(f"Generation with id {generation.id} already exists")
        
        self._storage[generation.id] = generation
        return generation
    
    def get(self, generation_id: UUID) -> Optional[Generation]:
        """
        Получает Generation по идентификатору.
        
        Args:
            generation_id: UUID генерации
        
        Returns:
            Объект Generation или None, если не найдено
        """
        return self._storage.get(generation_id)
    
    def get_all(self) -> list[Generation]:
        """
        Получает все Generation из хранилища.
        
        Returns:
            Список всех Generation
        """
        return list(self._storage.values())
    
    def update(self, generation_id: UUID, **updates) -> Generation:
        """
        Обновляет Generation в хранилище.
        
        Args:
            generation_id: UUID генерации для обновления
            **updates: Поля для обновления (kwargs)
        
        Returns:
            Обновлённый объект Generation
        
        Raises:
            ValueError: Если generation с таким id не существует
        """
        if generation_id not in self._storage:
            raise ValueError(f"Generation with id {generation_id} not found")
        
        generation = self._storage[generation_id]
        
        # Создаём обновлённую копию с переданными полями
        update_data = {**generation.model_dump(), **updates}
        updated_generation = Generation(**update_data)
        
        # Сохраняем обновлённую версию
        self._storage[generation_id] = updated_generation
        
        # Отправляем обновление всем подписчикам
        if generation_id in self._subscribers:
            event_data = {
                "id": str(updated_generation.id),
                "status": updated_generation.status.value,
                "updated_at": updated_generation.updated_at.isoformat(),
            }
            
            # Отправляем в каждую очередь (неблокирующе)
            for queue in self._subscribers[generation_id]:
                try:
                    queue.put_nowait(event_data)
                except asyncio.QueueFull:
                    # Если очередь переполнена, пропускаем
                    pass
        
        return updated_generation
    
    def save(self, generation: Generation) -> Generation:
        """
        Сохраняет или обновляет Generation в хранилище.
        
        Используется для сохранения Generation после state transitions.
        Отправляет обновления всем подписчикам через pub/sub.
        
        Args:
            generation: Объект Generation для сохранения
        
        Returns:
            Сохранённый объект Generation
        """
        self._storage[generation.id] = generation
        
        # Отправляем обновление всем подписчикам
        if generation.id in self._subscribers:
            event_data = {
                "id": str(generation.id),
                "status": generation.status.value,
                "updated_at": generation.updated_at.isoformat(),
            }
            
            # Отправляем в каждую очередь (неблокирующе)
            for queue in self._subscribers[generation.id]:
                try:
                    queue.put_nowait(event_data)
                except asyncio.QueueFull:
                    # Если очередь переполнена, пропускаем
                    pass
        
        return generation
    
    def subscribe(self, generation_id: UUID) -> asyncio.Queue:
        """
        Подписывается на обновления Generation.
        
        Создаёт очередь для получения событий обновления Generation.
        События отправляются при вызове save().
        
        Args:
            generation_id: UUID генерации для подписки
        
        Returns:
            asyncio.Queue для получения событий
        
        Note:
            Необходимо вызвать unsubscribe() при отключении клиента.
        """
        if generation_id not in self._subscribers:
            self._subscribers[generation_id] = []
        
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers[generation_id].append(queue)
        
        return queue
    
    def unsubscribe(self, generation_id: UUID, queue: asyncio.Queue) -> None:
        """
        Отписывается от обновлений Generation.
        
        Удаляет очередь из списка подписчиков.
        
        Args:
            generation_id: UUID генерации
            queue: Очередь для удаления
        """
        if generation_id in self._subscribers:
            try:
                self._subscribers[generation_id].remove(queue)
            except ValueError:
                pass
            
            # Удаляем пустой список подписчиков
            if not self._subscribers[generation_id]:
                del self._subscribers[generation_id]


    def clear(self) -> None:
        """
        Очищает хранилище (для тестирования).
        
        Удаляет все Generation и отписывает всех подписчиков.
        """
        self._storage.clear()
        self._subscribers.clear()


# Глобальный экземпляр хранилища
# В production это должно быть заменено на dependency injection
generation_store = InMemoryGenerationStore()

