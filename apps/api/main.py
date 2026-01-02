"""
Главный файл FastAPI приложения.

Создаёт и настраивает FastAPI app с базовыми middleware,
startup/shutdown hooks и подключением роутеров.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import generations, health
from .settings import settings

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle hooks для приложения.
    
    Выполняется при старте и остановке приложения.
    """
    # Startup
    logger.info(f"Starting {settings.service_name} in {settings.env} mode")
    logger.info(f"Debug mode: {settings.debug}")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.service_name}")


# Создание FastAPI приложения
app = FastAPI(
    title=settings.service_name,
    description="API для системы генераций образовательного продукта «Зачёт»",
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)

# Настройка CORS (permissive для разработки)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В production следует ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(health.router)
app.include_router(generations.router)


@app.get("/")
async def root():
    """
    Корневой эндпоинт.
    
    Returns:
        Информация о сервисе
    """
    return {
        "service": settings.service_name,
        "version": "0.1.0",
        "status": "running",
    }

