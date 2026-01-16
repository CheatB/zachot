#!/usr/bin/env python3
"""
Скрипт для применения индексов к существующей БД.
Работает как с SQLite, так и с PostgreSQL.
"""

import sys
import os

# Добавляем путь к проекту
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from apps.api.database import engine
from sqlalchemy import text

def apply_indexes():
    """Применяет индексы к базе данных."""
    
    indexes = [
        # Индексы для generations
        "CREATE INDEX IF NOT EXISTS ix_generations_user_id ON generations(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_generations_status ON generations(status)",
        "CREATE INDEX IF NOT EXISTS ix_generations_updated_at ON generations(updated_at)",
        "CREATE INDEX IF NOT EXISTS ix_generations_created_at ON generations(created_at)",
        
        # Индексы для payments
        "CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_payments_status ON payments(status)",
        "CREATE INDEX IF NOT EXISTS ix_payments_created_at ON payments(created_at)",
        
        # Индексы для auth_tokens
        "CREATE INDEX IF NOT EXISTS ix_auth_tokens_user_id ON auth_tokens(user_id)",
        
        # Индексы для credit_transactions
        "CREATE INDEX IF NOT EXISTS ix_credit_transactions_user_id ON credit_transactions(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_credit_transactions_created_at ON credit_transactions(created_at)",
        
        # Индексы для subscriptions
        "CREATE INDEX IF NOT EXISTS ix_subscriptions_user_id ON subscriptions(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_subscriptions_status ON subscriptions(status)",
    ]
    
    print(f"Применяю индексы к БД: {engine.url}")
    print(f"Диалект: {engine.dialect.name}")
    print()
    
    with engine.connect() as conn:
        for i, sql in enumerate(indexes, 1):
            try:
                print(f"[{i}/{len(indexes)}] {sql}")
                conn.execute(text(sql))
                conn.commit()
                print("  ✓ Успешно")
            except Exception as e:
                print(f"  ⚠ Ошибка: {e}")
    
    print()
    print("✅ Индексы применены!")
    
    # Проверяем индексы
    print("\nПроверка созданных индексов:")
    with engine.connect() as conn:
        if engine.dialect.name == 'sqlite':
            result = conn.execute(text("""
                SELECT name, tbl_name 
                FROM sqlite_master 
                WHERE type='index' AND name LIKE 'ix_%'
                ORDER BY tbl_name, name
            """))
        else:  # PostgreSQL
            result = conn.execute(text("""
                SELECT indexname, tablename
                FROM pg_indexes
                WHERE schemaname = 'public' AND indexname LIKE 'ix_%'
                ORDER BY tablename, indexname
            """))
        
        for row in result:
            print(f"  - {row[0]} on {row[1]}")

if __name__ == "__main__":
    apply_indexes()
