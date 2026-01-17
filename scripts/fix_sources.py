#!/usr/bin/env python3
"""
Скрипт для исправления источников в генерации.
Вызывает suggestSources и сохраняет результат.
"""

import sys
import os
import asyncio

# Добавляем путь к проекту
sys.path.insert(0, '/home/deploy/zachot')

from apps.api.storage import generation_store
from apps.api.services.ai_suggestion_service import ai_suggestion_service
from uuid import UUID

async def fix_sources(generation_id: str):
    """Исправляет источники для генерации."""
    
    try:
        gen_uuid = UUID(generation_id)
        generation = generation_store.get(gen_uuid)
        
        if not generation:
            print(f"❌ Генерация {generation_id} не найдена!")
            return
        
        print(f"\n📋 Генерация {generation_id}")
        print(f"Тема: {generation.input_payload.get('topic', 'Не указана')}")
        print(f"\n🔍 Запрашиваем источники через AI...")
        
        # Вызываем suggestSources
        result = await ai_suggestion_service.suggest_sources(
            topic=generation.input_payload.get('topic', ''),
            goal=generation.input_payload.get('goal', ''),
            idea=generation.input_payload.get('idea', ''),
            module=generation.module.value,
            work_type=generation.work_type or 'other',
            complexity=generation.complexity_level or 'student',
            humanity=generation.humanity_level or 'medium',
            user_id=generation.user_id
        )
        
        sources = result.get('sources', [])
        print(f"\n✅ Получено {len(sources)} источников:")
        for idx, source in enumerate(sources, 1):
            print(f"  {idx}. {source.get('title', 'Без названия')}")
            print(f"     {source.get('author', 'Автор не указан')}")
        
        # Сохраняем источники
        settings_payload = generation.settings_payload.copy()
        settings_payload['sources'] = sources
        
        generation_store.update(gen_uuid, settings_payload=settings_payload)
        print(f"\n💾 Источники сохранены в генерацию!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 fix_sources.py <generation_id>")
        sys.exit(1)
    
    generation_id = sys.argv[1]
    asyncio.run(fix_sources(generation_id))
