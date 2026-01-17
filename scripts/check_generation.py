#!/usr/bin/env python3
"""
Скрипт для проверки данных генерации.
"""

import sys
import os
import json

# Добавляем путь к проекту
sys.path.insert(0, '/home/deploy/zachot')

from apps.api.storage import generation_store
from uuid import UUID

def check_generation(generation_id: str):
    """Проверяет данные генерации."""
    
    try:
        gen_uuid = UUID(generation_id)
        generation = generation_store.get(gen_uuid)
        
        if not generation:
            print(f"❌ Генерация {generation_id} не найдена!")
            return
        
        print(f"\n📋 Генерация {generation_id}")
        print(f"=" * 60)
        print(f"Статус: {generation.status}")
        print(f"Тип работы: {generation.work_type}")
        print(f"Модуль: {generation.module}")
        print(f"\n📝 Input Payload:")
        print(json.dumps(generation.input_payload, indent=2, ensure_ascii=False))
        print(f"\n⚙️ Settings Payload:")
        print(json.dumps(generation.settings_payload, indent=2, ensure_ascii=False))
        
        # Проверяем источники
        sources = generation.settings_payload.get("sources", [])
        print(f"\n📚 Источники: {len(sources)} шт.")
        if sources:
            for idx, source in enumerate(sources, 1):
                print(f"  {idx}. {source.get('title', 'Без названия')}")
                print(f"     {source.get('author', 'Автор не указан')}")
                print(f"     {source.get('url', 'URL не указан')}")
        else:
            print("  ⚠️ Источники отсутствуют!")
        
        # Проверяем структуру
        structure = generation.settings_payload.get("structure", [])
        print(f"\n📖 Структура: {len(structure)} разделов")
        if structure:
            for idx, section in enumerate(structure, 1):
                print(f"  {idx}. {section.get('title', 'Без названия')}")
        else:
            print("  ⚠️ Структура отсутствует!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 check_generation.py <generation_id>")
        sys.exit(1)
    
    generation_id = sys.argv[1]
    check_generation(generation_id)
