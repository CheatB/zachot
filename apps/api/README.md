# Zachot API

Минимальный API skeleton для системы генераций образовательного продукта «Зачёт».

## Описание

Это каркас FastAPI приложения, готовый к расширению. Содержит:
- Базовую структуру FastAPI приложения
- Health check эндпоинт
- Настройки через переменные окружения
- Базовое логирование
- CORS middleware

**Важно:** Это skeleton без бизнес-логики. Domain layer находится в `packages/core_domain/` и не импортируется здесь.

## Запуск

### Базовый запуск

```bash
# Из корня проекта
cd apps/api
uvicorn main:app --reload
```

Или из корня проекта:

```bash
uvicorn apps.api.main:app --reload
```

### С переменными окружения

```bash
export ENV=dev
export DEBUG=true
uvicorn apps.api.main:app --reload
```

Или через `.env` файл:

```env
ENV=dev
DEBUG=true
SERVICE_NAME=zachot-api
PORT=8000
HOST=0.0.0.0
```

### Production запуск

```bash
export ENV=prod
export DEBUG=false
uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
```

## Эндпоинты

### Health Check

```bash
GET /health
```

Ответ:
```json
{
  "status": "ok",
  "service": "zachot-api"
}
```

### Root

```bash
GET /
```

Ответ:
```json
{
  "service": "zachot-api",
  "version": "0.1.0",
  "status": "running"
}
```

## Структура

```
apps/api/
├── main.py           # FastAPI app, middleware, hooks
├── settings.py       # Настройки приложения
├── routers/          # Роутеры
│   ├── __init__.py
│   └── health.py     # Health check роутер
└── README.md         # Этот файл
```

## Настройки

Все настройки загружаются из переменных окружения через Pydantic BaseSettings:

- `ENV` - окружение (dev/test/prod), по умолчанию: `dev`
- `DEBUG` - режим отладки, по умолчанию: `false`
- `SERVICE_NAME` - название сервиса, по умолчанию: `zachot-api`
- `PORT` - порт сервера, по умолчанию: `8000`
- `HOST` - хост сервера, по умолчанию: `0.0.0.0`

## Расширение

Для добавления новых эндпоинтов:

1. Создайте новый роутер в `routers/`
2. Импортируйте и подключите в `main.py`:
   ```python
   from .routers import your_router
   app.include_router(your_router.router)
   ```

## Зависимости

Требуются следующие пакеты:
- `fastapi`
- `uvicorn`

Установка:
```bash
pip install fastapi uvicorn
```

## Логирование

Логирование настроено автоматически:
- В режиме DEBUG: уровень DEBUG
- В production: уровень INFO

Логи выводятся в stdout в формате:
```
YYYY-MM-DD HH:MM:SS - logger_name - LEVEL - message
```

## Примечания

- Это skeleton без бизнес-логики
- Domain layer (`packages/core_domain/`) не импортируется
- CORS настроен permissive (для production следует ограничить)
- Нет подключения к БД, очередям, Redis и т.п.

