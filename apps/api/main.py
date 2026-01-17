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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.database import init_db, SessionLocal
from apps.api.settings import settings
from apps.api.routers import payments, auth, generations, admin, me, health, jobs, ai_editing, sources, referrals, credits

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
app.include_router(admin.router)
app.include_router(me.router)
app.include_router(jobs.router)
app.include_router(ai_editing.router)
app.include_router(sources.router)
app.include_router(referrals.router)
app.include_router(credits.router)


@app.on_event("startup")
async def startup():
    """Инициализация при запуске с валидацией."""
    logger.info("Starting Зачёт API...")
    
    # 1. Проверяем ENV
    if settings.env not in ["dev", "test", "prod"]:
        logger.error(f"❌ Invalid ENV: {settings.env}")
        raise RuntimeError("ENV must be one of: dev, test, prod")
    
    logger.info(f"Environment: {settings.env}")
    
    # 2. Проверяем, что в production используется PostgreSQL
    if settings.env == "prod" and "sqlite" in settings.database_url.lower():
        logger.error("❌ Production must use PostgreSQL, not SQLite!")
        raise RuntimeError("Invalid database configuration for production")
    
    # 3. Проверяем подключение к БД
    try:
        with SessionLocal() as session:
            from sqlalchemy import text
            session.execute(text("SELECT 1"))
        logger.info("✅ Database connection OK")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise RuntimeError(f"Cannot connect to database: {e}")
    
    # 4. Инициализируем таблицы (если их нет)
    init_db()
    logger.info("✅ Database initialized")


@app.on_event("shutdown")
async def shutdown():
    """Очистка при остановке."""
    logger.info("Shutting down Зачёт API...")
    
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
    """Health check endpoint with DB validation."""
    try:
        # Проверяем подключение к БД
        with SessionLocal() as session:
            from sqlalchemy import text
            session.execute(text("SELECT 1"))
        
        # Проверяем, что используем PostgreSQL в production
        db_type = "postgresql" if "postgresql" in settings.database_url else "sqlite"
        
        if settings.env == "prod" and db_type == "sqlite":
            return {
                "status": "degraded",
                "service": "zachot-api",
                "warning": "Using SQLite in production",
                "env": settings.env
            }
        
        return {
            "status": "ok",
            "service": "zachot-api",
            "database": db_type,
            "env": settings.env
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "zachot-api",
            "error": str(e)
        }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Зачёт API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "apps.api.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )
