"""
Настройки приложения API.

Загружает конфигурацию из переменных окружения.
"""

import os
from typing import Literal


class Settings:
    """
    Настройки приложения.
    
    Все настройки могут быть переопределены через переменные окружения.
    Дефолтные значения безопасны для production.
    """
    
    def __init__(self):
        """Инициализация настроек из переменных окружения."""
        # Окружение: dev, test, prod
        self.env: str = os.getenv("ENV", "dev")
        
        # Режим отладки
        debug_str = os.getenv("DEBUG", "false").lower()
        self.debug: bool = debug_str in ("true", "1", "yes")
        
        # Название сервиса
        self.service_name: str = os.getenv("SERVICE_NAME", "zachot-api")
        
        # Порт для запуска сервера
        self.port: int = int(os.getenv("PORT", "8000"))
        
        # Хост для запуска сервера
        self.host: str = os.getenv("HOST", "0.0.0.0")


# Глобальный экземпляр настроек
settings = Settings()

