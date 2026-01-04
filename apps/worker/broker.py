"""
Настройка Dramatiq broker для работы с Redis.

Настраивает RedisBroker с использованием REDIS_URL из переменных окружения
и устанавливает его как default broker для Dramatiq.
"""

import os
import logging

import dramatiq
from dramatiq.brokers.redis import RedisBroker

logger = logging.getLogger(__name__)


def setup_broker() -> RedisBroker:
    """
    Настраивает и возвращает RedisBroker для Dramatiq.
    
    Использует REDIS_URL из переменных окружения.
    Если REDIS_URL не установлен, использует дефолтное значение redis://localhost:6379/0.
    
    Returns:
        Настроенный RedisBroker
        
    Raises:
        ValueError: Если REDIS_URL имеет неверный формат
    """
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    logger.info(f"Setting up RedisBroker with URL: {redis_url}")
    
    try:
        broker = RedisBroker(url=redis_url)
        
        # Устанавливаем broker как default для Dramatiq
        dramatiq.set_broker(broker)
        
        logger.info("RedisBroker configured and set as default Dramatiq broker")
        
        return broker
    
    except Exception as e:
        logger.error(f"Failed to setup RedisBroker: {e}")
        raise


# Инициализируем broker при импорте модуля
broker = setup_broker()


