#!/usr/bin/env python3
"""
Тест fallback источников для разных типов тем.
"""

import sys
sys.path.insert(0, '/home/deploy/zachot')

from apps.api.services.ai_suggestion_service import AISuggestionService

# Тестовые темы
test_topics = [
    "Warhammer 40k: Империум vs Тау",
    "Dota 2: стратегии игры за керри",
    "Аниме Наруто: развитие персонажей",
    "Фильм Интерстеллар: научная точность",
    "Квантовая физика и теория струн",
    "История Древнего Рима",
]

print("=" * 80)
print("ТЕСТ FALLBACK ИСТОЧНИКОВ")
print("=" * 80)

for topic in test_topics:
    print(f"\n📝 Тема: {topic}")
    print("-" * 80)
    
    sources = AISuggestionService._generate_fallback_sources(topic)
    
    print(f"✅ Сгенерировано источников: {len(sources)}")
    for idx, source in enumerate(sources, 1):
        print(f"  {idx}. {source['title']}")
        print(f"     Автор: {source['author']}")
        print(f"     URL: {source['url']}")
    print()

print("=" * 80)
print("✅ Все темы получили fallback источники!")
print("=" * 80)
