import json
import logging
import re
from uuid import UUID
from datetime import datetime
from typing import Dict, List, Optional

from packages.core_domain import Generation
from packages.core_domain.enums import GenerationStatus, GenerationModule
from ..services.openai_service import openai_service
from ..services.model_router import model_router
from ..services.prompt_service import prompt_service
from ..services.url_validator_service import url_validator_service
from packages.ai_services.src.prompt_manager import prompt_manager

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
    async def suggest_structure(topic: str, goal: str, idea: str, module: str, work_type: str, volume: int, complexity: str, humanity: str, user_id: UUID) -> Dict:
        """Предлагает структуру работы на основе темы, цели и идеи."""
        model_name = model_router.get_model_for_step("structure", work_type or "other")

        dummy_gen = Generation(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=user_id,
            module=GenerationModule((module or "TEXT").upper()),
            status=GenerationStatus.DRAFT,
            work_type=work_type,
            complexity_level=complexity or "student",
            humanity_level=humanity or "medium",
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
    async def suggest_sources(topic: str, goal: str, idea: str, module: str, work_type: str, complexity: str, humanity: str, user_id: UUID) -> Dict:
        """Предлагает источники литературы."""
        model_name = model_router.get_model_for_step("sources", work_type or "other")

        dummy_gen = Generation(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=user_id,
            module=GenerationModule((module or "TEXT").upper()),
            status=GenerationStatus.DRAFT,
            work_type=work_type,
            complexity_level=complexity or "student",
            humanity_level=humanity or "medium",
            input_payload={"topic": topic or "", "goal": goal or "", "idea": idea or ""},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        prompt = prompt_service.construct_sources_prompt(dummy_gen)
        
        # Логируем промпт для отладки
        logger.info(f"Sources prompt (first 300 chars): {prompt[:300]}")
        logger.info(f"Topic: {topic}, Work type: {work_type}, Model: {model_name}")
        
        # Для Perplexity добавляем явную инструкцию вернуть JSON (они не поддерживают response_format)
        if model_name.startswith("perplexity/"):
            prompt += "\n\n⚠️ КРИТИЧЕСКИ ВАЖНО: Верни ответ СТРОГО в формате JSON. Начни с { и закончи }. Никакого текста до или после JSON."

        try:
            # Первая попытка
            raw_response = await openai_service.chat_completion(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                json_mode=True,
                step_type="sources",
                work_type=work_type or "other"
            )
            
            if not raw_response:
                raise ValueError("Failed to get response from AI")
            
            # Логируем ответ для отладки
            logger.info(f"Raw AI response (first 500 chars): {raw_response[:500]}")
            
            # Извлекаем JSON из markdown блока (если есть)
            json_content = extract_json_from_markdown(raw_response)
            
            try:
                data = json.loads(json_content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from AI response: {e}")
                logger.error(f"Extracted JSON content: {json_content[:1000]}")
                raise ValueError(f"AI returned invalid JSON: {str(e)}")
                
            sources = data.get("sources", [])
            
            if not sources:
                logger.warning("AI returned no sources")
                return {"sources": []}
            
            logger.info(f"AI suggested {len(sources)} sources, starting validation...")
            
            # Валидация источников
            validated_sources = await url_validator_service.validate_sources(sources)
            
            # Фильтруем и сортируем по валидности (ТОЛЬКО валидные)
            filtered_sources = url_validator_service.filter_valid_sources(
                validated_sources,
                min_valid=5,
                prefer_trusted=True
            )
            
            valid_count = len(filtered_sources)
            trusted_count = sum(
                1 for s in filtered_sources 
                if s.get('validation', {}).get('is_trusted_domain', False)
            )
            
            logger.info(
                f"Validation complete: {valid_count}/{len(sources)} valid, "
                f"{trusted_count} from trusted domains"
            )
            
            # Если валидных источников мало, делаем повторный запрос
            if valid_count < 3:
                logger.warning(
                    f"Only {valid_count} valid sources from first attempt. "
                    f"Retrying with stricter prompt..."
                )
                
                retry_prompt = prompt + (
                    "\n\n⚠️ КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ: Предыдущая попытка вернула мало валидных источников! "
                    "ОБЯЗАТЕЛЬНО проверяй каждый URL перед возвратом. Используй ТОЛЬКО прямые ссылки на статьи, "
                    "НЕ поисковые страницы. Если не можешь найти рабочую ссылку - НЕ включай источник!"
                )
                
                try:
                    retry_response = await openai_service.chat_completion(
                        model=model_name,
                        messages=[{"role": "user", "content": retry_prompt}],
                        json_mode=True,
                        step_type="sources",
                        work_type=work_type or "other"
                    )
                    
                    if retry_response:
                        # Извлекаем JSON из markdown блока
                        retry_json = extract_json_from_markdown(retry_response)
                        try:
                            retry_data = json.loads(retry_json)
                        except json.JSONDecodeError as e:
                            logger.error(f"Retry: Failed to parse JSON: {e}")
                            logger.error(f"Retry extracted JSON: {retry_json[:1000]}")
                            retry_data = {"sources": []}
                        retry_sources = retry_data.get("sources", [])
                        
                        if retry_sources:
                            logger.info(f"Retry: AI suggested {len(retry_sources)} sources")
                            
                            # Валидация повторных источников
                            retry_validated = await url_validator_service.validate_sources(retry_sources)
                            retry_filtered = url_validator_service.filter_valid_sources(
                                retry_validated,
                                min_valid=5,
                                prefer_trusted=True
                            )
                            
                            # Объединяем с первой попыткой, убираем дубликаты по URL
                            existing_urls = {s.get('url') for s in filtered_sources if s.get('url')}
                            new_sources = [
                                s for s in retry_filtered 
                                if s.get('url') not in existing_urls
                            ]
                            
                            filtered_sources.extend(new_sources)
                            valid_count = len(filtered_sources)
                            
                            logger.info(
                                f"After retry: {valid_count} total valid sources "
                                f"({len(new_sources)} new from retry)"
                            )
                except Exception as retry_error:
                    logger.error(f"Retry failed: {retry_error}", exc_info=True)
            
            # Помечаем источники
            for source in filtered_sources:
                source["isAiSelected"] = True
                validation = source.get('validation', {})
                source["isVerified"] = validation.get('is_valid', False)
                source["isTrustedDomain"] = validation.get('is_trusted_domain', False)
            
            if valid_count == 0:
                logger.error("No valid sources found even after retry!")
                return {"sources": [], "error": "Не удалось найти валидные источники. Попробуйте изменить тему или сформулировать её более конкретно."}
            
            logger.info(f"Returning {valid_count} valid sources to user")
            return {"sources": filtered_sources}
            
        except Exception as e:
            logger.error(f"Error suggesting sources: {e}", exc_info=True)
            return {"sources": []}

    @staticmethod
    async def suggest_details(topic: str, module: str, complexity: str, humanity: str) -> Dict:
        """Предлагает цель и идею работы."""
        model_name = model_router.get_model_for_step("suggest_details")
        prompt_template = prompt_manager.get_prompt("suggest_details")
        
        safe_module = (module or "TEXT").upper()
        dummy_gen = Generation(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=UUID("00000000-0000-0000-0000-000000000000"),
            module=GenerationModule(safe_module),
            status=GenerationStatus.DRAFT,
            complexity_level=complexity or "student",
            humanity_level=humanity or "medium",
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





ai_suggestion_service = AISuggestionService()

ai_suggestion_service = AISuggestionService()





ai_suggestion_service = AISuggestionService()

ai_suggestion_service = AISuggestionService()





ai_suggestion_service = AISuggestionService()

ai_suggestion_service = AISuggestionService()





ai_suggestion_service = AISuggestionService()
