"""
FastAPI Application for Зачёт.

Основное API приложение, включающее:
- Аутентификацию
- Генерации
- Платежи (Т-Банк)
- Админ-панель
"""

import logging
import os
import sys

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

from apps.api.database import init_db
from apps.api.routers import payments, auth, generations, admin, me, health, jobs, ai_editing, sources
from apps.api.middleware.rate_limiter import limiter, rate_limit_exceeded_handler
from apps.api.middleware.metrics_middleware import MetricsMiddleware
from apps.api.services.cache_service import cache_service

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG if os.getenv("DEBUG", "false").lower() == "true" else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger(__name__)

# Создаём приложение
app = FastAPI(
    title="Зачёт API",
    description="API для сервиса генерации учебных работ",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Metrics Middleware (добавляем первым, чтобы отслеживать все запросы)
app.add_middleware(MetricsMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://app.zachet.tech",
        "https://zachet.tech",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(health.router)
app.include_router(payments.router)
app.include_router(auth.router)
app.include_router(generations.router)
app.include_router(ai_editing.router)
app.include_router(sources.router)
app.include_router(admin.router)
app.include_router(me.router)
app.include_router(jobs.router)


@app.on_event("startup")
async def startup():
    """Инициализация при запуске."""
    logger.info("Starting Зачёт API...")
    init_db()
    logger.info("Database initialized")
    await cache_service.connect()
    logger.info("Cache service initialized")


@app.on_event("shutdown")
async def shutdown():
    """Очистка при остановке."""
    logger.info("Shutting down Зачёт API...")
    await cache_service.disconnect()
    logger.info("Cache service disconnected")
    
    # Закрываем провайдер платежей
    try:
        from packages.billing.tbank_provider import _provider
        if _provider:
            await _provider.close()
    except ImportError:
        pass
    
    logger.info("Shutdown complete")


@app.get("/health")
async def health_check_root():
    """Health check endpoint."""
    return {"status": "ok", "service": "zachet-api"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Зачёт API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    
    Возвращает метрики в формате Prometheus для мониторинга:
    - Количество генераций
    - Использование AI токенов
    - Длительность операций
    - Активные задачи
    - Ошибки
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "apps.api.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )
