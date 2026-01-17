#!/usr/bin/env python3
"""
Скрипт для проверки генераций в базе данных.
"""
import sys
import os
sys.path.insert(0, '/root/zachot')

# Устанавливаем переменные окружения для подключения к БД
os.environ.setdefault('DATABASE_URL', 'postgresql://zachot_user:your_password@localhost:5433/zachot_production')

from apps.api.database import SessionLocal, GenerationDB, User

try:
    with SessionLocal() as session:
        # Получаем все генерации
        total_gens = session.query(GenerationDB).count()
        print(f"Total generations in database: {total_gens}")
        
        # Получаем последние 10 генераций
        recent_gens = session.query(GenerationDB).order_by(GenerationDB.created_at.desc()).limit(10).all()
        print(f"\nLast 10 generations:")
        for gen in recent_gens:
            user = session.query(User).filter(User.id == gen.user_id).first()
            user_email = user.email if user else "Unknown"
            print(f"  - ID: {gen.id}")
            print(f"    User: {user_email} ({gen.user_id})")
            print(f"    Status: {gen.status}")
            print(f"    Work type: {gen.work_type}")
            print(f"    Created: {gen.created_at}")
            print()
            
        # Ищем конкретную генерацию
        target_id = "e602507a-9109-4906-9e24-f9dff8923009"
        target_gen = session.query(GenerationDB).filter(GenerationDB.id == target_id).first()
        if target_gen:
            print(f"\nTarget generation {target_id} found:")
            user = session.query(User).filter(User.id == target_gen.user_id).first()
            print(f"  User: {user.email if user else 'Unknown'} ({target_gen.user_id})")
            print(f"  Status: {target_gen.status}")
        else:
            print(f"\nTarget generation {target_id} NOT FOUND")
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
