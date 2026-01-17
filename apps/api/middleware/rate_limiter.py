"""
Rate Limiter для защиты API от абьюза.

Использует slowapi для ограничения частоты запросов.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Создаем limiter с ключом по IP адресу
limiter = Limiter(key_func=get_remote_address)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Обработчик превышения лимита запросов.
    
    Возвращает 429 Too Many Requests с информацией о лимите.
    """
    logger.warning(
        f"Rate limit exceeded for {get_remote_address(request)}: {exc.detail}"
    )
    
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Слишком много запросов. Пожалуйста, подождите немного.",
            "detail": exc.detail,
        },
        headers={"Retry-After": "60"}  # Рекомендуем повторить через 60 секунд
    )


# Предустановленные лимиты для разных типов операций
class RateLimits:
    """Константы лимитов для разных операций."""
    
    # Генерации (самые дорогие операции)
    GENERATION_CREATE = "5/minute"          # Максимум 5 генераций в минуту
    GENERATION_ACTION = "20/minute"         # Действия с генерациями
    
    # AI suggestions (дорогие операции)
    AI_SUGGESTION = "20/minute"             # AI подсказки (детали, структура, источники)
    AI_SMART_EDIT = "30/minute"             # Smart edit
    
    # Обычные CRUD операции
    READ_OPERATIONS = "100/minute"          # Чтение данных
    WRITE_OPERATIONS = "50/minute"          # Создание/обновление
    
    # Аутентификация
    AUTH_LOGIN = "10/minute"                # Попытки входа
    AUTH_REGISTER = "5/minute"              # Регистрация
    
    # Платежи
    PAYMENT_CREATE = "10/minute"            # Создание платежей
    PAYMENT_INIT = "10/minute"              # Инициализация платежей
    
    # Файлы
    FILE_UPLOAD = "20/minute"               # Загрузка файлов
    FILE_DOWNLOAD = "50/minute"             # Скачивание файлов
