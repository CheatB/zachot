import logging
from typing import List, Dict, Any
from packages.core_domain import Generation

logger = logging.getLogger(__name__)

class PromptService:
    @staticmethod
    def construct_structure_prompt(generation: Generation) -> str:
        """Промпт для генерации структуры плана."""
        complexity_guide = {
            "school": "простым языком, доступным для школьников, без сложной терминологии",
            "student": "академическим языком, соответствующим вузовским требованиям, с анализом теорий",
            "research": "высокоуровневым научным языком, с фокусом на методологию и критический анализ"
        }
        
        style = complexity_guide.get(generation.complexity_level, complexity_guide["student"])
        
        prompt = f"""
        Ты — экспертный академический методист. Сформулируй подробный план для работы типа {generation.work_type}.
        Тема: {generation.input_payload.get('topic')}
        Цель: {generation.input_payload.get('goal')}
        Основная идея: {generation.input_payload.get('idea')}
        Объем: {generation.input_payload.get('volume')} страниц.
        
        Тон изложения должен быть {style}.
        План должен быть логичным, последовательным и включать:
        1. Введение
        2. Основную часть (разделенную на главы и параграфы)
        3. Заключение
        4. Список литературы
        
        Верни результат в формате JSON: {{"structure": [{{"title": "...", "level": 1}}]}}
        """
        return prompt.strip()

    @staticmethod
    def construct_sources_prompt(generation: Generation) -> str:
        """Промпт для подбора источников литературы."""
        prompt = f"""
        Ты — библиограф в крупной научной библиотеке. Подбери список актуальных источников для следующей работы:
        Тип: {generation.work_type}
        Тема: {generation.input_payload.get('topic')}
        
        ТРЕБОВАНИЯ:
        1. Минимум 5-7 источников.
        2. Источники должны быть реальными (научные статьи, книги, учебники).
        3. Оформи по стандарту ГОСТ Р 7.0.100–2018.
        4. Для каждого источника напиши краткое описание (1-2 предложения), почему он важен для этой темы.
        
        Верни результат в формате JSON: {{"sources": [{{"title": "...", "url": "...", "description": "..."}}]}}
        """
        return prompt.strip()

    @staticmethod
    def construct_generation_prompt(generation: Generation, section_title: str, previous_context: str = "") -> str:
        """Промпт для генерации текста конкретного раздела."""
        prompt = f"""
        Напиши текст для раздела "{section_title}" в рамках работы на тему "{generation.input_payload.get('topic')}".
        
        КОНТЕКСТ ВСЕЙ РАБОТЫ:
        Цель: {generation.input_payload.get('goal')}
        Основная идея: {generation.input_payload.get('idea')}
        Сложность: {generation.complexity_level}
        
        ПРЕДЫДУЩЕЕ СОДЕРЖАНИЕ (для связности):
        {previous_context}
        
        ТРЕБОВАНИЯ К ТЕКСТУ:
        - Глубокий анализ темы, использование терминологии.
        - Логичный переход от предыдущих мыслей.
        - Отсутствие воды, четкие аргументы.
        - Использование академического стиля.
        
        Объем раздела должен быть адекватным для работы в {generation.input_payload.get('volume')} страниц.
        """
        return prompt.strip()

    @staticmethod
    def construct_humanize_prompt(text: str, humanity_level: int) -> str:
        """Промпт для финального очеловечивания текста (Claude 3.5 Sonnet style)."""
        if humanity_level < 20:
            return text # Почти не меняем
            
        instructions = ""
        if humanity_level > 70:
            instructions = """
            - Максимально разнообразь синтаксис: смешивай очень длинные и очень короткие предложения.
            - Используй вводные слова, характерные для живой академической речи (например, 'собственно', 'между тем', 'как нам кажется').
            - Удали типичные ИИ-маркеры: 'Важно отметить', 'В заключение стоит сказать', 'Это играет ключевую роль'.
            - Добавь легкие стилистические неровности, чтобы текст не выглядел 'вылизанным' нейросетью.
            """
        else:
            instructions = """
            - Сделай текст более естественным, убери монотонность.
            - Используй синонимы, чтобы избежать повторов.
            - Соблюдай правила русского языка, но избегай канцелярщины.
            """

        prompt = f"""
        Перепиши следующий академический текст, чтобы он выглядел так, будто его написал человек, а не ИИ.
        
        ТЕКСТ ДЛЯ ОБРАБОТКИ:
        ---
        {text}
        ---
        
        ИНСТРУКЦИИ:
        {instructions}
        
        ВАЖНО: Сохрани все факты, цифры и научную суть. Изменяй ТОЛЬКО стиль и структуру предложений.
        """
        return prompt.strip()

prompt_service = PromptService()




