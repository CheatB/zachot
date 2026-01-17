#!/usr/bin/env python3
"""
Скрипт миграции данных из PostgreSQL в SQLite.
"""

import sys
import os

sys.path.insert(0, '/home/deploy/zachot')

from apps.api.database import SessionLocal
from packages.database.src.models import User, Generation, Payment, CreditTransaction, Subscription
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import shutil
from datetime import datetime

def migrate_database():
    """Мигрирует данные из текущей БД в SQLite."""
    
    print("=" * 60)
    print("🔄 Миграция данных в SQLite")
    print("=" * 60)
    
    # Создаём бэкап старой БД если она существует
    sqlite_path = '/home/deploy/zachot/production.db'
    if os.path.exists(sqlite_path):
        backup_path = f'/home/deploy/zachot/backups/production_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
        os.makedirs('/home/deploy/zachot/backups', exist_ok=True)
        shutil.copy2(sqlite_path, backup_path)
        print(f"✅ Создан бэкап: {backup_path}")
    
    # Подключаемся к источнику (PostgreSQL)
    print("\n📊 Подключение к источнику данных...")
    source_session = SessionLocal()
    
    # Создаём новую SQLite БД
    print("📊 Создание SQLite БД...")
    from packages.database.src.models import Base, create_db_engine, get_session_factory
    
    sqlite_engine = create_db_engine(f'sqlite:///{sqlite_path}')
    Base.metadata.create_all(bind=sqlite_engine)
    SQLiteSession = get_session_factory(sqlite_engine)
    target_session = SQLiteSession()
    
    try:
        # Мигрируем пользователей
        print("\n👥 Миграция пользователей...")
        users = source_session.query(User).all()
        for user in users:
            # Создаём копию пользователя
            new_user = User(
                id=user.id,
                email=user.email,
                role=user.role,
                plan_name=user.plan_name,
                subscription_status=user.subscription_status,
                monthly_price_rub=user.monthly_price_rub,
                next_billing_date=user.next_billing_date,
                credits_balance=user.credits_balance,
                credits_used=user.credits_used,
                generations_used=user.generations_used,
                generations_limit=user.generations_limit,
                tokens_used=user.tokens_used,
                tokens_limit=user.tokens_limit,
                fair_use_mode=user.fair_use_mode,
                telegram_id=user.telegram_id,
                telegram_username=user.telegram_username,
                hashed_password=user.hashed_password,
                referral_code=user.referral_code,
                referred_by=user.referred_by,
                referrals_count=user.referrals_count
            )
            target_session.merge(new_user)
        target_session.commit()
        print(f"   ✅ Мигрировано {len(users)} пользователей")
        
        # Мигрируем генерации
        print("\n📝 Миграция генераций...")
        generations = source_session.query(Generation).all()
        for gen in generations:
            new_gen = Generation(
                id=gen.id,
                user_id=gen.user_id,
                module=gen.module,
                status=gen.status,
                title=gen.title,
                work_type=gen.work_type,
                complexity_level=gen.complexity_level,
                humanity_level=gen.humanity_level,
                created_at=gen.created_at,
                updated_at=gen.updated_at
            )
            # Копируем JSON поля
            if hasattr(gen, 'input_payload'):
                new_gen.input_payload = gen.input_payload
            if hasattr(gen, 'settings_payload'):
                new_gen.settings_payload = gen.settings_payload
            if hasattr(gen, 'result_content'):
                new_gen.result_content = gen.result_content
                
            target_session.merge(new_gen)
        target_session.commit()
        print(f"   ✅ Мигрировано {len(generations)} генераций")
        
        # Мигрируем транзакции кредитов
        print("\n💳 Миграция транзакций...")
        transactions = source_session.query(CreditTransaction).all()
        for tx in transactions:
            new_tx = CreditTransaction(
                id=tx.id,
                user_id=tx.user_id,
                amount=tx.amount,
                balance_after=tx.balance_after,
                transaction_type=tx.transaction_type,
                reason=tx.reason,
                generation_id=tx.generation_id,
                created_at=tx.created_at
            )
            target_session.merge(new_tx)
        target_session.commit()
        print(f"   ✅ Мигрировано {len(transactions)} транзакций")
        
        # Мигрируем платежи
        print("\n💰 Миграция платежей...")
        payments = source_session.query(Payment).all()
        for payment in payments:
            new_payment = Payment(
                id=payment.id,
                user_id=payment.user_id,
                amount=payment.amount,
                status=payment.status,
                payment_id=payment.payment_id,
                order_id=payment.order_id,
                description=payment.description,
                period=payment.period,
                rebill_id=payment.rebill_id,
                recurrent_parent_id=payment.recurrent_parent_id,
                is_recurrent=payment.is_recurrent,
                customer_email=payment.customer_email,
                customer_key=payment.customer_key,
                created_at=payment.created_at,
                updated_at=payment.updated_at,
                confirmed_at=payment.confirmed_at
            )
            target_session.merge(new_payment)
        target_session.commit()
        print(f"   ✅ Мигрировано {len(payments)} платежей")
        
        print("\n" + "=" * 60)
        print("✅ Миграция завершена успешно!")
        print("=" * 60)
        print(f"\n📍 Новая БД: {sqlite_path}")
        print(f"📊 Статистика:")
        print(f"   Пользователей: {len(users)}")
        print(f"   Генераций: {len(generations)}")
        print(f"   Транзакций: {len(transactions)}")
        print(f"   Платежей: {len(payments)}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Ошибка миграции: {e}")
        import traceback
        traceback.print_exc()
        target_session.rollback()
        return False
    finally:
        source_session.close()
        target_session.close()

if __name__ == "__main__":
    if migrate_database():
        sys.exit(0)
    else:
        sys.exit(1)
