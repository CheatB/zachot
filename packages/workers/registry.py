"""
Реестр воркеров для выбора подходящего воркера для задачи.
"""

from typing import List

from packages.jobs import Job
from packages.jobs.enums import JobType

from .base import BaseWorker


class WorkerNotFoundError(Exception):
    """
    Исключение, выбрасываемое когда не найден подходящий воркер для задачи.
    
    Attributes:
        job_type: Тип задачи, для которой не найден воркер
        message: Сообщение об ошибке
    """
    
    def __init__(self, job_type: JobType):
        self.job_type = job_type
        self.message = f"No worker found for job type: {job_type.value}"
        super().__init__(self.message)
    
    def __repr__(self) -> str:
        return f"WorkerNotFoundError(job_type={self.job_type.value})"
    
    def __str__(self) -> str:
        return self.message


class WorkerRegistry:
    """
    Реестр воркеров для выбора подходящего воркера для задачи.
    
    Хранит список зарегистрированных воркеров и позволяет найти
    подходящий воркер для конкретной задачи.
    """
    
    def __init__(self):
        """Инициализация реестра."""
        self._workers: List[BaseWorker] = []
    
    def register(self, worker: BaseWorker) -> None:
        """
        Регистрирует воркер в реестре.
        
        Args:
            worker: Воркер для регистрации
        
        Examples:
            >>> registry = WorkerRegistry()
            >>> worker = TextStructureWorker()
            >>> registry.register(worker)
        """
        if worker not in self._workers:
            self._workers.append(worker)
    
    def get_worker(self, job: Job) -> BaseWorker:
        """
        Находит подходящий воркер для задачи.
        
        Проходит по всем зарегистрированным воркерам и возвращает первого,
        который может обработать задачу (can_handle возвращает True).
        
        Args:
            job: Задача для поиска воркера
        
        Returns:
            Подходящий воркер
        
        Raises:
            WorkerNotFoundError: Если не найден подходящий воркер
        
        Examples:
            >>> registry = WorkerRegistry()
            >>> registry.register(TextStructureWorker())
            >>> job = Job(type=JobType.TEXT_STRUCTURE, ...)
            >>> worker = registry.get_worker(job)
            >>> isinstance(worker, TextStructureWorker)
            True
        """
        for worker in self._workers:
            if worker.can_handle(job):
                return worker
        
        raise WorkerNotFoundError(job.type)
    
    def get_all_workers(self) -> List[BaseWorker]:
        """
        Возвращает список всех зарегистрированных воркеров.
        
        Returns:
            Список всех воркеров
        """
        return self._workers.copy()
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"WorkerRegistry(workers={len(self._workers)})"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"WorkerRegistry with {len(self._workers)} worker(s)"

