"""
Главный файл FastAPI приложения.

Создаёт и настраивает FastAPI app с базовыми middleware,
startup/shutdown hooks и подключением роутеров.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from packages.core_domain import GenerationUpdated, StepUpdated, event_dispatcher
from packages.core_domain.state_machine import GenerationStateMachine

from .routers import generations, health, jobs, me
from .settings import settings
from .storage import generation_store

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


def handle_generation_updated(event: GenerationUpdated) -> None:
    """
    Обработчик события GenerationUpdated.
    
    Загружает Generation из storage, обновляет статус через state machine
    и сохраняет обратно. Это обновление автоматически триггерит SSE через
    storage.save().
    
    Args:
        event: Событие обновления Generation
    """
    try:
        generation = generation_store.get(event.generation_id)
        if not generation:
            logger.warning(f"Generation {event.generation_id} not found for event")
            return
        
        # Обновляем статус через state machine
        state_machine = GenerationStateMachine()
        try:
            updated_generation = state_machine.transition(generation, event.status)
        except Exception as e:
            logger.error(f"Error transitioning generation {event.generation_id}: {e}")
            return
        
        # Сохраняем обновлённую Generation
        # Это автоматически триггерит SSE через storage.save()
        generation_store.save(updated_generation)
        
        logger.info(
            f"Generation {event.generation_id} updated to status {event.status.value} "
            f"via domain event"
        )
    except Exception as e:
        logger.error(f"Error handling GenerationUpdated event: {e}", exc_info=True)


def handle_step_updated(event: StepUpdated) -> None:
    """
    Обработчик события StepUpdated.
    
    Логирует обновление Step. В будущем здесь можно добавить
    обновление Step в storage, если будет добавлен Step storage.
    
    Args:
        event: Событие обновления Step
    """
    try:
        logger.info(
            f"Step {event.step_id} updated: status={event.status.value}, "
            f"progress={event.progress}% (generation {event.generation_id})"
        )
        # TODO: Добавить обновление Step в storage, если будет добавлен Step storage
    except Exception as e:
        logger.error(f"Error handling StepUpdated event: {e}", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle hooks для приложения.
    
    Выполняется при старте и остановке приложения.
    Подписывается на domain events для обновления storage.
    """
    # Startup
    logger.info(f"Starting {settings.service_name} in {settings.env} mode")
    logger.info(f"Debug mode: {settings.debug}")
    
    # Подписываемся на domain events
    event_dispatcher.subscribe(handle_generation_updated)
    event_dispatcher.subscribe(handle_step_updated)
    logger.info("Subscribed to domain events")
    
    yield
    
    # Shutdown
    # Отписываемся от событий (опционально, но для чистоты)
    event_dispatcher.unsubscribe(handle_generation_updated)
    event_dispatcher.unsubscribe(handle_step_updated)
    logger.info("Unsubscribed from domain events")
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
app.include_router(jobs.router)
app.include_router(me.router)


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

