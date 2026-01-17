import logging
from typing import List, Dict, Any, Optional
from packages.core_domain import Generation
from packages.ai_services.src.prompt_manager import prompt_manager
from packages.billing.credits import get_work_type_label
from ..constants.humanity import HUMANITY_LABELS, get_humanity_prompt_key

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
        
        # Используем новую систему с константами
        humanity_level_int = int(generation.humanity_level) if generation.humanity_level else 50
        
        # Получаем метку из констант
        if humanity_level_int < 12.5:
            humanity_label = HUMANITY_LABELS[0]
        elif humanity_level_int < 37.5:
            humanity_label = HUMANITY_LABELS[25]
        elif humanity_level_int < 62.5:
            humanity_label = HUMANITY_LABELS[50]
        elif humanity_level_int < 87.5:
            humanity_label = HUMANITY_LABELS[75]
        else:
            humanity_label = HUMANITY_LABELS[100]
            
        # Расчёт объёма: конвертируем страницы в слова и символы
        # 1 страница A4 (Times New Roman 14pt, интервал 1.5) ≈ 280 слов ≈ 1800 символов
        volume = generation.input_payload.get('volume', 10)
        volume_words = volume * 280  # Минимальное количество слов
        volume_chars = volume * 1800  # Минимальное количество символов
        
        volume_pages = f"{volume} страниц"
        volume_words_str = f"{volume_words} слов"
        volume_chars_str = f"{volume_chars} символов"

        return {
            "module": module_label,
            "work_type": work_type_label,
            "topic": generation.input_payload.get('topic') or "",
            "goal": generation.input_payload.get('goal') or "",
            "idea": generation.input_payload.get('idea') or "",
            "volume": volume_pages,  # Для обратной совместимости
            "volume_pages": volume_pages,
            "volume_words": volume_words_str,
            "volume_chars": volume_chars_str,
            "volume_words_min": volume_words,  # Числовое значение для проверок
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
    def construct_sources_prompt(generation: Generation, is_academic: bool = True) -> str:
        """
        Промпт для подбора источников литературы.
        
        Args:
            generation: Объект генерации
            is_academic: True для поиска академических источников, False для неакадемических
        """
        ctx = PromptService._get_context_vars(generation)
        prompt_key = "sources_academic" if is_academic else "sources_non_academic"
        prompt_template = prompt_manager.get_prompt(prompt_key)
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
    def construct_content_prompt(generation: Generation, section_title: str, previous_context: str = "", 
                                  sources: List[Dict[str, Any]] = None, target_words: int = None) -> str:
        """Промпт для генерации контента ОДНОГО раздела (поглавная генерация)."""
        ctx = PromptService._get_context_vars(generation)
        
        # Источники для цитирования
        sources_context = ""
        if sources:
            sources_list = "\n".join([f"- {s.get('title')}: {s.get('description')} (URL: {s.get('url')})" for s in sources[:5]])  # Топ-5 источников
            sources_context = f"\n\nИСПОЛЬЗУЙ СЛЕДУЮЩИЕ ИСТОЧНИКИ:\n{sources_list}"
        
        # Контекст предыдущей главы для связности
        previous_context_instruction = ""
        if previous_context:
            previous_context_instruction = f"\n\nПРЕДЫДУЩАЯ ГЛАВА (для связности):\n...{previous_context}"
        
        # Целевой объём для этого раздела
        target_words_instruction = ""
        if target_words:
            target_words_instruction = f"\n\n⚠️ ЦЕЛЕВОЙ ОБЪЁМ ЭТОГО РАЗДЕЛА: МИНИМУМ {target_words} слов. Пиши подробно, развёрнуто, с примерами и пояснениями."
        
        prompt_template = prompt_manager.get_prompt("content")
        
        return PromptService._safe_format(
            prompt_template,
            section_title=section_title,
            layout_instruction=sources_context + target_words_instruction,
            previous_context_instruction=previous_context_instruction,
            **ctx
        ).strip()

    @staticmethod
    def construct_formatting_prompt(text: str) -> str:
        """Промпт для ИИ-корректуры (орфография и грамматика)."""
        prompt_template = prompt_manager.get_prompt("formatting")
        return PromptService._safe_format(
            prompt_template,
            text=text
        ).strip()

    @staticmethod
    def construct_humanize_prompt(text: str, humanity_level: int) -> str:
        """Промпт для финального очеловечивания текста с поддержкой 5 уровней."""
        h_level = int(humanity_level) if humanity_level else 50
        
        # Используем функцию из констант для получения ключа промпта
        prompt_key = get_humanity_prompt_key(h_level)
        
        prompt_template = prompt_manager.get_prompt(prompt_key)
        return PromptService._safe_format(
            prompt_template,
            text=text
        ).strip()

    @staticmethod
    def construct_qc_prompt(text: str) -> str:
        """Промпт для слоя контроля качества (Quality Control)."""
        prompt_template = prompt_manager.get_prompt("qc")
        return PromptService._safe_format(prompt_template, text=text).strip()

prompt_service = PromptService()
