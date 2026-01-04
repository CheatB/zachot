"""
Lifecycle для управления выполнением Step.

Обеспечивает строгий контроль жизненного цикла шага генерации,
гарантируя корректные переходы статусов и идемпотентность операций.
"""

import hashlib
import json
from datetime import datetime
from typing import Optional

from .enums import StepStatus
from .step import Step


def calculate_input_hash(input_payload: dict) -> str:
    """
    Вычисляет SHA256 хеш входных данных шага для дедупликации.
    
    Перед вычислением хеша нормализует входные данные:
    - Сортирует ключи словаря рекурсивно
    - Сериализует в JSON с фиксированными параметрами
    
    Args:
        input_payload: Входные данные шага
    
    Returns:
        SHA256 хеш в виде hex-строки
    
    Examples:
        >>> hash1 = calculate_input_hash({"a": 1, "b": 2})
        >>> hash2 = calculate_input_hash({"b": 2, "a": 1})
        >>> hash1 == hash2
        True
    """
    def normalize_dict(d: dict) -> dict:
        """Рекурсивно нормализует словарь, сортируя ключи."""
        if not isinstance(d, dict):
            return d
        return {k: normalize_dict(v) if isinstance(v, dict) else v 
                for k, v in sorted(d.items())}
    
    normalized = normalize_dict(input_payload)
    json_str = json.dumps(normalized, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(json_str.encode('utf-8')).hexdigest()


class InvalidStepTransitionError(Exception):
    """
    Исключение, выбрасываемое при попытке недопустимого перехода статуса Step.
    
    Attributes:
        step_id: Идентификатор шага
        from_status: Исходный статус
        to_status: Целевой статус
        operation: Название операции, которая вызвала ошибку
    """
    
    def __init__(
        self, 
        step_id: str, 
        from_status: StepStatus, 
        to_status: StepStatus,
        operation: str
    ):
        self.step_id = step_id
        self.from_status = from_status
        self.to_status = to_status
        self.operation = operation
        self.message = (
            f"Invalid transition for step {step_id} during {operation}: "
            f"{from_status.value} → {to_status.value}. "
            f"Step must be in appropriate status for this operation."
        )
        super().__init__(self.message)
    
    def __repr__(self) -> str:
        return (
            f"InvalidStepTransitionError(step_id={self.step_id!r}, "
            f"{self.from_status.value} → {self.to_status.value}, "
            f"operation={self.operation!r})"
        )
    
    def __str__(self) -> str:
        return self.message


class StepAlreadyFinishedError(Exception):
    """
    Исключение, выбрасываемое при попытке изменить шаг, который уже завершён.
    
    Используется для обеспечения идемпотентности - шаги в финальных статусах
    (SUCCEEDED, FAILED, SKIPPED) не могут быть изменены.
    
    Attributes:
        step_id: Идентификатор шага
        current_status: Текущий статус шага
        operation: Название операции, которая вызвала ошибку
    """
    
    def __init__(self, step_id: str, current_status: StepStatus, operation: str):
        self.step_id = step_id
        self.current_status = current_status
        self.operation = operation
        self.message = (
            f"Cannot perform {operation} on step {step_id}: "
            f"step is already finished with status {current_status.value}. "
            f"Finished steps cannot be modified."
        )
        super().__init__(self.message)
    
    def __repr__(self) -> str:
        return (
            f"StepAlreadyFinishedError(step_id={self.step_id!r}, "
            f"status={self.current_status.value}, "
            f"operation={self.operation!r})"
        )
    
    def __str__(self) -> str:
        return self.message


class StepLifecycle:
    """
    Lifecycle для управления выполнением Step.
    
    Обеспечивает строгий контроль переходов статусов шага и гарантирует
    идемпотентность операций. Шаги в финальных статусах (SUCCEEDED, FAILED, SKIPPED)
    не могут быть изменены - попытка изменения выбросит StepAlreadyFinishedError.
    
    Допустимые переходы:
    - start: PENDING → RUNNING
    - complete: RUNNING → SUCCEEDED
    - fail: RUNNING → FAILED
    - mark_need_user: RUNNING → NEED_USER
    - skip: PENDING | RUNNING → SKIPPED
    """
    
    # Финальные статусы, в которых шаг не может быть изменён
    _FINAL_STATUSES = {
        StepStatus.SUCCEEDED,
        StepStatus.FAILED,
        StepStatus.SKIPPED,
    }
    
    @classmethod
    def _check_not_finished(cls, step: Step, operation: str) -> None:
        """
        Проверяет, что шаг не находится в финальном статусе.
        
        Raises:
            StepAlreadyFinishedError: Если шаг уже завершён
        """
        if step.status in cls._FINAL_STATUSES:
            raise StepAlreadyFinishedError(
                str(step.id),
                step.status,
                operation
            )
    
    @classmethod
    def start(cls, step: Step) -> Step:
        """
        Запускает выполнение шага.
        
        Переводит шаг из статуса PENDING в RUNNING и устанавливает started_at.
        
        Args:
            step: Шаг для запуска
        
        Returns:
            Обновлённый объект Step со статусом RUNNING
        
        Raises:
            StepAlreadyFinishedError: Если шаг уже завершён
            InvalidStepTransitionError: Если шаг не в статусе PENDING
        
        Examples:
            >>> step = Step(status=StepStatus.PENDING, ...)
            >>> started = StepLifecycle.start(step)
            >>> started.status == StepStatus.RUNNING
            True
        """
        cls._check_not_finished(step, "start")
        
        if step.status != StepStatus.PENDING:
            raise InvalidStepTransitionError(
                str(step.id),
                step.status,
                StepStatus.RUNNING,
                "start"
            )
        
        now = datetime.now()
        return step.model_copy(update={
            "status": StepStatus.RUNNING,
            "started_at": now,
        })
    
    @classmethod
    def complete(cls, step: Step, output_payload: dict) -> Step:
        """
        Завершает шаг успешно.
        
        Переводит шаг из статуса RUNNING в SUCCEEDED, сохраняет output_payload,
        устанавливает finished_at и progress = 100.
        
        Args:
            step: Шаг для завершения
            output_payload: Выходные данные шага
        
        Returns:
            Обновлённый объект Step со статусом SUCCEEDED
        
        Raises:
            StepAlreadyFinishedError: Если шаг уже завершён
            InvalidStepTransitionError: Если шаг не в статусе RUNNING
        
        Examples:
            >>> step = Step(status=StepStatus.RUNNING, ...)
            >>> completed = StepLifecycle.complete(step, {"result": "success"})
            >>> completed.status == StepStatus.SUCCEEDED
            True
        """
        cls._check_not_finished(step, "complete")
        
        if step.status != StepStatus.RUNNING:
            raise InvalidStepTransitionError(
                str(step.id),
                step.status,
                StepStatus.SUCCEEDED,
                "complete"
            )
        
        now = datetime.now()
        return step.model_copy(update={
            "status": StepStatus.SUCCEEDED,
            "output_payload": output_payload,
            "finished_at": now,
            "progress": 100,
        })
    
    @classmethod
    def fail(cls, step: Step, error: dict) -> Step:
        """
        Завершает шаг с ошибкой.
        
        Переводит шаг из статуса RUNNING в FAILED, сохраняет error
        и устанавливает finished_at.
        
        Args:
            step: Шаг для завершения с ошибкой
            error: Информация об ошибке
        
        Returns:
            Обновлённый объект Step со статусом FAILED
        
        Raises:
            StepAlreadyFinishedError: Если шаг уже завершён
            InvalidStepTransitionError: Если шаг не в статусе RUNNING
        
        Examples:
            >>> step = Step(status=StepStatus.RUNNING, ...)
            >>> failed = StepLifecycle.fail(step, {"code": "timeout", "message": "..."})
            >>> failed.status == StepStatus.FAILED
            True
        """
        cls._check_not_finished(step, "fail")
        
        if step.status != StepStatus.RUNNING:
            raise InvalidStepTransitionError(
                str(step.id),
                step.status,
                StepStatus.FAILED,
                "fail"
            )
        
        now = datetime.now()
        return step.model_copy(update={
            "status": StepStatus.FAILED,
            "error": error,
            "finished_at": now,
        })
    
    @classmethod
    def mark_need_user(cls, step: Step, reason: Optional[dict] = None) -> Step:
        """
        Помечает шаг как требующий взаимодействия с пользователем.
        
        Переводит шаг из статуса RUNNING в NEED_USER.
        Опционально сохраняет reason в поле error.
        
        Args:
            step: Шаг для пометки
            reason: Опциональная причина (сохраняется в error)
        
        Returns:
            Обновлённый объект Step со статусом NEED_USER
        
        Raises:
            StepAlreadyFinishedError: Если шаг уже завершён
            InvalidStepTransitionError: Если шаг не в статусе RUNNING
        
        Examples:
            >>> step = Step(status=StepStatus.RUNNING, ...)
            >>> marked = StepLifecycle.mark_need_user(step, {"action": "approve"})
            >>> marked.status == StepStatus.NEED_USER
            True
        """
        cls._check_not_finished(step, "mark_need_user")
        
        if step.status != StepStatus.RUNNING:
            raise InvalidStepTransitionError(
                str(step.id),
                step.status,
                StepStatus.NEED_USER,
                "mark_need_user"
            )
        
        update_data: dict = {
            "status": StepStatus.NEED_USER,
        }
        
        if reason is not None:
            update_data["error"] = reason
        
        return step.model_copy(update=update_data)
    
    @classmethod
    def skip(cls, step: Step, reason: Optional[str] = None) -> Step:
        """
        Пропускает выполнение шага.
        
        Переводит шаг из статуса PENDING или RUNNING в SKIPPED
        и устанавливает finished_at.
        Опционально сохраняет reason в поле error.
        
        Args:
            step: Шаг для пропуска
            reason: Опциональная причина пропуска
        
        Returns:
            Обновлённый объект Step со статусом SKIPPED
        
        Raises:
            StepAlreadyFinishedError: Если шаг уже завершён
            InvalidStepTransitionError: Если шаг не в статусе PENDING или RUNNING
        
        Examples:
            >>> step = Step(status=StepStatus.PENDING, ...)
            >>> skipped = StepLifecycle.skip(step, "Not needed")
            >>> skipped.status == StepStatus.SKIPPED
            True
        """
        cls._check_not_finished(step, "skip")
        
        if step.status not in {StepStatus.PENDING, StepStatus.RUNNING}:
            raise InvalidStepTransitionError(
                str(step.id),
                step.status,
                StepStatus.SKIPPED,
                "skip"
            )
        
        now = datetime.now()
        update_data: dict = {
            "status": StepStatus.SKIPPED,
            "finished_at": now,
        }
        
        if reason is not None:
            update_data["error"] = {"reason": reason}
        
        return step.model_copy(update=update_data)
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "StepLifecycle()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "StepLifecycle - управляет жизненным циклом Step"



