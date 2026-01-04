# Infrastructure Documentation

## Failure & Restart Matrix

Подробная матрица сценариев сбоев и стратегий восстановления для системы zachot.

**Документ**: [`infra/failure_matrix.md`](failure_matrix.md)

### Как читать матрицу

Матрица содержит таблицу сценариев сбоев для каждого компонента системы (Redis, API, Worker, Queue). Для каждого сценария указано:

- **Тип сбоя** — что именно произошло
- **Симптомы** — как проявляется проблема
- **Детектирование** — как понять, что произошел сбой
- **Авто-действие systemd** — что делает systemd автоматически
- **Ручное действие** — что нужно сделать вручную
- **Риск потери данных** — возможна ли потеря данных (Yes/No/Partial)
- **Комментарий** — дополнительные пояснения

**Ключевые принципы**:
- **Redis** — критический компонент, при его падении система останавливается
- **API** — при рестарте теряется in-memory state и SSE connections
- **Worker** — можно рестартить агрессивно, задачи остаются в Redis очереди
- **Queue** — задачи не теряются, но могут накапливаться при проблемах

Матрица также содержит раздел **Design Decisions**, объясняющий архитектурные решения и их компромиссы.

## Backup & Recovery

Минимальная стратегия резервного копирования и восстановления для системы zachot.

**Документ**: [`infra/backup_recovery.md`](backup_recovery.md)

### Философия

**Цель**: Восстановление сервиса, не данных пользователя.

Система спроектирована как stateless где возможно:
- Код хранится в GitHub (не бэкапится)
- In-memory state не бэкапится (временные данные)
- Redis содержит только временные очереди (не бэкапится)
- Фокус на быстром восстановлении сервиса

### Что бэкапится

1. **Environment файлы** (`/opt/zachot/envs/prod/etc/zachot.env`)
   - Manual перед каждым изменением
   - Еженедельный snapshot (опционально)
   - RTO: 5-10 минут

2. **Systemd unit-файлы** (`/etc/systemd/system/zachot-*.service`)
   - Manual перед каждым изменением
   - Или хранить в GitHub репозитории
   - RTO: 5-10 минут

3. **Логи** (опционально)
   - Не бэкапится автоматически
   - Ротация сохраняет 14 дней локально

### Что НЕ бэкапится

- **In-memory state API** — временные данные, теряются при рестарте
- **SSE connections** — TCP connections нельзя сохранить
- **Временные очереди Redis** — задачи можно пересоздать
- **Код приложения** — хранится в GitHub

### Disaster Scenarios

Документ содержит пошаговые инструкции для:
- Потери сервера (полное восстановление)
- Потери Redis (восстановление очереди)
- Ошибочного deploy (откат кода)
- Удаления env-файлов (восстановление конфигурации)

## Logging & Log Rotation

### Логи API сервиса

Логи пишутся через systemd в файлы:
- `/opt/zachot/logs/api.log` (stdout, application logs)
- `/opt/zachot/logs/api.err` (stderr, errors)

Владелец: `zachot:zachot`, права: `0640`

### Ротация логов

Конфигурация: `infra/logrotate/zachot-api`

Политика:
- Ротация: ежедневно (daily)
- Хранение: 14 файлов (2 недели)
- Сжатие: gzip с задержкой (delaycompress)
- Формат даты: `-YYYY-MM-DD`

Безопасность:
- `copytruncate` — безопасно для systemd + uvicorn (без перезапуска)
- Не ломает SSE connections и in-memory state

### Установка

```bash
sudo cp infra/logrotate/zachot-api /etc/logrotate.d/zachot-api
```

### Проверка

```bash
# Проверка конфигурации (dry-run)
sudo logrotate -d /etc/logrotate.d/zachot-api

# Тестовая ротация
sudo logrotate -f /etc/logrotate.d/zachot-api

# Проверка прав и владельца
ls -la /opt/zachot/logs/api.log*
```

## Worker Logging & Log Rotation

### Логи Worker сервиса

Логи пишутся через systemd в файлы:
- `/opt/zachot/logs/worker.log` (stdout, application logs)
- `/opt/zachot/logs/worker.err` (stderr, errors)

Владелец: `zachot:zachot`, права: `0640`

### Ротация логов

Конфигурация: `infra/logrotate/zachot-worker`

Политика:
- Ротация: ежедневно (daily)
- Хранение: 14 файлов (2 недели)
- Сжатие: gzip с задержкой (delaycompress)
- Формат даты: `-YYYY-MM-DD`

Безопасность:
- `copytruncate` — безопасно для systemd + dramatiq (без перезапуска)
- Ротация не требует перезапуска worker процесса
- Не затрагивает Redis connections и in-memory state

### Установка

```bash
sudo cp infra/logrotate/zachot-worker /etc/logrotate.d/zachot-worker
```

### Проверка

```bash
# Проверка конфигурации (dry-run)
sudo logrotate -d /etc/logrotate.d/zachot-worker

# Тестовая ротация
sudo logrotate -f /etc/logrotate.d/zachot-worker

# Проверка прав и владельца
ls -la /opt/zachot/logs/worker.log*
```

## Worker Healthcheck

### Описание

Healthcheck скрипт для проверки состояния zachot-worker (Dramatiq).

Скрипт: `infra/healthchecks/worker_healthcheck.py`

### Проверки

Скрипт выполняет следующие проверки:

1. **Python процессы** — наличие процессов Python под пользователем `zachot`
2. **Dramatiq процессы** — наличие активных процессов dramatiq с `apps.worker.actors`
3. **Redis доступность** — проверка подключения к Redis через `ping`
4. **Очередь default** — проверка существования очереди `default` через `llen`

### Exit коды

- **0 (OK)** — все проверки пройдены, сервис работает нормально
- **1 (DEGRADED)** — частичные проблемы (например, процессы не найдены, но Redis доступен), сервис работает
- **2 (DOWN)** — критические проблемы (Redis недоступен, очередь недоступна), сервис не работает

### Ручной запуск

```bash
sudo -u zachot /opt/zachot/envs/prod/bin/python infra/healthchecks/worker_healthcheck.py
```

### Systemd интеграция

В `zachot-worker.service` настроен `ExecCondition` для проверки Redis перед запуском:

```ini
ExecCondition=/opt/zachot/envs/prod/bin/python /opt/zachot/repo/infra/healthchecks/redis_check.py
```

Если Redis недоступен, worker не запустится, предотвращая ошибки подключения.

### Watchdog

Systemd Watchdog **не используется** для worker по следующим причинам:

- Worker может быть занят выполнением долгих задач (минуты или часы)
- Watchdog требует периодических сигналов "heartbeat", что не подходит для long-running задач
- Ложные срабатывания watchdog могут прерывать выполнение важных задач
- Restart policy в systemd уже обеспечивает автоматический перезапуск при сбоях

### Что НЕ проверяется

Намеренно не проверяется:

- **HTTP endpoints** — worker не имеет HTTP-сервера
- **Производительность задач** — проверяется только доступность инфраструктуры
- **Размер очереди** — проверяется только существование очереди, не размер
- **Зависимости от API** — healthcheck независим от API процесса

