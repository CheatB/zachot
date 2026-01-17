#!/usr/bin/env python3
"""
Эмуляция генерации с ПРИМЕРНЫМИ оценками токенов и стоимости.
Не делает реальных API вызовов - использует статистические данные.
"""

import sys
sys.path.insert(0, '/home/deploy/zachot')

from datetime import datetime
from apps.api.services.model_router import model_router
import json
import os

# Тарифы OpenRouter (USD за 1M токенов)
RATES = {
    'openai/gpt-4o': {'input': 2.50, 'output': 10.00},
    'openai/gpt-4o-mini': {'input': 0.15, 'output': 0.60},
    'anthropic/claude-3.5-sonnet': {'input': 3.00, 'output': 15.00},
    'perplexity/sonar-pro': {'input': 3.00, 'output': 15.00},
    'mistralai/mistral-7b-instruct:free': {'input': 0.00, 'output': 0.00},
}

USD_TO_RUB = 95.0

# Примерные оценки токенов для каждого этапа (на основе логов)
ESTIMATED_TOKENS = {
    'structure': 500,  # Генерация структуры
    'sources': 1800,   # Подбор источников (Perplexity)
    'generation_per_section': 9000,  # Генерация одного раздела (Claude)
    'qc': 800,  # Quality Control
}

class GenerationSimulator:
    def __init__(self):
        self.total_cost_usd = 0.0
        self.total_tokens = 0
        self.steps_log = []
    
    def log_step(self, step_name: str, model: str, tokens: int, cost_usd: float, note: str = ""):
        """Логирует шаг генерации."""
        self.total_tokens += tokens
        self.total_cost_usd += cost_usd
        self.steps_log.append({
            'step': step_name,
            'model': model,
            'tokens': tokens,
            'cost_usd': cost_usd,
            'cost_rub': cost_usd * USD_TO_RUB,
            'note': note
        })
        print(f"  ✓ {step_name}")
        print(f"    Модель: {model}")
        print(f"    Токены: {tokens:,}")
        print(f"    Стоимость: ${cost_usd:.4f} USD ({cost_usd * USD_TO_RUB:.2f} ₽)")
        if note:
            print(f"    📝 {note}")
        print()
    
    def estimate_cost(self, model: str, tokens: int) -> float:
        """Оценивает стоимость на основе модели и токенов."""
        rate = RATES.get(model, {'input': 1.0, 'output': 5.0})
        
        # Примерное соотношение: 60% input, 40% output
        input_tokens = tokens * 0.6
        output_tokens = tokens * 0.4
        
        cost = (input_tokens / 1_000_000 * rate['input']) + \
               (output_tokens / 1_000_000 * rate['output'])
        
        return cost
    
    def simulate_full_generation(
        self, 
        work_type: str, 
        topic: str, 
        volume: int = 10, 
        humanity_level: int = 50,
        apply_qc: bool = True
    ):
        """
        Эмулирует полную генерацию с примерными оценками.
        """
        print("=" * 80)
        print(f"🧪 ЭМУЛЯЦИЯ ГЕНЕРАЦИИ (ПРИМЕРНЫЕ ОЦЕНКИ)")
        print("=" * 80)
        print(f"Тип работы: {work_type}")
        print(f"Тема: {topic}")
        print(f"Объём: {volume} страниц (~{volume * 280} слов)")
        print(f"Уровень человечности: {humanity_level}")
        print(f"Quality Control: {'Да' if apply_qc else 'Нет'}")
        print()
        
        try:
            # ============================================================
            # STEP 1: Генерация структуры
            # ============================================================
            print("📋 STEP 1: Генерация структуры")
            print("-" * 80)
            structure_model = model_router.get_model_for_step("structure", work_type)
            print(f"Используется модель: {structure_model}")
            
            tokens = ESTIMATED_TOKENS['structure']
            cost = self.estimate_cost(structure_model, tokens)
            
            # Примерное количество разделов (зависит от объёма)
            sections_count = max(3, min(10, volume // 3))
            
            self.log_step("Step 1: Генерация структуры", structure_model, tokens, cost,
                         note=f"Создано {sections_count} разделов")
            
            # ============================================================
            # STEP 2: Подбор источников
            # ============================================================
            print("📚 STEP 2: Подбор источников")
            print("-" * 80)
            sources_model = model_router.get_model_for_step("sources", work_type)
            print(f"Используется модель: {sources_model}")
            
            tokens = ESTIMATED_TOKENS['sources']
            cost = self.estimate_cost(sources_model, tokens)
            
            sources_count = max(5, min(15, volume // 2))
            
            self.log_step("Step 2: Подбор источников", sources_model, tokens, cost,
                         note=f"Найдено {sources_count} источников")
            
            # ============================================================
            # STEP 3: Генерация контента по главам (САМЫЙ ДОРОГОЙ!)
            # ============================================================
            print("✍️ STEP 3: Генерация контента по главам")
            print("-" * 80)
            generation_model = model_router.get_model_for_step("generation", work_type)
            print(f"Используется модель: {generation_model}")
            print(f"Количество разделов: {sections_count}")
            print(f"✅ Claude генерирует текст СРАЗУ в нужном стиле (humanity_level={humanity_level})")
            print()
            
            # Токены зависят от количества разделов
            total_content_tokens = sections_count * ESTIMATED_TOKENS['generation_per_section']
            total_content_cost = self.estimate_cost(generation_model, total_content_tokens)
            
            self.log_step(
                "Step 3: Генерация контента", 
                generation_model, 
                total_content_tokens, 
                total_content_cost,
                note=f"Генерация {sections_count} разделов с humanity_level={humanity_level}"
            )
            
            # ============================================================
            # STEP 4: Quality Control (ОПЦИОНАЛЬНО)
            # ============================================================
            if apply_qc:
                print("🔍 STEP 4: Quality Control")
                print("-" * 80)
                qc_model = "openai/gpt-4o-mini"
                print(f"Используется модель: {qc_model}")
                
                qc_tokens = ESTIMATED_TOKENS['qc']
                qc_cost = self.estimate_cost(qc_model, qc_tokens)
                
                self.log_step("Step 4: Quality Control", qc_model, qc_tokens, qc_cost)
            else:
                print("⏭️  STEP 4: Quality Control пропущен (apply_qc=False)")
                print()
            
            # ============================================================
            # ИТОГОВАЯ СТАТИСТИКА
            # ============================================================
            print("=" * 80)
            print("💰 ИТОГОВАЯ СТАТИСТИКА")
            print("=" * 80)
            print()
            
            print("📊 По этапам:")
            for i, step in enumerate(self.steps_log, 1):
                print(f"{i}. {step['step']}")
                print(f"   Модель: {step['model']}")
                print(f"   Токены: {step['tokens']:,}")
                print(f"   Стоимость: ${step['cost_usd']:.4f} USD ({step['cost_rub']:.2f} ₽)")
                if step['note']:
                    print(f"   📝 {step['note']}")
                print()
            
            print("=" * 80)
            print(f"Всего токенов: {self.total_tokens:,}")
            print(f"Общая стоимость: ${self.total_cost_usd:.4f} USD ({self.total_cost_usd * USD_TO_RUB:.2f} ₽)")
            print()
            
            # Экстраполяция
            print("🎯 Экстраполяция:")
            print(f"  10 генераций: ${self.total_cost_usd * 10:.2f} USD ({self.total_cost_usd * USD_TO_RUB * 10:.2f} ₽)")
            print(f"  100 генераций: ${self.total_cost_usd * 100:.2f} USD ({self.total_cost_usd * USD_TO_RUB * 100:.2f} ₽)")
            print(f"  1000 генераций: ${self.total_cost_usd * 1000:.2f} USD ({self.total_cost_usd * USD_TO_RUB * 1000:.2f} ₽)")
            print()
            
            # Сохраняем результат
            result = {
                'work_type': work_type,
                'topic': topic,
                'volume': volume,
                'humanity_level': humanity_level,
                'apply_qc': apply_qc,
                'timestamp': datetime.utcnow().isoformat(),
                'steps': self.steps_log,
                'total_tokens': self.total_tokens,
                'total_cost_usd': self.total_cost_usd,
                'total_cost_rub': self.total_cost_usd * USD_TO_RUB,
                'note': 'Примерные оценки на основе статистики. БЕЗ дублирования Claude.'
            }
            
            output_file = f'/home/deploy/zachot/logs/simulation_estimated_{work_type}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json'
            os.makedirs('/home/deploy/zachot/logs', exist_ok=True)
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            print(f"📁 Результат сохранён: {output_file}")
            print("=" * 80)
            
            return result
            
        except Exception as e:
            print(f"❌ Ошибка при эмуляции: {e}")
            import traceback
            traceback.print_exc()
            return None

def main():
    """Запускает несколько эмуляций для разных типов работ."""
    
    test_cases = [
        {
            'work_type': 'referat',
            'topic': 'Искусственный интеллект в современном мире',
            'volume': 10,
            'humanity_level': 50,
            'apply_qc': True
        },
        {
            'work_type': 'kursach',
            'topic': 'Анализ эффективности маркетинговых стратегий',
            'volume': 30,
            'humanity_level': 75,
            'apply_qc': True
        },
        {
            'work_type': 'essay',
            'topic': 'Влияние социальных сетей на общество',
            'volume': 5,
            'humanity_level': 100,
            'apply_qc': False
        }
    ]
    
    print("🚀 Запуск эмуляций генераций (ПРИМЕРНЫЕ ОЦЕНКИ)")
    print("=" * 80)
    print(f"Количество тестов: {len(test_cases)}")
    print(f"✅ Этап 'очеловечивания' УДАЛЁН из процесса!")
    print(f"   Claude генерирует текст сразу в нужном стиле на Step 3.")
    print(f"⚠️  Используются примерные оценки токенов (не реальные API вызовы)")
    print()
    
    all_results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'=' * 80}")
        print(f"ТЕСТ {i}/{len(test_cases)}")
        print(f"{'=' * 80}\n")
        
        simulator = GenerationSimulator()
        result = simulator.simulate_full_generation(**test_case)
        
        if result:
            all_results.append(result)
        
        print("\n" + "=" * 80)
        print(f"Завершён тест {i}/{len(test_cases)}")
        print("=" * 80 + "\n")
    
    # Общая статистика
    if all_results:
        print("\n" + "=" * 80)
        print("📊 ОБЩАЯ СТАТИСТИКА ПО ВСЕМ ТЕСТАМ")
        print("=" * 80)
        print()
        
        total_cost = sum(r['total_cost_usd'] for r in all_results)
        total_tokens = sum(r['total_tokens'] for r in all_results)
        avg_cost = total_cost / len(all_results)
        
        print(f"Проведено тестов: {len(all_results)}")
        print(f"Общая стоимость: ${total_cost:.4f} USD ({total_cost * USD_TO_RUB:.2f} ₽)")
        print(f"Средняя стоимость: ${avg_cost:.4f} USD ({avg_cost * USD_TO_RUB:.2f} ₽)")
        print(f"Всего токенов: {total_tokens:,}")
        print()
        
        print("По типам работ:")
        for result in all_results:
            print(f"  {result['work_type']} ({result['volume']} стр., humanity={result['humanity_level']}): "
                  f"${result['total_cost_usd']:.4f} USD ({result['total_cost_rub']:.2f} ₽)")
        
        print()
        print("✅ ОПТИМИЗИРОВАННАЯ СИСТЕМА:")
        print("   - Step 1: Структура (GPT-4o/mini)")
        print("   - Step 2: Источники (Perplexity Sonar Pro)")
        print("   - Step 3: Генерация (Claude 3.5 Sonnet) + humanity_level в промпте")
        print("   - Step 4: QC (GPT-4o-mini) - опционально")
        print("   - ❌ Этап 'очеловечивания' УДАЛЁН (экономия 30-50%!)")
        print()
        print("💡 ПРИМЕЧАНИЕ:")
        print("   Это примерные оценки на основе статистики из логов.")
        print("   Реальная стоимость может отличаться на ±20%.")
        print()
        print("=" * 80)

if __name__ == "__main__":
    main()
