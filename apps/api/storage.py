"""
Временное in-memory хранилище для Generation.

ВНИМАНИЕ: Это временное хранилище для разработки и тестирования.
В production должно быть заменено на реальную БД.
"""

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
        return updated_generation


# Глобальный экземпляр хранилища
# В production это должно быть заменено на dependency injection
generation_store = InMemoryGenerationStore()

