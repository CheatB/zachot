import json
import logging
import re
from uuid import UUID
from datetime import datetime
from typing import Dict, List, Optional, Union, Any

from packages.core_domain import Generation
from packages.core_domain.enums import GenerationStatus, GenerationModule
from ..services.openai_service import openai_service
from ..services.model_router import model_router
from ..services.prompt_service import prompt_service
from ..services.url_validator_service import url_validator_service
from ..services.sources_qc_service import sources_qc_service
from packages.ai_services.src.prompt_manager import prompt_manager
from ..utils.humanity import convert_humanity_to_numeric
from ..types.ai_responses import (
    SuggestDetailsResponse,
    SuggestStructureResponse,
    SuggestSourcesResponse,
)

logger = logging.getLogger(__name__)

def extract_json_from_markdown(text: str) -> str:
    """
    Извлекает JSON из markdown блока ```json ... ```
    Если markdown блока нет, возвращает исходный текст.
    """
    # Ищем JSON в markdown блоке
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text.strip()

class AISuggestionService:
    @staticmethod
    async def suggest_structure(
        topic: str, 
        goal: str, 
        idea: str, 
        module: str, 
        work_type: str, 
        volume: int, 
        complexity: str, 
        humanity: Union[str, int, None], 
        user_id: UUID
    ) -> SuggestStructureResponse:
        """Предлагает структуру работы на основе темы, цели и идеи."""
        model_name = model_router.get_model_for_step("structure", work_type or "other")

        # Конвертируем humanity в числовое значение
        humanity_numeric = convert_humanity_to_numeric(humanity)

        dummy_gen = Generation(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=user_id,
            module=GenerationModule((module or "TEXT").upper()),
            status=GenerationStatus.DRAFT,
            work_type=work_type,
            complexity_level=complexity or "student",
            humanity_level=humanity_numeric,
            input_payload={"topic": topic or "", "goal": goal or "", "idea": idea or "", "volume": volume or 10},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        prompt = prompt_service.construct_structure_prompt(dummy_gen)

        try:
            raw_response = await openai_service.chat_completion(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                json_mode=True,
                step_type="structure",
                work_type=work_type or "other"
            )
            
            if not raw_response:
                raise ValueError("Failed to get response from AI")
                
            return json.loads(raw_response)
        except Exception as e:
            logger.error(f"Error suggesting structure: {e}")
            return {"structure": [
                {"title": "Введение", "level": 1},
                {"title": "Глава 1. Обзор предметной области", "level": 1},
                {"title": "Глава 2. Практическая часть", "level": 1},
                {"title": "Заключение", "level": 1},
                {"title": "Список литературы", "level": 1}
            ]}

    @staticmethod
    async def suggest_sources(
        topic: str, 
        goal: str, 
        idea: str, 
        module: str, 
        work_type: str, 
        complexity: str, 
        humanity: Union[str, int, None], 
        user_id: UUID
    ) -> SuggestSourcesResponse:
        """
        Предлагает источники литературы в два этапа:
        1. Сначала ищет академические источники
        2. Если не находит, ищет любые другие источники и помечает их как "не академические"
        """
        model_name = model_router.get_model_for_step("sources", work_type or "other")

        # Конвертируем humanity в числовое значение
        humanity_numeric = convert_humanity_to_numeric(humanity)

        dummy_gen = Generation(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=user_id,
            module=GenerationModule((module or "TEXT").upper()),
            status=GenerationStatus.DRAFT,
            work_type=work_type,
            complexity_level=complexity or "student",
            humanity_level=humanity_numeric,
            input_payload={"topic": topic or "", "goal": goal or "", "idea": idea or ""},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # ФАЗА 1: Поиск академических источников
        logger.info(f"[PHASE 1] Searching for ACADEMIC sources for topic: {topic}")
        academic_prompt = prompt_service.construct_sources_prompt(dummy_gen, is_academic=True)
        
        # Логируем промпт для отладки
        logger.info(f"Academic sources prompt (first 300 chars): {academic_prompt[:300]}")
        logger.info(f"Topic: {topic}, Work type: {work_type}, Model: {model_name}")
        
        # Для Perplexity добавляем явную инструкцию вернуть JSON (они не поддерживают response_format)
        if model_name.startswith("perplexity/"):
            academic_prompt += "\n\n⚠️ КРИТИЧЕСКИ ВАЖНО: Верни ответ СТРОГО в формате JSON. Начни с { и закончи }. Никакого текста до или после JSON."

        try:
            # ФАЗА 1: Попытка найти академические источники
            raw_response = await openai_service.chat_completion(
                model=model_name,
                messages=[{"role": "user", "content": academic_prompt}],
                json_mode=True,
                step_type="sources",
                work_type=work_type or "other"
            )
            
            if not raw_response:
                raise ValueError("Failed to get response from AI")
            
            # Логируем ответ для отладки
            logger.info(f"[PHASE 1] Raw AI response (first 500 chars): {raw_response[:500]}")
            
            # Извлекаем JSON из markdown блока (если есть)
            json_content = extract_json_from_markdown(raw_response)
            
            try:
                data = json.loads(json_content)
            except json.JSONDecodeError as e:
                logger.error(f"[PHASE 1] Failed to parse JSON from AI response: {e}")
                logger.error(f"Extracted JSON content: {json_content[:1000]}")
                data = {"sources": []}
                
            academic_sources = data.get("sources", [])
            
            logger.info(f"[PHASE 1] AI suggested {len(academic_sources)} academic sources")
            
            # Валидация академических источников
            validated_sources = []
            if academic_sources:
                validated_sources = await url_validator_service.validate_sources(academic_sources)
                
                # Фильтруем и сортируем по валидности
                validated_sources = url_validator_service.filter_valid_sources(
                    validated_sources,
                    min_valid=3,
                    prefer_trusted=True
                )
                
                valid_count = len(validated_sources)
                logger.info(f"[PHASE 1] {valid_count}/{len(academic_sources)} academic sources are valid")
            
            # Если нашли достаточно академических источников, возвращаем их
            if len(validated_sources) >= 3:
                logger.info(f"[PHASE 1] SUCCESS: Found {len(validated_sources)} valid academic sources")
                
                # Помечаем источники как академические
                for source in validated_sources:
                    source["isAiSelected"] = True
                    source["isAcademic"] = True
                    validation = source.get('validation', {})
                    source["isVerified"] = validation.get('is_valid', False)
                    source["isTrustedDomain"] = validation.get('is_trusted_domain', False)
                
                return {
                    "sources": validated_sources,
                    "is_academic": True,
                    "message": None
                }
            
            # ФАЗА 2: Поиск неакадемических источников
            logger.info(f"[PHASE 2] Not enough academic sources ({len(validated_sources)} found). Searching for NON-ACADEMIC sources...")
            
            non_academic_prompt = prompt_service.construct_sources_prompt(dummy_gen, is_academic=False)
            
            if model_name.startswith("perplexity/"):
                non_academic_prompt += "\n\n⚠️ КРИТИЧЕСКИ ВАЖНО: Верни ответ СТРОГО в формате JSON. Начни с { и закончи }. Никакого текста до или после JSON."
            
            non_academic_response = await openai_service.chat_completion(
                model=model_name,
                messages=[{"role": "user", "content": non_academic_prompt}],
                json_mode=True,
                step_type="sources",
                work_type=work_type or "other"
            )
            
            if not non_academic_response:
                logger.error("[PHASE 2] Failed to get response from AI")
                return {"sources": [], "error": "Не удалось найти источники по данной теме"}
            
            logger.info(f"[PHASE 2] Raw AI response (first 500 chars): {non_academic_response[:500]}")
            
            # Извлекаем JSON
            non_academic_json = extract_json_from_markdown(non_academic_response)
            
            try:
                non_academic_data = json.loads(non_academic_json)
            except json.JSONDecodeError as e:
                logger.error(f"[PHASE 2] Failed to parse JSON: {e}")
                logger.error(f"Extracted JSON content: {non_academic_json[:1000]}")
                return {"sources": [], "error": "Не удалось обработать ответ AI"}
            
            non_academic_sources = non_academic_data.get("sources", [])
            logger.info(f"[PHASE 2] AI suggested {len(non_academic_sources)} non-academic sources")
            
            if not non_academic_sources:
                logger.warning("[PHASE 2] No non-academic sources found")
                return {"sources": [], "error": "Не удалось найти источники по данной теме"}
            
            # Валидация неакадемических источников
            validated_non_academic = await url_validator_service.validate_sources(non_academic_sources)
            validated_non_academic = url_validator_service.filter_valid_sources(
                validated_non_academic,
                min_valid=3,
                prefer_trusted=False  # Для неакадемических не требуем trusted domains
            )
            
            logger.info(f"[PHASE 2] {len(validated_non_academic)}/{len(non_academic_sources)} non-academic sources are valid")
            
            if len(validated_non_academic) == 0:
                logger.error("[PHASE 2] No valid non-academic sources found")
                return {"sources": [], "error": "Не удалось найти доступные источники по данной теме"}
            
            # Помечаем источники как неакадемические
            for source in validated_non_academic:
                source["isAiSelected"] = True
                source["isAcademic"] = False
                validation = source.get('validation', {})
                source["isVerified"] = validation.get('is_valid', False)
                source["isTrustedDomain"] = False  # Неакадемические источники не считаются trusted
            
            logger.info(f"[PHASE 2] SUCCESS: Returning {len(validated_non_academic)} non-academic sources")
            
            return {
                "sources": validated_non_academic,
                "is_academic": False,
                "message": "Для данной темы найдены неакадемические источники. Академические источники не обнаружены."
            }
            
        except Exception as e:
            logger.error(f"Error suggesting sources: {e}", exc_info=True)
            return {"sources": [], "error": f"Ошибка при поиске источников: {str(e)}"}

    @staticmethod
    async def suggest_details(
        topic: str, 
        module: str, 
        complexity: str, 
        humanity: Union[str, int, None]
    ) -> SuggestDetailsResponse:
        """Предлагает цель и идею работы."""
        model_name = model_router.get_model_for_step("suggest_details")
        prompt_template = prompt_manager.get_prompt("suggest_details")
        
        # Конвертируем humanity в числовое значение
        humanity_numeric = convert_humanity_to_numeric(humanity)
        
        safe_module = (module or "TEXT").upper()
        dummy_gen = Generation(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=UUID("00000000-0000-0000-0000-000000000000"),
            module=GenerationModule(safe_module),
            status=GenerationStatus.DRAFT,
            complexity_level=complexity or "student",
            humanity_level=humanity_numeric,
            input_payload={"topic": topic or ""},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        ctx = prompt_service._get_context_vars(dummy_gen)
        prompt = prompt_service._safe_format(prompt_template, **ctx)

        try:
            raw_response = await openai_service.chat_completion(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                json_mode=True,
                step_type="suggest_details"
            )
            
            if not raw_response:
                raise ValueError("Failed to get response from AI")
                
            return json.loads(raw_response)
        except Exception as e:
            logger.error(f"Error suggesting details: {e}")
            return {"goal": "Исследовать основные аспекты темы", "idea": "Работа направлена на глубокий анализ выбранного направления."}

    @staticmethod
    async def suggest_title_info(university_short: str) -> Dict:
        """Дополняет информацию для титульного листа."""
        prompt_template = prompt_manager.get_prompt("suggest_title_info")
        prompt = prompt_service._safe_format(prompt_template, university_short=university_short or "")

        try:
            raw_response = await openai_service.chat_completion(
                model="openai/gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                json_mode=True
            )
            return json.loads(raw_response or '{"university_full": "' + (university_short or "") + '", "city": "Москва"}')
        except Exception as e:
            logger.error(f"Error suggesting title info: {e}")
            return {"university_full": university_short or "", "city": "Москва"}
    


ai_suggestion_service = AISuggestionService()
