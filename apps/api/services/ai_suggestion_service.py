import json
import logging
from uuid import UUID
from datetime import datetime
from typing import Dict, List, Optional

from packages.core_domain import Generation
from packages.core_domain.enums import GenerationStatus, GenerationModule
from ..services.openai_service import openai_service
from ..services.model_router import model_router
from ..services.prompt_service import prompt_service
from packages.ai_services.src.prompt_manager import prompt_manager

logger = logging.getLogger(__name__)

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

        try:
            raw_response = await openai_service.chat_completion(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                json_mode=True,
                step_type="sources",
                work_type=work_type or "other"
            )
            
            if not raw_response:
                raise ValueError("Failed to get response from AI")
                
            data = json.loads(raw_response)
            for source in data.get("sources", []):
                source["isAiSelected"] = True
            return data
        except Exception as e:
            logger.error(f"Error suggesting sources: {e}")
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
