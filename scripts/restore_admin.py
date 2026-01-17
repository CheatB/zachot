#!/usr/bin/env python3
"""
Скрипт для восстановления админского статуса и кредитов пользователя.
Работает напрямую с SQLite базой данных.
"""

import sqlite3
import sys
from datetime import datetime
from uuid import uuid4

def restore_admin(email: str, credits: int = 500):
    """Восстанавливает админский статус и добавляет кредиты."""
    
    # Подключаемся к БД
    conn = sqlite3.connect('/home/deploy/zachot/zachet.db')
    cursor = conn.cursor()
    
    try:
        # Находим пользователя
        cursor.execute("SELECT id, email, role, credits_balance FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ Пользователь {email} не найден!")
            return False
        
        user_id, user_email, current_role, current_credits = user
        print(f"\n📋 Найден пользователь:")
        print(f"   Email: {user_email}")
        print(f"   ID: {user_id}")
        print(f"   Текущая роль: {current_role}")
        print(f"   Текущий баланс: {current_credits} кредитов")
        
        # Обновляем роль и кредиты
        new_credits = current_credits + credits
        cursor.execute(
            "UPDATE users SET role = 'admin', credits_balance = ? WHERE id = ?",
            (new_credits, user_id)
        )
        
        # Создаём транзакцию для истории
        transaction_id = str(uuid4())
        cursor.execute(
            """INSERT INTO credit_transactions 
               (id, user_id, amount, transaction_type, description, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                transaction_id,
                user_id,
                credits,
                'admin_grant',
                'Восстановление админского статуса и кредитов',
                datetime.utcnow().isoformat()
            )
        )
        
        conn.commit()
        
        print(f"\n✅ Успешно обновлено:")
        print(f"   Роль: admin")
        print(f"   Баланс: {new_credits} кредитов (+{credits})")
        print(f"   Транзакция: {transaction_id}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def check_admin_history(email: str):
    """Проверяет историю изменений роли пользователя."""
    
    conn = sqlite3.connect('/home/deploy/zachot/zachet.db')
    cursor = conn.cursor()
    
    try:
        # Получаем ID пользователя
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        result = cursor.fetchone()
        
        if not result:
            print(f"❌ Пользователь {email} не найден!")
            return
        
        user_id = result[0]
        
        # Проверяем историю транзакций
        cursor.execute(
            """SELECT created_at, amount, transaction_type, description 
               FROM credit_transactions 
               WHERE user_id = ? 
               ORDER BY created_at DESC 
               LIMIT 10""",
            (user_id,)
        )
        
        transactions = cursor.fetchall()
        
        if transactions:
            print(f"\n📊 Последние 10 транзакций для {email}:")
            for tx in transactions:
                created_at, amount, tx_type, description = tx
                print(f"   {created_at} | {amount:+4d} кр. | {tx_type:15s} | {description}")
        else:
            print(f"\n📊 Транзакций не найдено для {email}")
            
    finally:
        conn.close()

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
