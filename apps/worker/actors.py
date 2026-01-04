"""
Безопасный слой для импорта actors без драматик-зависимостей.

Этот файл импортируется API и тестами без попытки поднять broker.
Реальная реализация с @dramatiq.actor находится в _actors_runtime.py.
"""


class _LazyActorProxy:
    """
    Прокси для ленивого доступа к actor объекту.
    
    Позволяет использовать actor.send() без импорта драматик-зависимого кода
    на этапе импорта модуля.
    """
    
    def __init__(self, actor_name: str):
        self._actor_name = actor_name
        self._actor = None
    
    def _get_actor(self):
        """Ленивый импорт actor из runtime модуля."""
        if self._actor is None:
            # Используем относительный импорт для корректной работы в пакете
            from . import _actors_runtime
            self._actor = getattr(_actors_runtime, self._actor_name)
        return self._actor
    
    def send(self, *args, **kwargs):
        """Вызывает send() на runtime actor."""
        return self._get_actor().send(*args, **kwargs)
    
    def __getattr__(self, name):
        """Проксирует все остальные атрибуты к runtime actor."""
        return getattr(self._get_actor(), name)


# Создаём прокси для execute_job actor
# API импортирует execute_job и вызывает execute_job.send(),
# но реальный actor импортируется только при первом вызове
execute_job = _LazyActorProxy('execute_job_impl')

