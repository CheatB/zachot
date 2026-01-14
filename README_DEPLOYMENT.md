# 🚀 Быстрый старт для разработки

## Где находится проект?

**Единственная рабочая директория:** `/home/deploy/zachot`

**Символическая ссылка для удобства:** `/root/zachot` → `/home/deploy/zachot`

> ⚠️ **ВАЖНО:** Обе команды `cd /root/zachot` и `cd /home/deploy/zachot` приведут вас в одно и то же место!

## Быстрые команды

### Проверка статуса
```bash
systemctl status zachot-api zachot-worker zachot-bot nginx
```

### Деплой фронтенда
```bash
cd /home/deploy/zachot
npm run build
sudo systemctl reload nginx
```

### Деплой бэкенда
```bash
cd /home/deploy/zachot
sudo systemctl restart zachot-api zachot-worker
```

### Просмотр логов
```bash
# API
journalctl -u zachot-api -f

# Worker
journalctl -u zachot-worker -f

# Nginx
tail -f /var/log/nginx/error.log
```

## Полная документация

См. [DEPLOYMENT_PROTOCOL.md](./DEPLOYMENT_PROTOCOL.md) для подробных инструкций.

## Архитектура проекта

```
/home/deploy/zachot/
├── apps/
│   ├── api/           # FastAPI backend
│   └── worker/        # Dramatiq background workers
├── packages/          # Shared Python packages
├── src/               # React frontend
├── dist/              # Built frontend (served by nginx)
└── tests/             # Test suites
```

## Технологии

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** FastAPI + Python 3.10
- **Workers:** Dramatiq + Redis
- **Database:** PostgreSQL
- **Web Server:** Nginx
- **AI:** OpenRouter (GPT-4, Claude, Perplexity)

## Контакты

При проблемах проверьте:
1. Логи сервисов (`journalctl -u <service>`)
2. Права доступа (`ls -la /home/deploy/zachot`)
3. Символическую ссылку (`ls -l /root/zachot`)
4. Статус сервисов (`systemctl status <service>`)


## Где находится проект?

**Единственная рабочая директория:** `/home/deploy/zachot`

**Символическая ссылка для удобства:** `/root/zachot` → `/home/deploy/zachot`

> ⚠️ **ВАЖНО:** Обе команды `cd /root/zachot` и `cd /home/deploy/zachot` приведут вас в одно и то же место!

## Быстрые команды

### Проверка статуса
```bash
systemctl status zachot-api zachot-worker zachot-bot nginx
```

### Деплой фронтенда
```bash
cd /home/deploy/zachot
npm run build
sudo systemctl reload nginx
```

### Деплой бэкенда
```bash
cd /home/deploy/zachot
sudo systemctl restart zachot-api zachot-worker
```

### Просмотр логов
```bash
# API
journalctl -u zachot-api -f

# Worker
journalctl -u zachot-worker -f

# Nginx
tail -f /var/log/nginx/error.log
```

## Полная документация

См. [DEPLOYMENT_PROTOCOL.md](./DEPLOYMENT_PROTOCOL.md) для подробных инструкций.

## Архитектура проекта

```
/home/deploy/zachot/
├── apps/
│   ├── api/           # FastAPI backend
│   └── worker/        # Dramatiq background workers
├── packages/          # Shared Python packages
├── src/               # React frontend
├── dist/              # Built frontend (served by nginx)
└── tests/             # Test suites
```

## Технологии

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** FastAPI + Python 3.10
- **Workers:** Dramatiq + Redis
- **Database:** PostgreSQL
- **Web Server:** Nginx
- **AI:** OpenRouter (GPT-4, Claude, Perplexity)

## Контакты

При проблемах проверьте:
1. Логи сервисов (`journalctl -u <service>`)
2. Права доступа (`ls -la /home/deploy/zachot`)
3. Символическую ссылку (`ls -l /root/zachot`)
4. Статус сервисов (`systemctl status <service>`)


## Где находится проект?

**Единственная рабочая директория:** `/home/deploy/zachot`

**Символическая ссылка для удобства:** `/root/zachot` → `/home/deploy/zachot`

> ⚠️ **ВАЖНО:** Обе команды `cd /root/zachot` и `cd /home/deploy/zachot` приведут вас в одно и то же место!

## Быстрые команды

### Проверка статуса
```bash
systemctl status zachot-api zachot-worker zachot-bot nginx
```

### Деплой фронтенда
```bash
cd /home/deploy/zachot
npm run build
sudo systemctl reload nginx
```

### Деплой бэкенда
```bash
cd /home/deploy/zachot
sudo systemctl restart zachot-api zachot-worker
```

### Просмотр логов
```bash
# API
journalctl -u zachot-api -f

# Worker
journalctl -u zachot-worker -f

# Nginx
tail -f /var/log/nginx/error.log
```

## Полная документация

См. [DEPLOYMENT_PROTOCOL.md](./DEPLOYMENT_PROTOCOL.md) для подробных инструкций.

## Архитектура проекта

```
/home/deploy/zachot/
├── apps/
│   ├── api/           # FastAPI backend
│   └── worker/        # Dramatiq background workers
├── packages/          # Shared Python packages
├── src/               # React frontend
├── dist/              # Built frontend (served by nginx)
└── tests/             # Test suites
```

## Технологии

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** FastAPI + Python 3.10
- **Workers:** Dramatiq + Redis
- **Database:** PostgreSQL
- **Web Server:** Nginx
- **AI:** OpenRouter (GPT-4, Claude, Perplexity)

## Контакты

При проблемах проверьте:
1. Логи сервисов (`journalctl -u <service>`)
2. Права доступа (`ls -la /home/deploy/zachot`)
3. Символическую ссылку (`ls -l /root/zachot`)
4. Статус сервисов (`systemctl status <service>`)


## Где находится проект?

**Единственная рабочая директория:** `/home/deploy/zachot`

**Символическая ссылка для удобства:** `/root/zachot` → `/home/deploy/zachot`

> ⚠️ **ВАЖНО:** Обе команды `cd /root/zachot` и `cd /home/deploy/zachot` приведут вас в одно и то же место!

## Быстрые команды

### Проверка статуса
```bash
systemctl status zachot-api zachot-worker zachot-bot nginx
```

### Деплой фронтенда
```bash
cd /home/deploy/zachot
npm run build
sudo systemctl reload nginx
```

### Деплой бэкенда
```bash
cd /home/deploy/zachot
sudo systemctl restart zachot-api zachot-worker
```

### Просмотр логов
```bash
# API
journalctl -u zachot-api -f

# Worker
journalctl -u zachot-worker -f

# Nginx
tail -f /var/log/nginx/error.log
```

## Полная документация

См. [DEPLOYMENT_PROTOCOL.md](./DEPLOYMENT_PROTOCOL.md) для подробных инструкций.

## Архитектура проекта

```
/home/deploy/zachot/
├── apps/
│   ├── api/           # FastAPI backend
│   └── worker/        # Dramatiq background workers
├── packages/          # Shared Python packages
├── src/               # React frontend
├── dist/              # Built frontend (served by nginx)
└── tests/             # Test suites
```

## Технологии

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** FastAPI + Python 3.10
- **Workers:** Dramatiq + Redis
- **Database:** PostgreSQL
- **Web Server:** Nginx
- **AI:** OpenRouter (GPT-4, Claude, Perplexity)

## Контакты

При проблемах проверьте:
1. Логи сервисов (`journalctl -u <service>`)
2. Права доступа (`ls -la /home/deploy/zachot`)
3. Символическую ссылку (`ls -l /root/zachot`)
4. Статус сервисов (`systemctl status <service>`)



