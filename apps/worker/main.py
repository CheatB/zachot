"""
Точка входа для worker-процесса.

Импортирует broker и actors, чтобы они зарегистрировались в Dramatiq.
Никакой логики выполнения - только импорты для регистрации.
"""

import logging

# Импортируем broker для настройки RedisBroker
from . import broker  # noqa: F401

# Импортируем runtime actors для регистрации execute_job actor
# Runtime импорт нужен для регистрации @dramatiq.actor декораторов
from . import _actors_runtime  # noqa: F401

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%m:%S",
)

logger = logging.getLogger(__name__)

logger.info("Worker process initialized: broker and actors registered")


