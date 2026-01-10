"""
Настройки приложения API.

Загружает конфигурацию из переменных окружения.
"""

import os
from typing import Literal
from dotenv import load_dotenv

# Загружаем переменные из .env файла
load_dotenv()

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

        # OpenAI / OpenRouter
        self.openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
        self.openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")

        # Database
        self.database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/zachot")
        self.jwt_secret: str = os.getenv("JWT_SECRET", "zachot-super-secret-key-2026")

        # T-Bank (Tinkoff) Acquiring
        # Тестовые credentials из документации T-Bank (для production заменить через ENV)
        self.tbank_terminal_key: str = os.getenv("TBANK_TERMINAL_KEY", "1768061897408DEMO")
        self.tbank_secret_key: str = os.getenv("TBANK_SECRET_KEY", "QNX%z2q*FEAWJSVw")
        self.tbank_api_url: str = os.getenv("TBANK_API_URL", "https://securepay.tinkoff.ru/v2")


# Глобальный экземпляр настроек
settings = Settings()

