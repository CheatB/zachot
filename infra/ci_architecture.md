# CI Architecture: Import vs Runtime Layers

## Проблема

CI для backend-тестов падал из-за runtime-зависимостей (dramatiq, redis, pika), которые подтягивались на этапе импорта. При импорте `apps.api.main` → `routers/jobs.py` → `apps.worker.actors` происходила попытка поднять broker, что требовало наличия redis/pika в CI окружении.

## Решение: Разделение на слои

### Import Layer (`apps/worker/actors.py`)

**Назначение:** Безопасный слой для импорта без драматик-зависимостей.

- Не содержит `import dramatiq` и `@dramatiq.actor` декораторов
- Использует ленивый импорт через `_LazyActorProxy`
- Импортируется API и тестами без попытки поднять broker
- Предоставляет тот же внешний API (`execute_job.send()`)

**Использование:**
```python
from apps.worker.actors import execute_job
message = execute_job.send(job_dict)  # Ленивый импорт runtime только при вызове
```

### Runtime Layer (`apps/worker/_actors_runtime.py`)

**Назначение:** Драматик-зависимый код для реального выполнения задач.

- Содержит `import dramatiq` и `@dramatiq.actor` декораторы
- Импортируется только в worker runtime (`apps/worker/main.py`)
- Регистрирует акторы в dramatiq при импорте
- Содержит всю бизнес-логику выполнения задач

**Использование:**
```python
# Только в worker runtime
from apps.worker import _actors_runtime  # Регистрирует акторы
```

## Почему CI не поднимает broker/redis/rabbitmq

CI проверяет **бизнес-логику**, а не инфраструктуру:

- **Что проверяет CI:**
  - Бизнес-логику выполнения задач
  - State machine переходы
  - API-контракты (request/response)
  - Валидацию данных
  - Обработку ошибок

- **Что CI сознательно НЕ проверяет:**
  - Очередь задач (dramatiq)
  - Фоновые воркеры
  - Реальные брокеры (redis, rabbitmq)
  - Сетевые соединения

Это разделение позволяет:
- Запускать тесты без инфраструктурных зависимостей
- Быстро собирать и проверять код
- Изолировать бизнес-логику от инфраструктуры

## Правила разработки

### ✅ DO: Безопасные импорты

Любой код, который импортируется в API или тестах, должен быть безопасным:

```python
# ✅ Правильно: безопасный импорт
from apps.worker.actors import execute_job

# ❌ Неправильно: прямой импорт runtime
from apps.worker._actors_runtime import execute_job_impl
```

### ✅ DO: Runtime-слой для инфраструктуры

Любой код, который:
- Регистрирует actors (`@dramatiq.actor`)
- Подключает broker (`dramatiq.set_broker()`)
- Трогает инфраструктуру (redis, rabbitmq)

должен жить **ТОЛЬКО** в runtime-слое (`_actors_runtime.py` или аналогичных файлах).

### ✅ DO: Ленивый импорт в прокси

Если нужно предоставить доступ к runtime-объекту из import-слоя, используйте паттерн ленивого импорта:

```python
class _LazyActorProxy:
    def _get_actor(self):
        if self._actor is None:
            from . import _actors_runtime  # Импорт только при вызове
            self._actor = getattr(_actors_runtime, self._actor_name)
        return self._actor
```

### ❌ DON'T: Импорт runtime в API/тестах

```python
# ❌ Неправильно: импорт runtime в API
from apps.worker._actors_runtime import execute_job_impl

# ❌ Неправильно: импорт broker в тестах
from apps.worker.broker import setup_broker
```

## How to run full system locally / in prod

1. **Установить зависимости:**
   ```bash
   pip install -r requirements.txt  # Включает dramatiq, redis, pika
   ```

2. **Запустить Redis:**
   ```bash
   redis-server
   # Или через docker: docker run -d -p 6379:6379 redis
   ```

3. **Запустить API:**
   ```bash
   uvicorn apps.api.main:app --reload
   ```

4. **Запустить Worker:**
   ```bash
   dramatiq apps.worker.main
   # Worker импортирует _actors_runtime и регистрирует акторы
   ```

В production: используйте systemd/docker для управления процессами API и worker.

