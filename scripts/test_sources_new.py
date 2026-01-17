#!/usr/bin/env python3
"""
Тестовый скрипт для проверки новой двухфазной логики поиска источников.
"""

import sys
import os
import asyncio
import json

# Добавляем путь к проекту
sys.path.insert(0, '/root/zachot')

from apps.api.services.ai_suggestion_service import AISuggestionService
from uuid import uuid4

async def test_sources_search(topic: str, work_type: str = "referat"):
    """Тестирует поиск источников для заданной темы."""
    
    print(f"\n{'='*80}")
    print(f"🔍 Тестирую поиск источников для темы: {topic}")
    print(f"   Тип работы: {work_type}")
    print(f"{'='*80}\n")
    
    try:
        result = await AISuggestionService.suggest_sources(
            topic=topic,
            goal="Исследовать тему",
            idea="Основная идея работы",
            module="TEXT",
            work_type=work_type,
            complexity="student",
            humanity=50,
            user_id=uuid4()
        )
        
        sources = result.get("sources", [])
        is_academic = result.get("is_academic", None)
        message = result.get("message", None)
        error = result.get("error", None)
        
        print(f"📊 Результат:")
        print(f"   Найдено источников: {len(sources)}")
        print(f"   Тип источников: {'🎓 Академические' if is_academic else '📚 Неакадемические' if is_academic is False else '❓ Неизвестно'}")
        if message:
            print(f"   Сообщение: {message}")
        if error:
            print(f"   ❌ Ошибка: {error}")
        
        print(f"\n📚 Источники:")
        for idx, source in enumerate(sources, 1):
            print(f"\n   {idx}. {source.get('title', 'Без названия')}")
            print(f"      Автор: {source.get('author', 'Не указан')}")
            print(f"      Год: {source.get('year', 'Не указан')}")
            print(f"      URL: {source.get('url', 'Нет URL')}")
            print(f"      Тип: {source.get('type', 'Не указан')}")
            print(f"      Академический: {source.get('isAcademic', 'Не указано')}")
            print(f"      Описание: {source.get('description', 'Нет описания')[:100]}...")
        
        return result
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        import traceback
        traceback.print_exc()
        return None

async def main():
    """Запускает тесты для разных тем."""
    
    # Тест 1: Академическая тема
    await test_sources_search(
        topic="Влияние ИИ на когнитивные способности зумеров",
        work_type="referat"
    )
    
    # Тест 2: Неакадемическая тема
    await test_sources_search(
        topic="Империя Тау в Warhammer 40000",
        work_type="referat"
    )
    
    # Тест 3: Ещё одна академическая тема
    await test_sources_search(
        topic="Квантовая механика и её применение",
        work_type="kursach"
    )

if __name__ == "__main__":
    asyncio.run(main())
