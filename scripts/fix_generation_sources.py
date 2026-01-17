#!/usr/bin/env python3
"""
Скрипт для исправления генерации - добавляет источники вручную.
"""

import sys
import os
import asyncio

# Добавляем путь к проекту
sys.path.insert(0, '/root/zachot')

from apps.api.storage import generation_store
from apps.api.services.ai_suggestion_service import AISuggestionService
from uuid import UUID

async def fix_generation_sources(generation_id: str):
    """Исправляет источники для генерации."""
    
    try:
        gen_uuid = UUID(generation_id)
        generation = generation_store.get(gen_uuid)
        
        if not generation:
            print(f"❌ Генерация {generation_id} не найдена!")
            return
        
        print(f"\n📋 Генерация {generation_id}")
        print(f"=" * 60)
        print(f"Тема: {generation.input_payload.get('topic')}")
        print(f"Текущих источников: {len(generation.settings_payload.get('sources', []))}")
        
        # Получаем источники через AI
        print(f"\n🔍 Ищу источники через AI...")
        result = await AISuggestionService.suggest_sources(
            topic=generation.input_payload.get('topic', ''),
            goal=generation.input_payload.get('goal', ''),
            idea=generation.input_payload.get('idea', ''),
            module="TEXT",
            work_type=generation.work_type or "other",
            complexity=generation.complexity_level or "student",
            humanity=generation.humanity_level or 50,
            user_id=generation.user_id
        )
        
        sources = result.get("sources", [])
        is_academic = result.get("is_academic", None)
        message = result.get("message", None)
        error = result.get("error", None)
        
        print(f"\n📊 Результат:")
        print(f"   Найдено источников: {len(sources)}")
        print(f"   Тип: {'🎓 Академические' if is_academic else '📚 Неакадемические' if is_academic is False else '❓ Неизвестно'}")
        if message:
            print(f"   Сообщение: {message}")
        if error:
            print(f"   ❌ Ошибка: {error}")
            return
        
        if not sources:
            print(f"\n⚠️ Источники не найдены!")
            return
        
        # Обновляем генерацию
        print(f"\n💾 Сохраняю источники в генерацию...")
        generation_store.update(
            gen_uuid,
            settings_payload={
                **generation.settings_payload,
                "sources": sources
            }
        )
        
        print(f"✅ Источники успешно добавлены!")
        print(f"\n📚 Добавленные источники:")
        for idx, source in enumerate(sources, 1):
            print(f"   {idx}. {source.get('title', 'Без названия')}")
            print(f"      Академический: {source.get('isAcademic', 'Не указано')}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 fix_generation_sources.py <generation_id>")
        sys.exit(1)
    
    generation_id = sys.argv[1]
    asyncio.run(fix_generation_sources(generation_id))
