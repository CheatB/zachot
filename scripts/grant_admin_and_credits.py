#!/usr/bin/env python3
"""
Скрипт для выдачи админских прав и начисления кредитов пользователю.
"""
import sys
import os
sys.path.insert(0, '/root/zachot')

# Устанавливаем переменные окружения
os.environ['DATABASE_URL'] = 'postgresql://marka:marka_pass@localhost:5433/zachot'

from apps.api.database import SessionLocal, User, CreditTransaction
from datetime import datetime
from uuid import uuid4

try:
    with SessionLocal() as session:
        # Находим пользователя
        user = session.query(User).filter(User.email == 'nata@martsinkevich.ru').first()
        
        if not user:
            print("❌ User nata@martsinkevich.ru not found!")
            sys.exit(1)
        
        print(f"✅ User found: {user.email}")
        print(f"   Current role: {user.role}")
        print(f"   Current credits: {user.credits_balance or 0}")
        
        # Выдаём админские права
        user.role = 'admin'
        
        # Начисляем 10000 кредитов
        old_balance = user.credits_balance or 0
        user.credits_balance = old_balance + 10000
        
        # Создаём транзакцию
        transaction = CreditTransaction(
            id=uuid4(),
            user_id=user.id,
            amount=10000,
            balance_after=user.credits_balance,
            transaction_type='CREDIT',
            reason='admin_grant_for_testing',
            created_at=datetime.utcnow()
        )
        session.add(transaction)
        
        session.commit()
        
        print(f"\n✅ Successfully updated user:")
        print(f"   New role: {user.role}")
        print(f"   New credits balance: {user.credits_balance}")
        print(f"   Transaction created: +10000 credits")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
