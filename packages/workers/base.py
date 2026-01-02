"""
Базовый класс для воркеров.

Определяет интерфейс для выполнения задач (jobs) воркерами.
"""

from abc import ABC, abstractmethod

from packages.jobs import Job, JobResult


class BaseWorker(ABC):
    """
    Абстрактный базовый класс для воркеров.
    
    Каждый воркер должен реализовать методы:
    - can_handle: проверка, может ли воркер выполнить задачу
    - execute: выполнение задачи
    
    Воркер не должен содержать логику retry - это ответственность runner'а.
    """
    
    @abstractmethod
    def can_handle(self, job: Job) -> bool:
        """
        Проверяет, может ли воркер выполнить данную задачу.
        
        Args:
            job: Задача для проверки
        
        Returns:
            True, если воркер может выполнить задачу, False в противном случае
        
        Examples:
            >>> worker = TextStructureWorker()
            >>> job = Job(type=JobType.TEXT_STRUCTURE, ...)
            >>> worker.can_handle(job)
            True
        """
        pass
    
    @abstractmethod
    def execute(self, job: Job) -> JobResult:
        """
        Выполняет задачу.
        
        Этот метод должен содержать только логику выполнения задачи.
        Retry, обработка ошибок на уровне runner'а - не здесь.
        
        Args:
            job: Задача для выполнения
        
        Returns:
            JobResult с результатом выполнения
        
        Raises:
            Exception: Может выбрасывать любые исключения при ошибках выполнения
        
        Examples:
            >>> worker = TextStructureWorker()
            >>> job = Job(type=JobType.TEXT_STRUCTURE, ...)
            >>> result = worker.execute(job)
            >>> result.success
            True
        """
        pass
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"{self.__class__.__name__}()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return f"{self.__class__.__name__}"

