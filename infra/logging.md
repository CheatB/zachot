# Logging Contract для zachot-api

## Обзор

Этот документ определяет стандарты логирования для FastAPI API сервиса `zachot-api` (orchestration layer). Соблюдение контракта обязательно для всех разработчиков.

## Разделение логов

### api.log (stdout)
- **INFO**: нормальная работа сервиса
- **DEBUG**: детальная информация для отладки
- **WARNING**: потенциальные проблемы, не критичные ошибки
- Application / orchestration logs только

### api.err (stderr)
- **ERROR**: ошибки выполнения, требующие внимания
- **CRITICAL**: критические ошибки, угрожающие работе сервиса
- Исключения (exceptions) с полным traceback

### HTTP access logs

- По умолчанию отключены в production
- Могут быть временно включены для отладки
- Не являются частью logging contract
- Не используются для анализа бизнес-событий

## Уровни логирования

### DEBUG
**Когда использовать:**
- Детальная информация для разработки и отладки
- Внутренние состояния компонентов
- Трассировка выполнения операций

⚠️ **DEBUG-логи запрещены в production окружении.**
DEBUG допускается только в dev / test или при временном troubleshooting.

**Примеры:**
- Регистрация подписчиков на события
- Детали работы SSE connections
- Внутренние переходы состояний

### INFO
**Когда использовать:**
- Нормальная работа сервиса
- Важные события бизнес-логики
- Старт/остановка сервиса
- Успешные операции

**Примеры:**
- Startup/shutdown сервиса
- Создание Generation
- Постановка Job в очередь
- Переходы статусов Generation

### WARNING
**Когда использовать:**
- Потенциальные проблемы, не блокирующие работу
- Некорректные, но обработанные запросы
- Неожиданные, но допустимые ситуации

**Примеры:**
- Generation не найдена (404)
- Недопустимый переход статуса (409)
- Неподдерживаемый модуль
- Circuit breaker открыт

### ERROR
**Когда использовать:**
- Ошибки выполнения операций
- Необработанные исключения
- Проблемы с внешними зависимостями

**Примеры:**
- Ошибка подключения к Redis
- Ошибка сериализации Job
- Ошибка в event handler
- Ошибка в SSE stream

### CRITICAL
**Когда использовать:**
- Критические ошибки, угрожающие работе сервиса
- Системные ошибки, требующие немедленного вмешательства

**Примеры:**
- Невозможность подключиться к Redis при старте
- Критическая ошибка в event dispatcher
- Потеря данных в storage

## Обязательные поля в лог-сообщении

### Формат лог-сообщения

```
{timestamp} - {service_name} - {level} - {message} [{context}]
```

### Обязательные поля

1. **timestamp**: автоматически добавляется через logging formatter
2. **service_name**: `zachot-api` (настраивается в logger name)
3. **level**: DEBUG / INFO / WARNING / ERROR / CRITICAL
4. **message**: читаемое описание события

### Опциональные поля (context)

- **request_id**: идентификатор HTTP запроса (TODO: добавить middleware)
- **correlation_id**: идентификатор для трассировки запроса через систему
- **generation_id**: UUID генерации (если применимо)
- **job_id**: UUID задачи (если применимо)
- **user_id**: внутренний UUID субъекта (не email, не username, не внешний идентификатор)
- **status**: статус операции (если применимо)
- **error_code**: код ошибки (если применимо)

### Примеры форматирования

```python
# Хорошо
logger.info(f"Generation {generation_id} created: module={module.value}")

# Хорошо (с контекстом)
logger.info(
    f"Job {job_id} queued for generation {generation_id}: "
    f"type={job_type.value}, message_id={message_id}"
)

# Хорошо (с ошибкой)
logger.error(
    f"Failed to queue job {job_id} for generation {generation_id}: {error}",
    exc_info=True
)
```

## Что ЗАПРЕЩЕНО логировать

### ❌ Пользовательские тексты
```python
# ПЛОХО
logger.info(f"User input: {user_text}")

# ХОРОШО
logger.info(f"Generation created: input_length={len(user_text)}")
```

### ❌ Payload генераций
```python
# ПЛОХО
logger.debug(f"Generation payload: {generation.input_payload}")

# ХОРОШО
logger.debug(f"Generation created: payload_keys={list(generation.input_payload.keys())}")
```

### ❌ Персональные данные
```python
# ПЛОХО
logger.info(f"User email: {user.email}")

# ХОРОШО
logger.info(f"User {user_id} authenticated")
```

### ❌ External user identifiers
```python
# ПЛОХО
logger.info(f"User email: {user.email}")
logger.info(f"User phone: {user.phone}")
logger.info(f"Username: {username}")
logger.info(f"External auth ID: {external_auth_id}")

# ХОРОШО
logger.info(f"User {user_id} authenticated")
```

### ❌ Токены и ключи
```python
# ПЛОХО
logger.debug(f"API key: {api_key}")

# ХОРОШО
logger.debug(f"API key validated: key_length={len(api_key)}")
```

### ❌ Полные исключения без фильтрации
```python
# ПЛОХО (может содержать чувствительные данные)
logger.error(f"Error: {str(exception)}")

# ХОРОШО
logger.error(f"Error: {error_code}", exc_info=True)
```

## Примеры лог-сообщений

### Startup
```
2026-01-02 10:00:00 - zachot-api - INFO - Starting zachot-api in production mode
2026-01-02 10:00:00 - zachot-api - INFO - Debug mode: False
2026-01-02 10:00:00 - zachot-api - INFO - Subscribed to domain events
2026-01-02 10:00:01 - uvicorn - INFO - Uvicorn running on http://127.0.0.1:8000
```

### Incoming Request
```
2026-01-02 10:01:00 - apps.api.routers.generations - INFO - POST /generations
2026-01-02 10:01:00 - apps.api.routers.generations - INFO - Created generation 3a258bdb-4570-4d02-afa4-d343daa32482 with module TEXT
```

### Generation Created
```
2026-01-02 10:01:00 - apps.api.routers.generations - INFO - Generation 3a258bdb-4570-4d02-afa4-d343daa32482 created: module=TEXT, status=DRAFT
```

### Job Enqueued
```
2026-01-02 10:02:00 - apps.api.routers.jobs - INFO - Job 7f1aec27-3970-4d02-afa4-d343daa32482 queued for generation 3a258bdb-4570-4d02-afa4-d343daa32482: type=TEXT_STRUCTURE, message_id=838c6ea6-8de6-4e04-961b-78e6acffec62
```

### State Transition
```
2026-01-02 10:03:00 - apps.api.routers.generations - INFO - Executed action 'next' on generation 3a258bdb-4570-4d02-afa4-d343daa32482: DRAFT → RUNNING
```

### Error Case (404)
```
2026-01-02 10:04:00 - apps.api.routers.generations - WARNING - Generation 00000000-0000-0000-0000-000000000000 not found
```

### Error Case (409)
```
2026-01-02 10:05:00 - apps.api.routers.jobs - WARNING - Generation 3a258bdb-4570-4d02-afa4-d343daa32482 is not in RUNNING status, current status: DRAFT
```

### Error Case (500)
```
2026-01-02 10:06:00 - apps.api.routers.jobs - ERROR - Failed to queue job 7f1aec27-3970-4d02-afa4-d343daa32482 for generation 3a258bdb-4570-4d02-afa4-d343daa32482: Connection refused
2026-01-02 10:06:00 - apps.api.routers.jobs - ERROR - Traceback (most recent call last):
  File "/opt/zachot/repo/apps/api/routers/jobs.py", line 128, in create_job
    message = execute_job.send(job_dict)
  ...
```

### SSE Connection
```
2026-01-02 10:07:00 - apps.api.routers.generations - INFO - SSE connection opened for generation 3a258bdb-4570-4d02-afa4-d343daa32482
2026-01-02 10:07:30 - apps.api.routers.generations - INFO - SSE connection closed for generation 3a258bdb-4570-4d02-afa4-d343daa32482
```

### Domain Event
```
2026-01-02 10:08:00 - apps.api.main - INFO - API received GenerationUpdated event: GenerationUpdated[3a258bdb...] (RUNNING)
2026-01-02 10:08:00 - apps.api.main - INFO - Generation 3a258bdb-4570-4d02-afa4-d343daa32482 status updated to RUNNING in API storage.
```

## Важность контракта

### Почему этот контракт важен

1. **Безопасность**: предотвращает утечку чувствительных данных в логи
2. **Производительность**: структурированные логи легче парсить и анализировать
3. **Отладка**: единый формат упрощает поиск проблем в production
4. **Мониторинг**: структурированные логи можно автоматически обрабатывать
5. **Соответствие**: соблюдение требований по защите данных (GDPR, etc.)

### Что сломается, если не соблюдать

1. **Утечка данных**: персональные данные и токены попадут в логи
2. **Проблемы с парсингом**: неструктурированные логи сложно анализировать
3. **Нарушение compliance**: логирование PII может нарушать требования
4. **Переполнение логов**: избыточное логирование payload'ов заполнит диски
5. **Сложность отладки**: отсутствие обязательных полей затруднит трассировку
6. **Проблемы с мониторингом**: неструктурированные логи не поддаются автоматической обработке

## Реализация

### Настройка logging в apps/api/main.py

```python
import logging
from logging.config import dictConfig

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "default": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
        "error": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stderr",
            "level": "ERROR",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["default", "error"],
    },
    "loggers": {
        "apps.api": {
            "level": "INFO",
            "handlers": ["default", "error"],
            "propagate": False,
        },
        "uvicorn": {
            "level": "INFO",
            "handlers": ["default"],
            "propagate": False,
        },
        "uvicorn.access": {
            "level": "INFO",
            "handlers": ["default"],
            "propagate": False,
        },
    },
}

dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("zachot-api")
```

## Чеклист для code review

- [ ] Используется правильный уровень логирования
- [ ] Лог-сообщение содержит обязательные поля
- [ ] Не логируются чувствительные данные
- [ ] Не логируются полные payload'ы
- [ ] Исключения логируются с `exc_info=True` для ERROR/CRITICAL
- [ ] Лог-сообщения читаемы и информативны
- [ ] Используется правильный logger (не root logger)
- [ ] DEBUG не используется в production коде


