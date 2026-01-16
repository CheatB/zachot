#!/usr/bin/env python3
"""
Скрипт для добавления реферальной системы в базу данных.
Добавляет поля: referral_code, referred_by, referrals_count
"""

import sys
import os
from uuid import uuid4

# Добавляем путь к проекту
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from apps.api.database import SessionLocal

def generate_referral_code():
    """Генерирует уникальный реферальный код (8 символов)."""
    return str(uuid4())[:8].upper()

def add_referral_columns():
    """Добавляет колонки для реферальной системы."""
    session = SessionLocal()
    
    try:
        # Проверяем, существуют ли уже колонки
        result = session.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name IN ('referral_code', 'referred_by', 'referrals_count')
        """))
        existing_columns = [row[0] for row in result]
        
        if 'referral_code' in existing_columns:
            print("✅ Колонки реферальной системы уже существуют")
            return
        
        print("📝 Добавляем колонки для реферальной системы...")
        
        # Добавляем колонки
        session.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS referral_code VARCHAR,
            ADD COLUMN IF NOT EXISTS referred_by CHAR(32),
            ADD COLUMN IF NOT EXISTS referrals_count INTEGER DEFAULT 0
        """))
        
        # Создаём индексы
        session.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)
        """))
        
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by)
        """))
        
        session.commit()
        print("✅ Колонки добавлены успешно")
        
        # Генерируем реферальные коды для существующих пользователей
        print("📝 Генерируем реферальные коды для существующих пользователей...")
        
        result = session.execute(text("SELECT id FROM users WHERE referral_code IS NULL"))
        users_without_codes = result.fetchall()
        
        for (user_id,) in users_without_codes:
            ref_code = generate_referral_code()
            session.execute(
                text("UPDATE users SET referral_code = :code WHERE id = :user_id"),
                {"code": ref_code, "user_id": user_id}
            )
        
        session.commit()
        print(f"✅ Сгенерировано {len(users_without_codes)} реферальных кодов")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        session.close()

def grant_admin_access():
    """Даёт админ-доступ и кредиты пользователю nata@martsinkevich.ru."""
    session = SessionLocal()
    
    try:
        print("📝 Настраиваем админ-доступ для nata@martsinkevich.ru...")
        
        result = session.execute(
            text("SELECT id, email, role, credits_balance FROM users WHERE email = :email"),
            {"email": "nata@martsinkevich.ru"}
        )
        user = result.fetchone()
        
        if not user:
            print("❌ Пользователь nata@martsinkevich.ru не найден")
            return
        
        user_id, email, current_role, current_credits = user
        
        # Обновляем роль и кредиты
        session.execute(
            text("""
                UPDATE users 
                SET role = 'admin', 
                    credits_balance = credits_balance + 500
                WHERE email = :email
            """),
            {"email": "nata@martsinkevich.ru"}
        )
        
        session.commit()
        
        print(f"✅ Пользователь {email}:")
        print(f"   - Роль: {current_role} → admin")
        print(f"   - Кредиты: {current_credits} → {current_credits + 500}")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("🚀 Установка реферальной системы...")
    print()
    
    add_referral_columns()
    print()
    grant_admin_access()
    
    print()
    print("🎉 Готово!")
