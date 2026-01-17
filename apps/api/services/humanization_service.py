"""
Сервис для очеловечивания текста (Anti-AI).
"""

import logging
from typing import Dict, Any
from .openai_service import openai_service
from .prompt_service import prompt_service

logger = logging.getLogger(__name__)


class HumanizationService:
    """
    Сервис для очеловечивания текста.
    
    Применяет различные уровни "очеловечивания" для удаления AI-маркеров.
    """
    
    async def humanize_text(
        self,
        text: str,
        humanity_level: int
    ) -> tuple[str, Dict[str, Any]]:
        """
        Очеловечивает текст согласно уровню.
        
        Args:
            text: Текст для обработки
            humanity_level: Уровень очеловечивания (0, 25, 50, 75, 100)
            
        Returns:
            tuple: (очеловеченный текст, usage_info)
        """
        logger.info(f"Humanizing text with level: {humanity_level}")
        
        # Конструируем промпт для очеловечивания
        humanize_prompt = prompt_service.construct_humanize_prompt(text, humanity_level)
        
        result = await openai_service.chat_completion(
            model="anthropic/claude-3.5-sonnet",  # Claude лучше для humanization
            messages=[{"role": "user", "content": humanize_prompt}],
            step_type="humanize",
            return_usage=True
        )
        
        if not result or not isinstance(result, tuple) or len(result) != 2 or not isinstance(result[0], str) or not result[0]:
            logger.warning("Humanization failed, returning original text")
            return text, {}
        
        humanized_text, usage_info = result
        
        logger.info(f"Text humanized, length: {len(humanized_text)}")
        
        return humanized_text, usage_info


# Singleton instance
humanization_service = HumanizationService()
