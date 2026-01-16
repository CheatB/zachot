"""
Celery application для асинхронной обработки задач.
"""

from celery import Celery

# Создаём Celery app
celery_app = Celery(
    "zachot",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=[
        "apps.api.tasks.generation_tasks",
        "apps.api.tasks.export_tasks",
    ]
)

# Конфигурация
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 час максимум на задачу
    task_soft_time_limit=3300,  # 55 минут soft limit
    worker_prefetch_multiplier=1,  # Берём по 1 задаче за раз
    worker_max_tasks_per_child=100,  # Перезапуск воркера после 100 задач
    result_expires=86400,  # Результаты хранятся 24 часа
)

# Настройки для разных типов задач
celery_app.conf.task_routes = {
    "apps.api.tasks.generation_tasks.*": {"queue": "generation"},
    "apps.api.tasks.export_tasks.*": {"queue": "export"},
}

# Приоритеты задач
celery_app.conf.task_default_priority = 5
celery_app.conf.task_inherit_parent_priority = True
