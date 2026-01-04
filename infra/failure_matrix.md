# Failure & Restart Matrix

Матрица сценариев сбоев и стратегий восстановления для системы zachot.

## Обзор компонентов

- **zachot-api**: FastAPI приложение с SSE и in-memory state
- **zachot-worker**: Dramatiq worker для обработки задач
- **Redis**: Broker для очередей и координация

## Матрица сценариев

| Компонент | Тип сбоя | Симптомы | Детектирование | Авто-действие systemd | Ручное действие | Риск потери данных | Комментарий |
|-----------|----------|----------|----------------|----------------------|-----------------|-------------------|-------------|
| **Redis** | Down на старте | Worker не запускается, ExecCondition падает | `systemctl status zachot-worker` показывает failed | Worker не стартует (ExecCondition блокирует) | Проверить Redis: `systemctl status redis-server`<br>Запустить Redis: `sudo systemctl start redis-server`<br>Worker запустится автоматически | No | ExecCondition предотвращает запуск без Redis |
| **Redis** | Упал во время работы | Worker теряет соединение, задачи не обрабатываются<br>API может терять соединение к Redis (если используется) | Логи worker: `ConnectionError`, `TimeoutError`<br>`systemctl status zachot-worker` может показать failed | Worker перезапускается (Restart=always), но падает снова<br>API продолжает работать (если не использует Redis напрямую) | 1. Запустить Redis: `sudo systemctl start redis-server`<br>2. Worker перезапустится автоматически<br>3. Проверить: `systemctl status zachot-worker` | Yes (задачи в очереди) | Задачи остаются в Redis, но не обрабатываются. После восстановления Redis задачи продолжат обработку |
| **Redis** | Отвечает, но медленно | Таймауты, медленная обработка задач<br>Worker может падать по таймаутам | Логи: `TimeoutError`, медленные ответы<br>Мониторинг: `redis-cli --latency` | Worker может перезапускаться при таймаутах<br>API может замедлиться | 1. Проверить нагрузку Redis: `redis-cli INFO`<br>2. Проверить сеть<br>3. Увеличить таймауты в коде (если нужно)<br>4. Рассмотреть Redis Sentinel/Cluster | Partial | Медленный Redis может привести к потере задач при таймаутах |
| **API** | Процесс упал | HTTP 502/503, нет ответа от API<br>SSE connections разорваны | `systemctl status zachot-api` показывает failed<br>Логи: `/opt/zachot/logs/api.err` | Автоматический restart через 10 сек (RestartSec=10)<br>StartLimitBurst=5 в течение 300 сек | 1. Проверить логи: `tail -f /opt/zachot/logs/api.err`<br>2. Если частые падения — проверить код/память<br>3. При StartLimitBurst — разблокировать: `systemctl reset-failed zachot-api` | Yes (in-memory state) | In-memory state теряется при рестарте. SSE connections не восстанавливаются |
| **API** | Завис (но процесс жив) | Нет ответа на запросы, но процесс работает<br>SSE connections "зависли" | HTTP таймауты, но `systemctl status` показывает active<br>Логи не обновляются | Нет автоматического действия (процесс жив) | 1. Проверить логи: `tail -f /opt/zachot/logs/api.log`<br>2. Проверить процессы: `ps aux \| grep uvicorn`<br>3. Принудительный restart: `sudo systemctl restart zachot-api` | Yes (in-memory state) | Systemd не детектирует зависание без watchdog. Нужен внешний мониторинг |
| **API** | Рестартируется | Краткий downtime, SSE connections разорваны<br>In-memory state сброшен | `systemctl status zachot-api` показывает restarting<br>Логи показывают shutdown/startup | Автоматический restart (Restart=always) | 1. Проверить причину: `journalctl -u zachot-api -n 50`<br>2. Если частые рестарты — проверить код/ресурсы<br>3. При StartLimitBurst — разблокировать | Yes (in-memory state) | SSE connections не переживают рестарт. Клиенты должны переподключаться |
| **Worker** | Процесс упал | Задачи не обрабатываются<br>Очередь растёт | `systemctl status zachot-worker` показывает failed<br>Логи: `/opt/zachot/logs/worker.err` | Автоматический restart через 10 сек (RestartSec=10)<br>StartLimitBurst=5 в течение 300 сек | 1. Проверить логи: `tail -f /opt/zachot/logs/worker.err`<br>2. Если частые падения — проверить код/задачи<br>3. При StartLimitBurst — разблокировать: `systemctl reset-failed zachot-worker` | No | Задачи остаются в Redis очереди. После рестарта обработка продолжится |
| **Worker** | Завис (но процесс жив) | Задачи не обрабатываются, но процесс работает | Очередь растёт, но worker не обрабатывает<br>`ps aux` показывает процесс, но нет активности | Нет автоматического действия (процесс жив) | 1. Проверить логи: `tail -f /opt/zachot/logs/worker.log`<br>2. Проверить задачи в очереди: `redis-cli LLEN dramatiq:queue:default`<br>3. Принудительный restart: `sudo systemctl restart zachot-worker` | Partial | Задачи могут быть "застрявшими" в обработке. После рестарта они вернутся в очередь (если не завершены) |
| **Worker** | Потерял Redis connection | Worker не может получать/отправлять задачи | Логи: `ConnectionError`, `TimeoutError`<br>Healthcheck возвращает exit 2 | Worker может упасть и перезапуститься<br>При ExecCondition worker не запустится без Redis | 1. Проверить Redis: `systemctl status redis-server`<br>2. Если Redis работает — проверить сеть<br>3. Worker перезапустится автоматически после восстановления Redis | No | Задачи остаются в Redis. После восстановления соединения обработка продолжится |
| **Queue** | Очередь переполнена | Медленная обработка, задержки<br>Новые задачи не принимаются (если есть лимиты) | `redis-cli LLEN dramatiq:queue:default` показывает большое значение<br>Мониторинг размера очереди | Нет автоматического действия | 1. Проверить размер: `redis-cli LLEN dramatiq:queue:default`<br>2. Увеличить количество worker процессов (WORKER_CONCURRENCY)<br>3. Проверить производительность worker<br>4. Рассмотреть приоритизацию задач | No | Задачи не теряются, но обработка замедляется |
| **Queue** | Jobs не обрабатываются | Очередь не уменьшается<br>Нет активности в логах worker | `redis-cli LLEN dramatiq:queue:default` не меняется<br>Логи worker пустые или показывают ошибки | Worker может перезапускаться при ошибках | 1. Проверить worker: `systemctl status zachot-worker`<br>2. Проверить логи: `tail -f /opt/zachot/logs/worker.err`<br>3. Проверить Redis: `redis-cli PING`<br>4. Перезапустить worker: `sudo systemctl restart zachot-worker` | No | Задачи остаются в очереди. После исправления обработка продолжится |
| **Queue** | Повторы / retries | Задачи обрабатываются многократно<br>Дублирование результатов | Логи показывают повторную обработку одной задачи<br>Мониторинг retry счетчиков | Нет автоматического действия | 1. Проверить retry policy в коде<br>2. Проверить обработку ошибок в actors<br>3. Проверить circuit breaker (если используется)<br>4. Рассмотреть idempotency keys | Partial | Могут быть дубликаты результатов, если задачи не идемпотентны |

## Design Decisions

### Почему API single-process

**Решение**: API работает в single-process режиме (uvicorn без workers).

**Причины**:
- **SSE connections**: Server-Sent Events требуют постоянного соединения между клиентом и конкретным процессом. При использовании нескольких worker процессов SSE connections не могут быть распределены между процессами без сложной координации.
- **In-memory state**: Хранилище `InMemoryGenerationStore` находится в памяти процесса. При нескольких процессах state не синхронизируется между процессами, что приводит к несогласованности данных.
- **Простота**: Single-process упрощает архитектуру и отладку. Для production с несколькими инстансами можно использовать sticky sessions или внешнее хранилище (БД).

**Компромиссы**:
- Ограничение масштабирования по CPU (один процесс на ядро)
- При падении процесса теряется весь in-memory state
- SSE connections не переживают рестарт процесса

### Почему worker можно рестартить агрессивно

**Решение**: Worker имеет `Restart=always` с коротким `RestartSec=10`.

**Причины**:
- **Stateless обработка**: Worker не хранит state между задачами. Каждая задача независима и может быть обработана любым worker процессом.
- **Задачи в Redis**: Все задачи хранятся в Redis очереди. При рестарте worker задачи остаются в очереди и будут обработаны после восстановления.
- **Быстрое восстановление**: Короткий `RestartSec` позволяет быстро восстановить обработку задач после сбоя.
- **Idempotency**: Задачи должны быть идемпотентными, чтобы повторная обработка не вызывала проблем.

**Компромиссы**:
- Задачи, которые обрабатывались в момент рестарта, могут быть обработаны повторно (если не завершены)
- Частые рестарты могут замедлить обработку очереди

### Почему Redis — SPOF (пока)

**Решение**: Redis используется как single point of failure без репликации или кластеризации.

**Причины**:
- **Простота**: Текущая архитектура не требует высокой доступности Redis для MVP/prototype.
- **Быстрая разработка**: Фокус на функциональности, а не на инфраструктуре высокой доступности.
- **Масштаб**: Для текущего масштаба single Redis instance достаточен.

**Планы на будущее**:
- Redis Sentinel для автоматического failover
- Redis Cluster для горизонтального масштабирования
- Persistence (RDB/AOF) для восстановления после перезапуска

**Компромиссы**:
- При падении Redis вся система останавливается
- Нет автоматического восстановления при сбое Redis
- Потеря данных при падении Redis без persistence

### Почему SSE не переживает рестарт API

**Решение**: SSE connections разрываются при рестарте API процесса.

**Причины**:
- **TCP connections**: SSE использует обычные TCP connections. При завершении процесса все TCP connections закрываются.
- **In-memory subscriptions**: Подписки на события хранятся в `InMemoryGenerationStore._subscribers`, который теряется при рестарте.
- **Простота**: Восстановление SSE connections требует сложной логики переподключения на клиенте.

**Решение для клиентов**:
- Клиенты должны реализовать автоматическое переподключение при разрыве SSE connection
- Использовать exponential backoff для переподключения
- При переподключении запрашивать текущее состояние через REST API

**Компромиссы**:
- Клиенты теряют события во время рестарта API
- Клиенты должны обрабатывать разрывы соединений
- Нет гарантии доставки событий (at-most-once delivery)

## Рекомендации по мониторингу

### Критические метрики

1. **Redis доступность**: `redis-cli PING` каждые 30 секунд
2. **Размер очереди**: `redis-cli LLEN dramatiq:queue:default` каждую минуту
3. **Статус сервисов**: `systemctl is-active zachot-api zachot-worker` каждую минуту
4. **SSE connections**: Количество активных соединений (требует код)

### Алерты

- Redis недоступен > 1 минуты
- Размер очереди > 1000 задач
- Worker не активен > 5 минут
- API не отвечает > 30 секунд
- Частые рестарты (> 5 в течение 5 минут)

## Восстановление после сбоя

### Полный сбой системы

1. Проверить Redis: `systemctl status redis-server`
2. Если Redis упал — запустить: `sudo systemctl start redis-server`
3. Проверить worker: `systemctl status zachot-worker`
4. Если worker не запустился — запустить: `sudo systemctl start zachot-worker`
5. Проверить API: `systemctl status zachot-api`
6. Если API не запустился — запустить: `sudo systemctl start zachot-api`
7. Проверить логи всех сервисов
8. Проверить размер очереди: `redis-cli LLEN dramatiq:queue:default`

### Частичный сбой

1. Определить компонент с проблемой через `systemctl status`
2. Проверить логи проблемного компонента
3. Выполнить соответствующие действия из матрицы выше
4. Мониторить восстановление через логи и статусы


