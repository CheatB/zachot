#!/usr/bin/env python3
"""
Анализ экономики генераций из логов systemd.
"""

import subprocess
import re
from collections import defaultdict

# Тарифы OpenRouter (в USD за 1M токенов)
# Источник: https://openrouter.ai/models
OPENROUTER_RATES = {
    'openai/gpt-4o': {'input': 2.50, 'output': 10.00},
    'openai/gpt-4o-mini': {'input': 0.15, 'output': 0.60},
    'claude-3.5-sonnet': {'input': 3.00, 'output': 15.00},
    'perplexity/sonar-pro': {'input': 3.00, 'output': 15.00},  # Примерный тариф
    'perplexity/sonar-deep-research': {'input': 5.00, 'output': 15.00},  # Примерный тариф
    'mistralai/mistral-7b-instruct:free': {'input': 0.00, 'output': 0.00},  # Бесплатная модель
    'google/gemini-2.0-flash-exp:free': {'input': 0.00, 'output': 0.00},  # Бесплатная модель
}

# Курс доллара (примерный)
USD_TO_RUB = 95.0

def parse_logs():
    """Извлекает данные о токенах из логов."""
    
    # Получаем логи за последние 7 дней
    cmd = ['sudo', 'journalctl', '-u', 'zachot-api', '--since', '7 days ago']
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    logs = result.stdout
    
    # Паттерн для поиска записей об использовании токенов
    pattern = r'OpenAI Usage \[(.*?)\]: (\d+) tokens(?:, \$([0-9.]+))?'
    
    matches = re.findall(pattern, logs)
    
    usage_data = []
    for model, tokens, cost in matches:
        usage_data.append({
            'model': model,
            'tokens': int(tokens),
            'cost_usd': float(cost) if cost else None
        })
    
    return usage_data

def calculate_costs(usage_data):
    """Рассчитывает стоимость на основе токенов."""
    
    stats = defaultdict(lambda: {'count': 0, 'tokens': 0, 'cost_usd': 0.0})
    
    for entry in usage_data:
        model = entry['model']
        tokens = entry['tokens']
        
        stats[model]['count'] += 1
        stats[model]['tokens'] += tokens
        
        # Если стоимость указана в логах, используем её
        if entry['cost_usd']:
            stats[model]['cost_usd'] += entry['cost_usd']
        else:
            # Иначе рассчитываем по тарифам
            # Примерное соотношение: 60% input, 40% output
            rate = OPENROUTER_RATES.get(model, {'input': 1.0, 'output': 5.0})
            input_tokens = tokens * 0.6
            output_tokens = tokens * 0.4
            
            cost = (input_tokens / 1_000_000 * rate['input']) + \
                   (output_tokens / 1_000_000 * rate['output'])
            stats[model]['cost_usd'] += cost
    
    return stats

def main():
    print("=" * 80)
    print("💰 Анализ экономики генераций (из логов)")
    print("=" * 80)
    print()
    
    print("📊 Извлекаю данные из логов systemd...")
    usage_data = parse_logs()
    
    print(f"✅ Найдено {len(usage_data)} записей об использовании токенов")
    print()
    
    print("💵 Рассчитываю стоимость...")
    stats = calculate_costs(usage_data)
    
    # Сортируем по стоимости
    sorted_stats = sorted(stats.items(), key=lambda x: x[1]['cost_usd'], reverse=True)
    
    print()
    print("=" * 80)
    print("📈 СТАТИСТИКА ПО МОДЕЛЯМ")
    print("=" * 80)
    print()
    
    total_tokens = 0
    total_cost_usd = 0.0
    total_requests = 0
    
    for model, data in sorted_stats:
        print(f"🤖 {model}")
        print(f"   Запросов: {data['count']}")
        print(f"   Токенов: {data['tokens']:,}")
        print(f"   Стоимость: ${data['cost_usd']:.4f} USD ({data['cost_usd'] * USD_TO_RUB:.2f} ₽)")
        print()
        
        total_tokens += data['tokens']
        total_cost_usd += data['cost_usd']
        total_requests += data['count']
    
    print("=" * 80)
    print("💰 ИТОГОВАЯ СТАТИСТИКА")
    print("=" * 80)
    print()
    print(f"Всего запросов: {total_requests}")
    print(f"Всего токенов: {total_tokens:,}")
    print()
    print(f"💵 Общая стоимость:")
    print(f"   ${total_cost_usd:.4f} USD")
    print(f"   {total_cost_usd * USD_TO_RUB:.2f} ₽")
    print()
    
    if total_requests > 0:
        print(f"📊 Средняя стоимость на запрос:")
        print(f"   ${total_cost_usd / total_requests:.4f} USD")
        print(f"   {(total_cost_usd * USD_TO_RUB) / total_requests:.2f} ₽")
        print()
    
    # Оценка для полной генерации
    # Предполагаем, что полная генерация = ~10-15 AI запросов
    avg_requests_per_generation = 12
    cost_per_generation = (total_cost_usd / total_requests) * avg_requests_per_generation if total_requests > 0 else 0
    
    print(f"💡 Оценка стоимости полной генерации:")
    print(f"   (предполагая ~{avg_requests_per_generation} AI запросов на генерацию)")
    print(f"   ${cost_per_generation:.4f} USD")
    print(f"   {cost_per_generation * USD_TO_RUB:.2f} ₽")
    print()
    
    print(f"🎯 Экстраполяция на 1000 генераций:")
    print(f"   ${cost_per_generation * 1000:.2f} USD")
    print(f"   {cost_per_generation * USD_TO_RUB * 1000:.2f} ₽")
    print()
    
    # Анализ самых дорогих запросов
    print("=" * 80)
    print("🔝 ТОП-5 САМЫХ ДОРОГИХ МОДЕЛЕЙ")
    print("=" * 80)
    print()
    
    for i, (model, data) in enumerate(sorted_stats[:5], 1):
        avg_cost = data['cost_usd'] / data['count'] if data['count'] > 0 else 0
        print(f"{i}. {model}")
        print(f"   Средняя стоимость запроса: ${avg_cost:.4f} USD ({avg_cost * USD_TO_RUB:.2f} ₽)")
        print(f"   Доля в общих расходах: {(data['cost_usd'] / total_cost_usd * 100):.1f}%")
        print()
    
    # Рекомендации по оптимизации
    print("=" * 80)
    print("💡 РЕКОМЕНДАЦИИ ПО ОПТИМИЗАЦИИ")
    print("=" * 80)
    print()
    
    # Находим самую дорогую модель
    if sorted_stats:
        most_expensive = sorted_stats[0]
        print(f"1. Самая дорогая модель: {most_expensive[0]}")
        print(f"   Стоимость: ${most_expensive[1]['cost_usd']:.4f} USD")
        print(f"   Рекомендация: Рассмотреть замену на более дешёвые альтернативы")
        print()
    
    # Проверяем использование бесплатных моделей
    free_models = [m for m, d in stats.items() if ':free' in m]
    if free_models:
        free_requests = sum(stats[m]['count'] for m in free_models)
        print(f"2. Использование бесплатных моделей: {free_requests} запросов")
        print(f"   Доля: {(free_requests / total_requests * 100):.1f}%")
        print(f"   Рекомендация: ✅ Отлично! Продолжайте использовать бесплатные модели где возможно")
        print()
    
    # Проверяем кэширование
    print(f"3. Кэширование промптов:")
    print(f"   Текущая экономия: неизвестна (требуется анализ дубликатов)")
    print(f"   Рекомендация: Убедитесь, что Redis кэширование работает корректно")
    print()
    
    print("=" * 80)

if __name__ == "__main__":
    main()
