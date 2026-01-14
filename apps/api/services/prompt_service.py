import logging
from typing import List, Dict, Any, Optional
from packages.core_domain import Generation
from packages.ai_services.src.prompt_manager import prompt_manager
from packages.billing.credits import get_work_type_label

logger = logging.getLogger(__name__)

class PromptService:
    @staticmethod
    def _safe_format(template: str, **kwargs) -> str:
        """Безопасное форматирование строки с заменой плейсхолдеров."""
        result = template
        for key, value in kwargs.items():
            placeholder = "{" + key + "}"
            # Конвертируем значение в строку и заменяем плейсхолдер
            result = result.replace(placeholder, str(value))
        return result

    @staticmethod
    def _get_context_vars(generation: Generation) -> Dict[str, Any]:
        """Вспомогательный метод для получения всех переменных контекста."""
        module_label = "Текстовая работа" if generation.module.value == "TEXT" else "Презентация"
        
        work_type_raw = generation.work_type or "other"
        work_type_label = get_work_type_label(work_type_raw)
        
        complexity_guide = {
            "school": "Школьный (простым языком, без сложной терминологии)",
            "student": "Студенческий (академический язык, анализ теорий)",
            "research": "Научный (высокий уровень, методология, критический анализ)"
        }
        complexity_label = complexity_guide.get(generation.complexity_level, complexity_guide["student"])
        
        # New 3-level humanity system
        humanity_level = str(generation.humanity_level).lower()
        if humanity_level in ['none', '0']:
            humanity_label = "Отключено (строгий ИИ-стиль)"
        elif humanity_level in ['high', '100']:
            humanity_label = "Anti-AI режим (максимальная имитация живого автора)"
        else: # 'medium', '50'
            humanity_label = "Базовое (удаление канцеляризмов, естественный ритм)"
            
        volume = generation.input_payload.get('volume', 10)
        volume_label = f"{volume} страниц"

        return {
            "module": module_label,
            "work_type": work_type_label,
            "topic": generation.input_payload.get('topic') or "",
            "goal": generation.input_payload.get('goal') or "",
            "idea": generation.input_payload.get('idea') or "",
            "volume": volume_label,
            "complexity": complexity_label,
            "humanity": humanity_label,
            "style": complexity_label # For backward compatibility
        }

    @staticmethod
    def construct_classifier_prompt(input_text: str) -> str:
        """Промпт для классификации запроса (задача vs болтовня)."""
        prompt_template = prompt_manager.get_prompt("classifier")
        return PromptService._safe_format(prompt_template, input_text=input_text).strip()

    @staticmethod
    def construct_structure_prompt(generation: Generation) -> str:
        """Промпт для генерации структуры плана."""
        ctx = PromptService._get_context_vars(generation)
        prompt_template = prompt_manager.get_prompt("structure")
        return PromptService._safe_format(prompt_template, **ctx).strip()

    @staticmethod
    def construct_sources_prompt(generation: Generation) -> str:
        """Промпт для подбора источников литературы."""
        ctx = PromptService._get_context_vars(generation)
        prompt_template = prompt_manager.get_prompt("sources")
        return PromptService._safe_format(prompt_template, **ctx).strip()

    @staticmethod
    def construct_generation_prompt(generation: Generation, section_title: str, previous_context: str = "", sources: List[Dict[str, Any]] = None) -> str:
        """Промпт для генерации контента раздела."""
        is_presentation = generation.module.value == "PRESENTATION"
        ctx = PromptService._get_context_vars(generation)
        
        layout_instruction = ""
        if is_presentation:
            layout_instruction = """
            ДЛЯ ПРЕЗЕНТАЦИИ:
            - Выбери подходящий макет (layout) для этого слайда: "bullets" (список), "grid" (сетка 2х2), "timeline" (шаги), "big_quote" (цитата).
            - Для каждого пункта списка предложи релевантную иконку (название из библиотеки Lucide).
            - Укажи визуальную тему.
            - Предложи 1 промпт для генерации картинки.
            """

        sources_context = ""
        if sources:
            sources_list = "\n".join([f"- {s.get('title')}: {s.get('description')} (URL: {s.get('url')})" for s in sources])
            sources_context = f"ИСПОЛЬЗУЙ СЛЕДУЮЩИЕ ИСТОЧНИКИ ДЛЯ ЦИТИРОВАНИЯ И АНАЛИЗА:\n{sources_list}"

        final_instructions = f"{layout_instruction}\n{sources_context}".strip()
        previous_context_instruction = f"ПРЕДЫДУЩЕЕ СОДЕРЖАНИЕ: {previous_context}" if previous_context else ""
        
        prompt_key = "generation" if is_presentation else "content"
        prompt_template = prompt_manager.get_prompt(prompt_key)
        
        return PromptService._safe_format(
            prompt_template,
            section_title=section_title,
            layout_instruction=final_instructions,
            previous_context_instruction=previous_context_instruction,
            **ctx
        ).strip()

    @staticmethod
    def construct_formatting_prompt(text: str, formatting: Dict[str, Any]) -> str:
        """Промпт для технического оформления по ГОСТ."""
        prompt_template = prompt_manager.get_prompt("formatting")
        return PromptService._safe_format(
            prompt_template,
            fontFamily=formatting.get("fontFamily", "Times New Roman"),
            fontSize=formatting.get("fontSize", 14),
            lineSpacing=formatting.get("lineSpacing", 1.5),
            margins=formatting.get("margins", "стандартные (20мм)"),
            text=text
        ).strip()

    @staticmethod
    def construct_humanize_prompt(text: str, humanity_level: str) -> str:
        """Промпт для финального очеловечивания текста."""
        h_level = str(humanity_level).lower()
        if h_level in ['none', '0']:
            return text
            
        instructions = ""
        if h_level in ['high', '100']:
            instructions = """
            - Максимально разнообразь синтаксис: смешивай очень длинные и очень короткие предложения.
            - Используй живые академические обороты.
            - Удали типичные ИИ-маркеры.
            - Добавь легкие стилистические неровности.
            """
        else:
            instructions = """
            - Сделай текст более естественным, убери монотонность.
            - Используй синонимы.
            - Соблюдай правила русского языка, но избегай канцелярщины.
            """

        prompt_template = prompt_manager.get_prompt("humanize")
        return PromptService._safe_format(
            prompt_template,
            text=text,
            instructions=instructions
        ).strip()

    @staticmethod
    def construct_qc_prompt(text: str) -> str:
        """Промпт для слоя контроля качества (Quality Control)."""
        prompt_template = prompt_manager.get_prompt("qc")
        return PromptService._safe_format(prompt_template, text=text).strip()

prompt_service = PromptService()
