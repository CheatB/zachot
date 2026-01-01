"""
State machine для управления переходами статусов Generation.

Обеспечивает строгий контроль жизненного цикла генерации,
запрещая недопустимые переходы между статусами.
"""

from datetime import datetime
from typing import Dict, Set

from .enums import GenerationStatus
from .generation import Generation


class InvalidGenerationTransitionError(Exception):
    """
    Исключение, выбрасываемое при попытке недопустимого перехода статуса Generation.
    
    Attributes:
        from_status: Исходный статус
        to_status: Целевой статус
        message: Сообщение об ошибке
    """
    
    def __init__(self, from_status: GenerationStatus, to_status: GenerationStatus):
        self.from_status = from_status
        self.to_status = to_status
        self.message = (
            f"Invalid transition from {from_status.value} to {to_status.value}. "
            f"Use GenerationStateMachine.can_transition() to check allowed transitions."
        )
        super().__init__(self.message)
    
    def __repr__(self) -> str:
        return f"InvalidGenerationTransitionError({self.from_status.value} → {self.to_status.value})"
    
    def __str__(self) -> str:
        return self.message


class GenerationStateMachine:
    """
    State machine для управления переходами статусов Generation.
    
    Определяет допустимые переходы между статусами и обеспечивает
    их строгое соблюдение при изменении статуса генерации.
    
    Допустимые переходы:
    - DRAFT → RUNNING
    - RUNNING → WAITING_USER
    - WAITING_USER → RUNNING
    - RUNNING → GENERATED
    - GENERATED → EXPORTED
    - RUNNING → FAILED
    - WAITING_USER → FAILED
    - FAILED → RUNNING (retry)
    - * → CANCELED (из любого статуса можно отменить)
    """
    
    # Матрица допустимых переходов: from_status -> set(to_statuses)
    _ALLOWED_TRANSITIONS: Dict[GenerationStatus, Set[GenerationStatus]] = {
        GenerationStatus.DRAFT: {
            GenerationStatus.RUNNING,
            GenerationStatus.CANCELED,
        },
        GenerationStatus.RUNNING: {
            GenerationStatus.WAITING_USER,
            GenerationStatus.GENERATED,
            GenerationStatus.FAILED,
            GenerationStatus.CANCELED,
        },
        GenerationStatus.WAITING_USER: {
            GenerationStatus.RUNNING,
            GenerationStatus.FAILED,
            GenerationStatus.CANCELED,
        },
        GenerationStatus.GENERATED: {
            GenerationStatus.EXPORTED,
            GenerationStatus.CANCELED,
        },
        GenerationStatus.EXPORTED: {
            GenerationStatus.CANCELED,
        },
        GenerationStatus.FAILED: {
            GenerationStatus.RUNNING,  # retry
            GenerationStatus.CANCELED,
        },
        GenerationStatus.CANCELED: set(),  # Финальный статус, переходы невозможны
    }
    
    @classmethod
    def can_transition(cls, from_status: GenerationStatus, to_status: GenerationStatus) -> bool:
        """
        Проверяет, допустим ли переход из одного статуса в другой.
        
        Args:
            from_status: Исходный статус
            to_status: Целевой статус
        
        Returns:
            True, если переход допустим, False в противном случае
        
        Examples:
            >>> GenerationStateMachine.can_transition(GenerationStatus.DRAFT, GenerationStatus.RUNNING)
            True
            >>> GenerationStateMachine.can_transition(GenerationStatus.DRAFT, GenerationStatus.GENERATED)
            False
        """
        # Переход в тот же статус всегда допустим (idempotency)
        if from_status == to_status:
            return True
        
        # Проверяем, есть ли целевой статус в списке допустимых для исходного
        allowed_targets = cls._ALLOWED_TRANSITIONS.get(from_status, set())
        return to_status in allowed_targets
    
    @classmethod
    def transition(cls, generation: Generation, to_status: GenerationStatus) -> Generation:
        """
        Выполняет переход статуса Generation с валидацией и обновлением временных меток.
        
        Метод:
        1. Проверяет допустимость перехода
        2. Обновляет статус
        3. При переходе в RUNNING:
           - устанавливает started_at (если еще не установлен)
           - сбрасывает finished_at (для retry сценариев)
        4. Устанавливает finished_at при переходе в финальные статусы
        5. Обновляет updated_at
        
        Args:
            generation: Объект Generation для обновления
            to_status: Целевой статус
        
        Returns:
            Новый объект Generation с обновленным статусом и временными метками
        
        Raises:
            InvalidGenerationTransitionError: Если переход недопустим
        
        Examples:
            >>> generation = Generation(...)
            >>> updated = GenerationStateMachine.transition(generation, GenerationStatus.RUNNING)
        """
        from_status = generation.status
        
        # Проверка допустимости перехода
        if not cls.can_transition(from_status, to_status):
            raise InvalidGenerationTransitionError(from_status, to_status)
        
        # Если переход в тот же статус, просто обновляем updated_at
        if from_status == to_status:
            return generation.model_copy(update={"updated_at": datetime.now()})
        
        # Подготовка данных для обновления
        update_data: dict = {
            "status": to_status,
            "updated_at": datetime.now(),
        }
        
        # Логика обновления временных меток в зависимости от целевого статуса
        now = datetime.now()
        
        # При переходе в RUNNING:
        # - устанавливаем started_at (если еще не установлен)
        # - сбрасываем finished_at (для retry сценариев)
        if to_status == GenerationStatus.RUNNING:
            if generation.started_at is None:
                update_data["started_at"] = now
            # Сбрасываем finished_at при retry (например, FAILED → RUNNING)
            if generation.finished_at is not None:
                update_data["finished_at"] = None
        
        # При переходе в финальные статусы устанавливаем finished_at
        final_statuses = {
            GenerationStatus.GENERATED,
            GenerationStatus.EXPORTED,
            GenerationStatus.FAILED,
            GenerationStatus.CANCELED,
        }
        if to_status in final_statuses:
            update_data["finished_at"] = now
        
        # Создаем обновленную копию объекта
        return generation.model_copy(update=update_data)
    
    @classmethod
    def get_allowed_transitions(cls, from_status: GenerationStatus) -> Set[GenerationStatus]:
        """
        Возвращает множество допустимых целевых статусов для данного исходного статуса.
        
        Args:
            from_status: Исходный статус
        
        Returns:
            Множество допустимых целевых статусов
        
        Examples:
            >>> allowed = GenerationStateMachine.get_allowed_transitions(GenerationStatus.DRAFT)
            >>> GenerationStatus.RUNNING in allowed
            True
        """
        return cls._ALLOWED_TRANSITIONS.get(from_status, set()).copy()
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "GenerationStateMachine()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "GenerationStateMachine - управляет переходами статусов Generation"

