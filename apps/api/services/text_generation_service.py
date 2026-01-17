"""
Сервис для генерации текстового контента.

Вынесенная бизнес-логика из text_structure worker.
"""

import logging
from typing import List, Dict, Any, Optional
from packages.core_domain import Generation
from .openai_service import openai_service
from .prompt_service import prompt_service
from .model_router import model_router

logger = logging.getLogger(__name__)


class TextGenerationService:
    """
    Сервис для генерации текстового контента.
    
    Отвечает за:
    - Генерацию структуры работы
    - Подбор источников
    - Генерацию контента по главам
    - Quality Control
    """
    
    async def generate_structure(
        self,
        generation: Generation
    ) -> List[Dict[str, Any]]:
        """
        Генерирует структуру (план) работы.
        
        Args:
            generation: Объект генерации с темой и параметрами
            
        Returns:
            List[Dict]: Список разделов структуры
        """
        model_name = model_router.get_model_for_step("structure", generation.work_type)
        prompt = prompt_service.construct_structure_prompt(generation)
        
        logger.info(f"Generating structure using {model_name}")
        
        result = await openai_service.chat_completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            json_mode=True,
            step_type="structure",
            work_type=generation.work_type,
            return_usage=True
        )
        
        if not result or not isinstance(result, tuple) or len(result) != 2 or not isinstance(result[0], str) or not result[0]:
            raise ValueError("Failed to get response from OpenAI for structure")
        
        raw_response, usage_info = result
        
        import json
        structure_data = json.loads(raw_response)
        structure = structure_data.get("structure", [])
        
        logger.info(f"Structure generated with {len(structure)} sections")
        
        return structure, usage_info
    
    async def generate_sources(
        self,
        generation: Generation
    ) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Подбирает источники для работы.
        
        Args:
            generation: Объект генерации с темой
            
        Returns:
            tuple: (список источников, usage_info)
        """
        sources_model = model_router.get_model_for_step("sources", generation.work_type)
        sources_prompt = prompt_service.construct_sources_prompt(generation)
        
        logger.info("Selecting sources...")
        
        result = await openai_service.chat_completion(
            model=sources_model,
            messages=[{"role": "user", "content": sources_prompt}],
            json_mode=True,
            step_type="sources",
            work_type=generation.work_type,
            return_usage=True
        )
        
        if not result or not isinstance(result, tuple) or len(result) != 2 or not isinstance(result[0], str) or not result[0]:
            return [], {}
        
        raw_sources, usage_info = result
        
        import json
        sources_data = json.loads(raw_sources)
        sources = sources_data.get("sources", [])
        
        logger.info(f"{len(sources)} sources found")
        
        return sources, usage_info
    
    async def generate_content_by_chapters(
        self,
        generation: Generation,
        structure: List[Dict[str, Any]],
        sources: List[Dict[str, Any]]
    ) -> tuple[str, List[Dict[str, Any]]]:
        """
        Генерирует контент по главам.
        
        Args:
            generation: Объект генерации
            structure: Структура работы
            sources: Список источников
            
        Returns:
            tuple: (полный текст, список usage_info)
        """
        gen_model = model_router.get_model_for_step("generation", generation.work_type)
        
        target_volume = generation.input_payload.get('volume', 10)
        target_words = target_volume * 280
        words_per_section = target_words // len(structure) if len(structure) > 0 else target_words
        
        logger.info(f"Generating {len(structure)} sections separately...")
        logger.info(f"Target: {target_words} words total ({target_volume} pages)")
        
        full_text_parts = []
        previous_context = ""
        usage_metadata = []
        
        for section_idx, section in enumerate(structure):
            section_title = section.get('title', f'Раздел {section_idx + 1}')
            section_level = section.get('level', 1)
            
            logger.info(f"Generating section {section_idx + 1}/{len(structure)}: '{section_title}'")
            
            content_prompt = prompt_service.construct_content_prompt(
                generation,
                section_title=section_title,
                previous_context=previous_context,
                sources=sources,
                target_words=words_per_section
            )
            
            result = await openai_service.chat_completion(
                model=gen_model,
                messages=[{"role": "user", "content": content_prompt}],
                json_mode=False,
                step_type="content",
                work_type=generation.work_type,
                return_usage=True
            )
            
            # Проверяем, что result - это tuple и первый элемент - это строка (не None)
            if result and isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], str) and result[0]:
                section_text, usage_info = result
                usage_metadata.append({"stage": "generation", **usage_info})
                
                section_words = len(section_text.split())
                logger.info(f"Section {section_idx + 1} generated: {section_words} words")
                
                # Форматируем заголовок
                if section_level == 1:
                    formatted_section = f"\n\n{section_title}\n\n{section_text}"
                else:
                    formatted_section = f"\n\n{section_title}\n{section_text}"
                
                full_text_parts.append(formatted_section)
                
                # Сохраняем контекст для следующей главы
                previous_context = section_text[-500:] if len(section_text) > 500 else section_text
            else:
                logger.warning(f"Section {section_idx + 1} generation failed, skipping")
        
        full_text = "\n".join(full_text_parts)
        logger.info(f"All sections combined: {len(full_text.split())} words total")
        
        return full_text, usage_metadata
    
    async def apply_quality_control(
        self,
        text: str
    ) -> tuple[str, Dict[str, Any]]:
        """
        Применяет Quality Control к тексту.
        
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


# Singleton instance
text_generation_service = TextGenerationService()
