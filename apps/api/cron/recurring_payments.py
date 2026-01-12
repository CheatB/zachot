#!/usr/bin/env python3
"""
Cron скрипт для обработки рекуррентных платежей.

Запускается ежедневно для:
1. Поиска подписок, срок которых истекает в ближайшие 3 дня
2. Выполнения автоматических списаний по сохранённым картам
3. Отправки уведомлений пользователям

Использование:
    python -m apps.api.cron.recurring_payments

Или через crontab:
    0 10 * * * cd /path/to/zachet && python -m apps.api.cron.recurring_payments
"""

import asyncio
import logging
import os
import sys
from datetime import datetime

# Добавляем корень проекта в путь
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from apps.api.database import SessionLocal
from apps.api.services.payment_service import PaymentService

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f"/tmp/recurring_payments_{datetime.now().strftime('%Y%m%d')}.log"),
    ]
)

logger = logging.getLogger(__name__)


async def main():
    """Основная функция cron-задачи."""
    logger.info("=" * 60)
    logger.info("Starting recurring payments processing...")
    logger.info(f"Time: {datetime.now().isoformat()}")
    logger.info("=" * 60)
    
    try:
        # Создаём сессию БД
        db = SessionLocal()
        
        try:
            # Создаём сервис платежей
            service = PaymentService(db)
            
            # Обрабатываем рекуррентные платежи
            stats = await service.process_recurring_payments()
            
            logger.info("-" * 40)
            logger.info("Processing completed!")
            logger.info(f"Total subscriptions: {stats['total']}")
            logger.info(f"Successfully charged: {stats['success']}")
            logger.info(f"Failed: {stats['failed']}")
            logger.info("-" * 40)
            
            # Возвращаем код ошибки если были неуспешные списания
            if stats['failed'] > 0:
                logger.warning(f"There were {stats['failed']} failed charges!")
                return 1
            
            return 0
            
        finally:
            db.close()
            
    except Exception as e:
        logger.exception(f"Critical error during recurring payments processing: {e}")
        return 2


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    logger.info(f"Exiting with code: {exit_code}")
    sys.exit(exit_code)

