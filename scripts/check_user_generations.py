#!/usr/bin/env python3
"""
Скрипт для проверки генераций пользователя.
"""
import sys
sys.path.insert(0, '/root/zachot')

from apps.api.storage import generation_store

# Получаем все генерации
all_generations = []
try:
    # Пытаемся получить все генерации из storage
    # generation_store использует in-memory storage, поэтому данные могут быть потеряны при перезапуске
    print("Checking in-memory storage...")
    
    # Проверяем, есть ли метод для получения всех генераций
    if hasattr(generation_store, '_generations'):
        all_gens = generation_store._generations
        print(f"Found {len(all_gens)} generations in memory")
        for gen_id, gen in list(all_gens.items())[:10]:
            print(f"  - {gen_id}: user={gen.user_id}, status={gen.status}, work_type={gen.work_type}")
    else:
        print("Storage doesn't have _generations attribute")
        
    # Проверяем базу данных
    print("\nChecking database...")
    from apps.api.database import SessionLocal
    from packages.database.src.models import GenerationDB
    
    with SessionLocal() as session:
        db_gens = session.query(GenerationDB).order_by(GenerationDB.created_at.desc()).limit(10).all()
        print(f"Found {len(db_gens)} generations in database (last 10):")
        for gen in db_gens:
            print(f"  - {gen.id}: user={gen.user_id}, status={gen.status}, work_type={gen.work_type}")
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
