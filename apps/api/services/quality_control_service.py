"""
Сервис Quality Control для проверки качества текста.
"""

import logging
from typing import Dict, Any
from .openai_service import openai_service
from .prompt_service import prompt_service

logger = logging.getLogger(__name__)


class QualityControlService:
    """Сервис для контроля качества сгенерированного текста."""
    
    async def check_quality(self, text: str) -> tuple[str, Dict[str, Any]]:
        """
        Проверяет и улучшает качество текста.
        
        Args:
            text: Текст для проверки
            
        Returns:
            tuple: (исправленный текст, usage_info)
        """
        logger.info("Applying Quality Control...")
        
        qc_prompt = prompt_service.construct_qc_prompt(text)
        
        result = await openai_service.chat_completion(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": qc_prompt}],
            return_usage=True
        )
        
        if result and isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], str) and result[0]:
            final_content, usage_info = result
            logger.info(f"QC applied, final length: {len(final_content)}")
            return final_content, usage_info
        
        logger.warning("QC failed, returning original text")
        return text, {}
    
    def check_volume(self, text: str, target_pages: int) -> Dict[str, Any]:
        """
        Проверяет объём текста.
        
        Args:
            text: Текст для проверки
            target_pages: Целевое количество страниц
            
        Returns:
            dict: Статистика объёма
        """
        target_words = target_pages * 280
        actual_words = len(text.split()) if text else 0
        actual_chars = len(text) if text else 0
        
        volume_ratio = (actual_words / target_words * 100) if target_words > 0 else 0
        
        result = {
            "target_pages": target_pages,
            "target_words": target_words,
            "actual_words": actual_words,
            "actual_chars": actual_chars,
            "volume_ratio": volume_ratio,
            "status": "ok" if volume_ratio >= 90 else "short"
        }
        
        if actual_words < target_words * 0.7:
            logger.warning(
                f"⚠️ Text significantly shorter than target! "
                f"Expected: {target_words} words, Got: {actual_words} words ({volume_ratio:.1f}%)"
            )
        elif actual_words < target_words * 0.9:
            logger.info(
                f"ℹ️ Text slightly shorter than target: "
                f"{actual_words}/{target_words} words ({volume_ratio:.1f}%)"
            )
        else:
            logger.info(
                f"✅ Text meets volume requirements: "
                f"{actual_words} words ({volume_ratio:.1f}% of target)"
            )
        
        return result


# Singleton instance
quality_control_service = QualityControlService()
