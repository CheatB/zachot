# Руководство по использованию slowapi

## 🚨 Важное правило для rate limiting

При использовании декоратора `@limiter.limit()` **обязательно** соблюдайте правильное именование параметров.

---

## ✅ Правильный паттерн

```python
from fastapi import APIRouter, Request, Depends
from ..middleware.rate_limiter import limiter, RateLimits

@router.post("/endpoint")
@limiter.limit(RateLimits.AI_SUGGESTION)  # или "10/minute"
async def my_endpoint(
    request: Request,              # 1. ✅ Первый параметр ОБЯЗАТЕЛЬНО 'request'
    req_data: MyRequestModel,      # 2. ✅ Pydantic модель с другим именем
    user: UserDB = Depends(...)    # 3. ✅ Dependencies
):
    # Используем req_data для доступа к данным запроса
    result = await service.do_something(
        topic=req_data.topic,
        goal=req_data.goal
    )
    return result
```

---

## ❌ Неправильные паттерны

### Ошибка 1: Неправильное имя первого параметра

```python
@router.post("/endpoint")
@limiter.limit("10/minute")
async def my_endpoint(
    req: Request,           # ❌ ОШИБКА: slowapi ожидает 'request'!
    request: MyModel,
    user: UserDB = Depends(...)
):
    ...
```

**Ошибка:**
```
Exception: parameter `request` must be an instance of starlette.requests.Request
```

### Ошибка 2: Конфликт имён

```python
@router.post("/endpoint")
@limiter.limit("10/minute")
async def my_endpoint(
    req: Request,           # ❌ Неправильное имя
    request: MyModel,       # ❌ slowapi найдёт этот параметр и упадёт
    user: UserDB = Depends(...)
):
    ...
```

---

## 📋 Чек-лист для code review

При добавлении нового эндпоинта с rate limiting проверьте:

- [ ] Используется декоратор `@limiter.limit()`
- [ ] Первый параметр называется `request: Request`
- [ ] Pydantic модель имеет другое имя (например, `req_data`, `body`, `payload`)
- [ ] Все ссылки на данные используют правильное имя (`req_data.field`)

---

## 🔍 Примеры из проекта

### ✅ Правильно (generations.py)

```python
@router.post("", response_model=GenerationResponse, status_code=201)
@limiter.limit(RateLimits.GENERATION_CREATE)
async def create_generation(
    request: Request,                  # ✅ Для slowapi
    gen_request: GenerationCreateRequest,  # ✅ Другое имя
    user: UserDB = Depends(get_current_user)
) -> GenerationResponse:
    saved_generation = await generation_service.create_draft(
        user=user,
        module=gen_request.module,     # ✅ Используем gen_request
        ...
    )
    return GenerationResponse.model_validate(saved_generation)
```

### ✅ Правильно (admin.py)

```python
@router.post("/suggest-details")
@limiter.limit(RateLimits.AI_SUGGESTION)
async def suggest_details(
    request: Request,                  # ✅ Для slowapi
    req_data: SuggestDetailsRequest,   # ✅ Другое имя
    user: UserDB = Depends(get_current_user)
):
    return await ai_suggestion_service.suggest_details(
        topic=req_data.topic,          # ✅ Используем req_data
        module=req_data.module,
        ...
    )
```

---

## 🛠️ Как исправить существующий код

### Шаг 1: Найти проблемные эндпоинты

```bash
grep -rn "req: Request" apps/api/routers/
```

### Шаг 2: Переименовать параметры

**Было:**
```python
async def my_endpoint(req: Request, request: MyModel, ...):
```

**Стало:**
```python
async def my_endpoint(request: Request, req_data: MyModel, ...):
```

### Шаг 3: Обновить все ссылки

Замените все `request.field` на `req_data.field` в теле функции.

### Шаг 4: Перезапустить API

```bash
sudo systemctl restart zachot-api
```

---

## 📚 Дополнительная информация

### Почему это важно?

`slowapi` использует **инспекцию параметров функции** для получения объекта `Request`. Он ищет параметр с именем `request` и типом `starlette.requests.Request`.

Если параметр называется по-другому или имеет неправильный тип, `slowapi` выбросит исключение.

### Альтернативные имена для Pydantic моделей

Вместо `req_data` можно использовать:
- `body` - для POST/PUT запросов
- `payload` - для данных запроса
- `data` - универсальное имя
- `{entity}_request` - например, `generation_request`, `user_request`

**Главное правило:** НЕ используйте имя `request` для Pydantic модели!

---

## 🐛 История проблемы

### Коммит #260 (2026-01-16)
- **Проблема:** `POST /api/generations` возвращал 500 ошибку
- **Причина:** `req: Request` вместо `request: Request`
- **Решение:** Переименован в `request: Request`, Pydantic модель в `gen_request`

### Коммит #263 (2026-01-16)
- **Проблема:** `POST /api/admin/suggest-details` возвращал 500 ошибку
- **Причина:** Все 4 admin эндпоинта использовали `req: Request`
- **Решение:** Переименованы все параметры в правильный формат

---

## ✅ Статус проекта

**Последняя проверка:** 2026-01-16

Все эндпоинты с `@limiter.limit()` используют правильный паттерн:
- ✅ `apps/api/routers/generations.py`
- ✅ `apps/api/routers/admin.py`

**Проблема решена по всему проекту!** 🎉
