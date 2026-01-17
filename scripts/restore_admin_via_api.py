#!/usr/bin/env python3
"""
Скрипт для восстановления админского статуса через прямое обращение к БД API.
"""

import sys
import os

# Добавляем путь к проекту
sys.path.insert(0, '/home/deploy/zachot')

from apps.api.database import SessionLocal
from packages.database.src.models import User, CreditTransaction
from datetime import datetime
from uuid import uuid4

def restore_admin(email: str, credits: int = 500):
    """Восстанавливает админский статус и добавляет кредиты."""
    
    with SessionLocal() as session:
        try:
            # Находим пользователя
            user = session.query(User).filter(User.email == email).first()
            
            if not user:
                print(f"❌ Пользователь {email} не найден!")
                return False
            
            print(f"\n📋 Найден пользователь:")
            print(f"   Email: {user.email}")
            print(f"   ID: {user.id}")
            print(f"   Текущая роль: {user.role}")
            print(f"   Текущий баланс: {user.credits_balance} кредитов")
            
            # Обновляем роль и кредиты
            user.role = 'admin'
            user.credits_balance += credits
            
            # Создаём транзакцию для истории
            transaction = CreditTransaction(
                id=uuid4(),
                user_id=user.id,
                amount=credits,
                balance_after=user.credits_balance,
                transaction_type='BONUS',
                reason='Восстановление админского статуса и кредитов',
                created_at=datetime.utcnow()
            )
            
            session.add(transaction)
            session.commit()
            session.refresh(user)
            
            print(f"\n✅ Успешно обновлено:")
            print(f"   Роль: {user.role}")
            print(f"   Баланс: {user.credits_balance} кредитов")
            print(f"   Транзакция: {transaction.id}")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Ошибка: {e}")
            import traceback
            traceback.print_exc()
            session.rollback()
            return False

def check_admin_history(email: str):
    """Проверяет историю изменений роли пользователя."""
    
    with SessionLocal() as session:
        try:
            # Получаем пользователя
            user = session.query(User).filter(User.email == email).first()
            
            if not user:
                print(f"❌ Пользователь {email} не найден!")
                return
            
            # Проверяем историю транзакций
            transactions = session.query(CreditTransaction).filter(
                CreditTransaction.user_id == user.id
            ).order_by(CreditTransaction.created_at.desc()).limit(10).all()
            
            if transactions:
                print(f"\n📊 Последние 10 транзакций для {email}:")
                for tx in transactions:
                    print(f"   {tx.created_at} | {tx.amount:+4d} кр. | {tx.transaction_type:15s} | {tx.reason}")
            else:
                print(f"\n📊 Транзакций не найдено для {email}")
                
        except Exception as e:
            print(f"\n❌ Ошибка при проверке истории: {e}")

if __name__ == "__main__":
    email = "nata@martsinkevich.ru"
    credits = 500
    
    print("=" * 60)
    print("🔧 Восстановление админского статуса")
    print("=" * 60)
    
    # Проверяем историю
    check_admin_history(email)
    
    # Восстанавливаем статус
    if restore_admin(email, credits):
        print("\n" + "=" * 60)
        print("✅ Готово!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ Не удалось восстановить статус")
        print("=" * 60)
        sys.exit(1)
