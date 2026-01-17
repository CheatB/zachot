#!/usr/bin/env python3
"""
Анализ экономики генераций: подсчёт токенов и стоимости.
"""

import sys
sys.path.insert(0, '/home/deploy/zachot')
import os
os.environ['DATABASE_URL'] = 'sqlite:////home/deploy/zachot/production.db'

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from packages.database.src.models import Generation, create_db_engine
import json

# Тарифы OpenRouter (примерные, в USD за 1M токенов)
OPENROUTER_RATES = {
    'gpt-4o': {'input': 2.50, 'output': 10.00},
    'gpt-4o-mini': {'input': 0.15, 'output': 0.60},
    'claude-3.5-sonnet': {'input': 3.00, 'output': 15.00},
    'perplexity/llama-3.1-sonar-large-128k-online': {'input': 1.00, 'output': 1.00},
}

# Курс доллара (примерный)
USD_TO_RUB = 95.0

def analyze_generation(gen):
    """Анализирует одну генерацию."""
    
    result = {
        'id': str(gen.id),
        'work_type': gen.work_type or 'N/A',
        'status': gen.status,
        'created_at': str(gen.created_at),
        'tokens': {},
        'cost_usd': 0.0,
        'cost_rub': 0.0
    }
    
    # Ищем usage_info
    usage_info = None
    
    # Проверяем result_content
    if gen.result_content:
        try:
            content = json.loads(gen.result_content) if isinstance(gen.result_content, str) else gen.result_content
            if isinstance(content, dict):
                if 'usage_info' in content:
                    usage_info = content['usage_info']
                elif 'usage' in content:
                    usage_info = content['usage']
        except:
            pass
    
    # Проверяем settings_payload
    if not usage_info and gen.settings_payload:
        try:
            settings = json.loads(gen.settings_payload) if isinstance(gen.settings_payload, str) else gen.settings_payload
            if isinstance(settings, dict):
                if 'usage_info' in settings:
                    usage_info = settings['usage_info']
                elif 'usage' in settings:
                    usage_info = settings['usage']
        except:
            pass
    
    # Проверяем input_payload
    if not usage_info and gen.input_payload:
        try:
            input_data = json.loads(gen.input_payload) if isinstance(gen.input_payload, str) else gen.input_payload
            if isinstance(input_data, dict) and 'usage_info' in input_data:
                usage_info = input_data['usage_info']
        except:
            pass
    
    if usage_info:
        result['tokens'] = usage_info
        
        # Подсчитываем стоимость
        total_cost_usd = 0.0
        
        if isinstance(usage_info, dict):
            # Если есть разбивка по моделям
            for model, tokens in usage_info.items():
                if isinstance(tokens, dict) and 'prompt_tokens' in tokens:
                    input_tokens = tokens.get('prompt_tokens', 0)
                    output_tokens = tokens.get('completion_tokens', 0)
                    
                    # Ищем тариф для модели
                    rate = None
                    for rate_model, rate_info in OPENROUTER_RATES.items():
                        if rate_model in model.lower():
                            rate = rate_info
                            break
                    
                    if rate:
                        cost = (input_tokens / 1_000_000 * rate['input']) + \
                               (output_tokens / 1_000_000 * rate['output'])
                        total_cost_usd += cost
            
            # Если не нашли разбивку по моделям, но есть общие токены
            if total_cost_usd == 0 and 'prompt_tokens' in usage_info:
                input_tokens = usage_info.get('prompt_tokens', 0)
                output_tokens = usage_info.get('completion_tokens', 0)
                # Используем средний тариф (gpt-4o-mini)
                rate = OPENROUTER_RATES['gpt-4o-mini']
                total_cost_usd = (input_tokens / 1_000_000 * rate['input']) + \
                                (output_tokens / 1_000_000 * rate['output'])
        
        result['cost_usd'] = total_cost_usd
        result['cost_rub'] = total_cost_usd * USD_TO_RUB
    
    return result

def main():
    print("=" * 80)
    print("💰 Анализ экономики генераций")
    print("=" * 80)
    print()
    
    engine = create_db_engine('sqlite:////home/deploy/zachot/production.db')
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Ищем завершённые генерации
    completed_gens = session.query(Generation).filter(
        Generation.status.in_(['GENERATED', 'EXPORTED', 'COMPLETED'])
    ).order_by(Generation.created_at.desc()).limit(20).all()
    
    print(f"📊 Найдено завершённых генераций: {len(completed_gens)}")
    print()
    
    results = []
    total_cost_usd = 0.0
    total_cost_rub = 0.0
    generations_with_data = 0
    
    for i, gen in enumerate(completed_gens[:10], 1):
        result = analyze_generation(gen)
        results.append(result)
        
        print(f"{i}. 📝 {result['work_type']}")
        print(f"   ID: {result['id'][:8]}...")
        print(f"   Дата: {result['created_at']}")
        
        if result['tokens']:
            generations_with_data += 1
            print(f"   Токены: {json.dumps(result['tokens'], indent=6, ensure_ascii=False)}")
            print(f"   💵 Стоимость: ${result['cost_usd']:.4f} USD ({result['cost_rub']:.2f} ₽)")
            total_cost_usd += result['cost_usd']
            total_cost_rub += result['cost_rub']
        else:
            print(f"   ⚠️  Нет данных о токенах")
        
        print()
    
    # Итоговая статистика
    print("=" * 80)
    print("📈 ИТОГОВАЯ СТАТИСТИКА")
    print("=" * 80)
    print(f"Всего проанализировано: {len(results)} генераций")
    print(f"С данными о токенах: {generations_with_data} генераций")
    print()
    
    if generations_with_data > 0:
        print(f"💰 Общая стоимость:")
        print(f"   ${total_cost_usd:.4f} USD")
        print(f"   {total_cost_rub:.2f} ₽")
        print()
        print(f"📊 Средняя стоимость на генерацию:")
        print(f"   ${total_cost_usd / generations_with_data:.4f} USD")
        print(f"   {total_cost_rub / generations_with_data:.2f} ₽")
        print()
        print(f"💡 Экстраполяция на 1000 генераций:")
        print(f"   ${(total_cost_usd / generations_with_data) * 1000:.2f} USD")
        print(f"   {(total_cost_rub / generations_with_data) * 1000:.2f} ₽")
    else:
        print("⚠️  Нет данных о токенах для расчёта стоимости")
    
    print()
    print("=" * 80)
    
    session.close()

if __name__ == "__main__":
    main()
