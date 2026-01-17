#!/usr/bin/env python3
"""
Скрипт для перезапуска застрявшей генерации.
"""
import sys
sys.path.insert(0, '/home/deploy/zachot')

from apps.api.tasks.generation_tasks import generate_text_content

generation_id = '5c25d693-606c-4667-95bf-27ac6eb5315e'

print(f"🚀 Запускаю генерацию {generation_id}...")
result = generate_text_content.delay(generation_id)
print(f"✅ Задача поставлена в очередь: {result.id}")
print(f"📊 Проверьте статус через 5-10 минут")
