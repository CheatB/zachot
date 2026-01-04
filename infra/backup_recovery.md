# Backup & Recovery Strategy

Минимальная стратегия резервного копирования и восстановления для системы zachot.

## Философия

**Цель**: Восстановление сервиса, не данных пользователя.

Система спроектирована как stateless где возможно:
- Код хранится в GitHub
- In-memory state не бэкапится (временные данные)
- Redis содержит только временные очереди задач
- Фокус на быстром восстановлении сервиса, а не на сохранении состояния

## Что мы бэкапим

### 1. Environment файлы

**Где лежит**: `/opt/zachot/envs/prod/etc/zachot.env`

**Как бэкапится**: Manual (перед каждым изменением) + периодический snapshot

**Частота**: 
- Перед каждым изменением (manual)
- Еженедельный snapshot (manual или простой cron)

**RTO (Recovery Time Objective)**: 5-10 минут

**RPO (Recovery Point Objective)**: До последнего изменения env-файла

**Почему важно**: Без env-файлов сервисы не запустятся (нет REDIS_URL, WORKER_CONCURRENCY и т.д.)

**Команда бэкапа**:
```bash
# Создать бэкап
sudo cp /opt/zachot/envs/prod/etc/zachot.env /opt/zachot/backups/zachot.env.$(date +%Y%m%d_%H%M%S)

# Или в отдельное место
sudo cp /opt/zachot/envs/prod/etc/zachot.env ~/backups/zachot.env.$(date +%Y%m%d_%H%M%S)
```

### 2. Systemd unit-файлы

**Где лежат**: 
- `/etc/systemd/system/zachot-api.service`
- `/etc/systemd/system/zachot-worker.service`

**Как бэкапится**: Manual (перед каждым изменением)

**Частота**: Перед каждым изменением unit-файлов

**RTO**: 5-10 минут

**RPO**: До последнего изменения unit-файла

**Почему важно**: Без unit-файлов systemd не сможет управлять сервисами

**Команда бэкапа**:
```bash
# Создать бэкап
sudo cp /etc/systemd/system/zachot-api.service ~/backups/zachot-api.service.$(date +%Y%m%d_%H%M%S)
sudo cp /etc/systemd/system/zachot-worker.service ~/backups/zachot-worker.service.$(date +%Y%m%d_%H%M%S)
```

**Альтернатива**: Unit-файлы должны быть в репозитории GitHub в `infra/` или корне проекта.

### 3. Логи (опционально)

**Где лежат**: `/opt/zachot/logs/`

**Как бэкапится**: Не бэкапится автоматически (уже есть ротация через logrotate)

**Частота**: Нет (логи ротируются и хранятся 14 дней локально)

**RTO**: N/A

**RPO**: N/A

**Зачем**: Логи нужны только для отладки. Ротация сохраняет последние 14 дней локально.

**Если нужно сохранить старые логи**:
```bash
# Вручную скопировать перед очисткой
sudo tar -czf ~/backups/zachot-logs-$(date +%Y%m%d).tar.gz /opt/zachot/logs/
```

### 4. Redis (опционально)

**Где лежит**: Данные Redis в памяти (возможно с persistence в `/var/lib/redis/`)

**Как бэкапится**: Нет (не бэкапится)

**Частота**: Нет

**RTO**: N/A

**RPO**: N/A

**Почему НЕ бэкапится**:
- Redis содержит только временные очереди задач
- Задачи можно пересоздать через API
- Persistence Redis (если включен) уже сохраняет данные на диск
- Восстановление Redis из бэкапа может привести к дублированию задач

**Если критично сохранить очередь** (не рекомендуется):
```bash
# Создать snapshot Redis (если persistence включен)
sudo systemctl stop redis-server
sudo cp /var/lib/redis/dump.rdb ~/backups/redis-dump-$(date +%Y%m%d_%H%M%S).rdb
sudo systemctl start redis-server
```

## Что мы сознательно НЕ бэкапим

### 1. In-memory state API

**Что это**: Данные в `InMemoryGenerationStore` (Generation объекты, SSE subscriptions)

**Почему не бэкапится**:
- Временные данные, теряются при рестарте API
- Не критично для работы системы
- Восстановление через API endpoints
- Бэкап in-memory state технически сложен и не оправдан

**Последствия**: При рестарте API теряется текущее состояние генераций. Клиенты должны переподключаться через SSE.

### 2. SSE connections

**Что это**: Активные Server-Sent Events соединения

**Почему не бэкапится**:
- TCP connections нельзя сохранить в бэкап
- Соединения разрываются при рестарте API
- Клиенты должны реализовать автоматическое переподключение
- Восстановление connections невозможно

**Последствия**: При рестарте API клиенты теряют SSE connections и должны переподключиться.

### 3. Временные очереди Redis

**Что это**: Задачи в очереди `dramatiq:queue:default`

**Почему не бэкапится**:
- Задачи временные, можно пересоздать
- Бэкап может привести к дублированию задач
- Восстановление из бэкапа сложно (нужно очистить очередь перед восстановлением)
- Если Redis persistence включен, данные уже сохраняются на диск

**Последствия**: При потере Redis теряются необработанные задачи. Новые задачи можно создать через API.

### 4. Код приложения

**Что это**: Исходный код в `/opt/zachot/repo/`

**Почему не бэкапится**:
- Код хранится в GitHub
- Восстановление через `git clone`
- Бэкап кода избыточен

**Восстановление**:
```bash
cd /opt/zachot
sudo -u zachot git clone https://github.com/your-org/zachot.git repo
```

## Disaster Scenarios

### Сценарий 1: Потеря сервера

**Ситуация**: Полная потеря сервера (hardware failure, удаление VM, форматирование диска)

**Шаги восстановления**:

1. **Развернуть новый сервер** (Ubuntu/Debian, минимальные требования)
   ```bash
   # Установить базовые пакеты
   sudo apt update
   sudo apt install -y python3 python3-pip redis-server git
   ```

2. **Восстановить код из GitHub**
   ```bash
   sudo mkdir -p /opt/zachot
   sudo useradd -r -s /bin/false zachot
   cd /opt/zachot
   sudo -u zachot git clone https://github.com/your-org/zachot.git repo
   ```

3. **Восстановить env-файлы из бэкапа**
   ```bash
   sudo mkdir -p /opt/zachot/envs/prod/etc
   sudo cp ~/backups/zachot.env.LATEST /opt/zachot/envs/prod/etc/zachot.env
   sudo chown zachot:zachot /opt/zachot/envs/prod/etc/zachot.env
   sudo chmod 600 /opt/zachot/envs/prod/etc/zachot.env
   ```

4. **Восстановить systemd unit-файлы**
   ```bash
   sudo cp ~/backups/zachot-api.service.LATEST /etc/systemd/system/zachot-api.service
   sudo cp ~/backups/zachot-worker.service.LATEST /etc/systemd/system/zachot-worker.service
   sudo systemctl daemon-reload
   ```

5. **Настроить окружение Python** (если используется venv)
   ```bash
   cd /opt/zachot/repo
   sudo -u zachot python3 -m venv /opt/zachot/envs/prod
   sudo -u zachot /opt/zachot/envs/prod/bin/pip install -r requirements.txt
   ```

6. **Создать директории для логов**
   ```bash
   sudo mkdir -p /opt/zachot/logs
   sudo chown zachot:zachot /opt/zachot/logs
   ```

7. **Запустить сервисы**
   ```bash
   sudo systemctl start redis-server
   sudo systemctl start zachot-api
   sudo systemctl start zachot-worker
   sudo systemctl enable zachot-api zachot-worker
   ```

**Время восстановления**: 30-60 минут

**Потери**: Все in-memory state, все задачи в очереди Redis, все SSE connections

### Сценарий 2: Потеря Redis

**Ситуация**: Redis данные потеряны (удаление, corruption, форматирование диска)

**Шаги восстановления**:

1. **Остановить worker** (чтобы не пытался подключаться)
   ```bash
   sudo systemctl stop zachot-worker
   ```

2. **Очистить/пересоздать Redis**
   ```bash
   sudo systemctl stop redis-server
   sudo rm -rf /var/lib/redis/dump.rdb  # Если есть
   sudo systemctl start redis-server
   ```

3. **Проверить Redis**
   ```bash
   redis-cli PING
   ```

4. **Запустить worker** (он запустится автоматически после восстановления Redis)
   ```bash
   sudo systemctl start zachot-worker
   sudo systemctl status zachot-worker
   ```

5. **Проверить очередь** (должна быть пустой)
   ```bash
   redis-cli LLEN dramatiq:queue:default
   ```

**Время восстановления**: 5-10 минут

**Потери**: Все задачи в очереди Redis. Новые задачи можно создать через API.

### Сценарий 3: Ошибочный deploy

**Ситуация**: Развернут код с критическим багом, сервисы падают

**Шаги восстановления**:

1. **Остановить сервисы**
   ```bash
   sudo systemctl stop zachot-api zachot-worker
   ```

2. **Откатить код к предыдущей версии**
   ```bash
   cd /opt/zachot/repo
   sudo -u zachot git log --oneline -10  # Найти предыдущий коммит
   sudo -u zachot git checkout <previous-commit-hash>
   ```

3. **Или откатить к последнему стабильному тегу**
   ```bash
   cd /opt/zachot/repo
   sudo -u zachot git fetch --tags
   sudo -u zachot git checkout <stable-tag>
   ```

4. **Перезапустить сервисы**
   ```bash
   sudo systemctl start zachot-api zachot-worker
   sudo systemctl status zachot-api zachot-worker
   ```

5. **Проверить логи на ошибки**
   ```bash
   sudo tail -f /opt/zachot/logs/api.err
   sudo tail -f /opt/zachot/logs/worker.err
   ```

**Время восстановления**: 5-15 минут

**Потери**: Зависит от типа бага. Может быть потеря in-memory state при рестарте API.

### Сценарий 4: Удаление env-файлов

**Ситуация**: Случайно удалены или повреждены env-файлы

**Шаги восстановления**:

1. **Остановить сервисы** (они не запустятся без env-файлов)
   ```bash
   sudo systemctl stop zachot-api zachot-worker
   ```

2. **Восстановить env-файл из бэкапа**
   ```bash
   sudo cp ~/backups/zachot.env.LATEST /opt/zachot/envs/prod/etc/zachot.env
   sudo chown zachot:zachot /opt/zachot/envs/prod/etc/zachot.env
   sudo chmod 600 /opt/zachot/envs/prod/etc/zachot.env
   ```

3. **Проверить содержимое** (убедиться что файл восстановлен)
   ```bash
   sudo cat /opt/zachot/envs/prod/etc/zachot.env
   ```

4. **Запустить сервисы**
   ```bash
   sudo systemctl start zachot-api zachot-worker
   sudo systemctl status zachot-api zachot-worker
   ```

**Время восстановления**: 2-5 минут

**Потери**: Нет (если бэкап актуален)

## Рекомендации по бэкапам

### Минимальный набор бэкапов

1. **Env-файлы**: Еженедельный snapshot + перед каждым изменением
2. **Systemd unit-файлы**: Перед каждым изменением (или хранить в GitHub)
3. **Логи**: Не бэкапится (ротация сохраняет 14 дней локально)

### Где хранить бэкапы

**Варианты**:
- Локально на сервере: `~/backups/` (риск потери при сбое сервера)
- На отдельном сервере: SCP/SFTP на другой сервер
- В GitHub: Создать приватный репозиторий для бэкапов (только env-файлы без секретов)
- На локальной машине: Периодически скачивать бэкапы

**Рекомендация**: Минимум 2 места (локально + удаленно)

### Автоматизация (опционально)

Простой cron для env-файлов:
```bash
# Добавить в crontab (sudo crontab -e)
0 2 * * 0 cp /opt/zachot/envs/prod/etc/zachot.env ~/backups/zachot.env.$(date +\%Y\%m\%d)
```

### Проверка бэкапов

Периодически проверять:
- Бэкапы существуют и читаемы
- Бэкапы не старше 1 недели
- Можно восстановить из бэкапа (тестовое восстановление)

## Чеклист восстановления

При любом disaster scenario:

- [ ] Остановить все сервисы
- [ ] Оценить масштаб проблемы
- [ ] Восстановить критичные файлы (env, unit-файлы)
- [ ] Восстановить код (если нужно)
- [ ] Проверить зависимости (Redis, Python, systemd)
- [ ] Запустить сервисы по порядку (Redis → Worker → API)
- [ ] Проверить статус всех сервисов
- [ ] Проверить логи на ошибки
- [ ] Проверить работоспособность через API endpoints


