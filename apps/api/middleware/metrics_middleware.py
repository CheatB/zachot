"""
Middleware для автоматического отслеживания метрик HTTP запросов.
"""

import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from apps.api.monitoring.metrics import (
    http_requests_total,
    http_request_duration_seconds
)


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware для отслеживания метрик HTTP запросов.
    
    Автоматически записывает:
    - Количество запросов по методам, эндпоинтам и статус-кодам
    - Длительность запросов
    """
    
    async def dispatch(self, request: Request, call_next):
        # Пропускаем эндпоинт метрик, чтобы избежать рекурсии
        if request.url.path == "/metrics":
            return await call_next(request)
        
        start_time = time.time()
        
        # Выполняем запрос
        response = await call_next(request)
        
        # Вычисляем длительность
        duration = time.time() - start_time
        
        # Записываем метрики
        method = request.method
        path = request.url.path
        status_code = response.status_code
        
        # Упрощаем путь для метрик (заменяем UUID на {id})
        simplified_path = self._simplify_path(path)
        
        http_requests_total.labels(
            method=method,
            endpoint=simplified_path,
            status_code=status_code
        ).inc()
        
        http_request_duration_seconds.labels(
            method=method,
            endpoint=simplified_path
        ).observe(duration)
        
        return response
    
    @staticmethod
    def _simplify_path(path: str) -> str:
        """
        Упрощает путь для метрик, заменяя UUID и числа на плейсхолдеры.
        
        Примеры:
        - /generations/123e4567-e89b-12d3-a456-426614174000 -> /generations/{id}
        - /users/42/profile -> /users/{id}/profile
        """
        import re
        
        # Заменяем UUID
        path = re.sub(
            r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '/{id}',
            path,
            flags=re.IGNORECASE
        )
        
        # Заменяем числа
        path = re.sub(r'/\d+', '/{id}', path)
        
        return path
