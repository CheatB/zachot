#!/usr/bin/env python3
"""
Скрипт для миграции кредитов пользователей на новую систему.

Старая система: 1 месяц = 5 кредитов
Новая система: 1 месяц = 500 кредитов

Умножаем все балансы кредитов на 100.
"""

import sys
import os

# Добавляем корневую директорию в PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from apps.api.database import SessionLocal, engine
from packages.database.src.models import User, CreditTransaction
from datetime import datetime
from uuid import uuid4

def migrate_credits():
    """Умножает все балансы кредитов на 100."""
    
    print("🚀 Начинаем миграцию кредитов на новую систему (×100)...")
    
    with SessionLocal() as session:
        # Получаем всех пользователей с кредитами
        users = session.query(User).filter(User.credits_balance > 0).all()
        
        print(f"📊 Найдено пользователей с кредитами: {len(users)}")
        
        if not users:
            print("✅ Нет пользователей для миграции.")
            return
        
        # Подтверждение
        print("\n⚠️  ВНИМАНИЕ: Эта операция умножит все балансы кредитов на 100!")
        print(f"   Будет обновлено пользователей: {len(users)}")
        
        response = input("\nПродолжить? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Миграция отменена.")
            return
        
        # Миграция
        migrated_count = 0
        total_old_credits = 0
        total_new_credits = 0
        
        for user in users:
            old_balance = user.credits_balance
            new_balance = old_balance * 100
            
            # Обновляем баланс
            user.credits_balance = new_balance
            
            # Создаём транзакцию для истории
            transaction = CreditTransaction(
                id=uuid4(),
                user_id=user.id,
                amount=new_balance - old_balance,
                balance_after=new_balance,
                transaction_type="SYSTEM",
                reason="Миграция на новую систему кредитов (×100)",
                created_at=datetime.utcnow()
            )
            
            session.add(transaction)
            
            total_old_credits += old_balance
            total_new_credits += new_balance
            migrated_count += 1
            
            print(f"  ✓ {user.email or user.telegram_username or user.id}: {old_balance} → {new_balance} кредитов")
        
        # Сохраняем изменения
        session.commit()
        
        print(f"\n✅ Миграция завершена успешно!")
        print(f"   Обновлено пользователей: {migrated_count}")
        print(f"   Всего кредитов было: {total_old_credits}")
        print(f"   Всего кредитов стало: {total_new_credits}")
        print(f"   Коэффициент: ×100")


if __name__ == "__main__":
    try:
        migrate_credits()
    except Exception as e:
        print(f"\n❌ Ошибка при миграции: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
