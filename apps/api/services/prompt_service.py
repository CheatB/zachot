import logging
from typing import List, Dict, Any
from packages.core_domain import Generation
from packages.ai_services.src.prompt_manager import prompt_manager

logger = logging.getLogger(__name__)

class PromptService:
    @staticmethod
    def construct_classifier_prompt(input_text: str) -> str:
        """Промпт для классификации запроса (задача vs болтовня)."""
        prompt_template = prompt_manager.get_prompt("classifier")
        return prompt_template.format(input_text=input_text).strip()

    @staticmethod
    def construct_structure_prompt(generation: Generation) -> str:
        """Промпт для генерации структуры плана."""
        complexity_guide = {
            "school": "простым языком, доступным для школьников, без сложной терминологии",
            "student": "академическим языком, соответствующим вузовским требованиям, с анализом теорий",
            "research": "высокоуровневым научным языком, с фокусом на методологию и критический анализ"
        }
        
        style = complexity_guide.get(generation.complexity_level, complexity_guide["student"])
        prompt_template = prompt_manager.get_prompt("structure")
        
        return prompt_template.format(
            work_type=generation.work_type,
            topic=generation.input_payload.get('topic'),
            goal=generation.input_payload.get('goal'),
            idea=generation.input_payload.get('idea'),
            volume=generation.input_payload.get('volume'),
            style=style
        ).strip()

    @staticmethod
    def construct_sources_prompt(generation: Generation) -> str:
        """Промпт для подбора источников литературы."""
        prompt_template = prompt_manager.get_prompt("sources")
        return prompt_template.format(
            work_type=generation.work_type,
            topic=generation.input_payload.get('topic')
        ).strip()

    @staticmethod
    def construct_generation_prompt(generation: Generation, section_title: str, previous_context: str = "") -> str:
        """Промпт для генерации контента раздела (с поддержкой макетов и иконок)."""
        is_presentation = generation.module.value == "PRESENTATION"
        
        layout_instruction = ""
        if is_presentation:
            layout_instruction = """
            ДЛЯ ПРЕЗЕНТАЦИИ:
            - Выбери подходящий макет (layout) для этого слайда: "bullets" (список), "grid" (сетка 2х2), "timeline" (шаги), "big_quote" (цитата).
            - Для каждого пункта списка предложи релевантную иконку (название из библиотеки Lucide, например: "trending-up", "users", "shield").
            - Укажи визуальную тему (основной цвет и акцент).
            - Предложи 1 детальный промпт для генерации фоновой иллюстрации или обложки, если этот слайд является ключевым.
            """

        previous_context_instruction = f"ПРЕДЫДУЩЕЕ СОДЕРЖАНИЕ: {previous_context}" if previous_context else ""
        
        prompt_template = prompt_manager.get_prompt("generation")
        
        return prompt_template.format(
            section_title=section_title,
            topic=generation.input_payload.get('topic'),
            goal=generation.input_payload.get('goal'),
            idea=generation.input_payload.get('idea'),
            layout_instruction=layout_instruction,
            previous_context_instruction=previous_context_instruction
        ).strip()

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

        prompt_template = prompt_manager.get_prompt("humanize")
        return prompt_template.format(
            text=text,
            instructions=instructions
        ).strip()

    @staticmethod
    def construct_qc_prompt(text: str) -> str:
        """Промпт для слоя контроля качества (Quality Control)."""
        prompt_template = prompt_manager.get_prompt("qc")
        return prompt_template.format(text=text).strip()

prompt_service = PromptService()
