"""
Сервис контроля качества источников (QC).

Проверяет релевантность подобранных источников теме работы с помощью AI.
Включает защиту от всех потенциальных рисков.
"""

import logging
import asyncio
import json
from typing import List, Dict, Optional
from datetime import datetime

from apps.api.services.openai_service import openai_service
from apps.api.services.prompt_service import prompt_service

logger = logging.getLogger(__name__)


class SourcesQCService:
    """
    Безопасный сервис для контроля качества источников.
    
    Защита от рисков:
    - Timeout на каждую операцию
    - Graceful degradation при ошибках
    - Мягкие пороги оценки (не отклоняем слишком агрессивно)
    - Логирование всех решений для мониторинга
    """
    
    # Константы безопасности
    QC_TIMEOUT = 30  # секунд на QC валидацию
    MIN_RELEVANCE_SCORE = 4  # из 10 (мягкий порог)
    MIN_ACCEPTABLE_SOURCES = 3  # минимум источников для "accept"
    
    @staticmethod
    async def validate_sources_relevance(
        sources: List[Dict],
        topic: str,
        goal: str,
        idea: str,
        work_type: str = "other"
    ) -> Dict:
        """
        Проверяет релевантность источников теме с помощью AI.
        
        Args:
            sources: Список источников для проверки
            topic: Тема работы
            goal: Цель работы
            idea: Основная идея
            work_type: Тип работы
            
        Returns:
            {
                "validated_sources": [...],  # Источники с QC оценками
                "relevant_count": 3,          # Количество релевантных
                "overall_quality": "good",    # Общая оценка
                "should_retry": False,        # Нужна ли повторная попытка
                "qc_failed": False,           # Упал ли QC (для мониторинга)
                "reason": "..."               # Причина решения
            }
        """
        start_time = datetime.now()
        
        # Защита: пустой список источников
        if not sources:
            logger.warning("[QC] No sources to validate, recommending retry")
            return {
                "validated_sources": [],
                "relevant_count": 0,
                "overall_quality": "poor",
                "should_retry": True,
                "qc_failed": False,
                "reason": "No sources provided by Perplexity"
            }
        
        # Защита: слишком мало источников (< 2)
        if len(sources) < 2:
            logger.warning(f"[QC] Only {len(sources)} source(s), accepting without QC")
            # Принимаем как есть, не тратим токены на QC
            return {
                "validated_sources": sources,
                "relevant_count": len(sources),
                "overall_quality": "unknown",
                "should_retry": True,  # Рекомендуем retry
                "qc_failed": False,
                "reason": "Too few sources to validate, recommending retry"
            }
        
        try:
            # Формируем список источников для промпта (максимум 10)
            sources_to_check = sources[:10]
            sources_list = "\n\n".join([
                f"Источник {i+1}:\n"
                f"Название: {s.get('title', 'N/A')}\n"
                f"URL: {s.get('url', 'N/A')}\n"
                f"Описание: {s.get('description', 'N/A')[:200]}"
                for i, s in enumerate(sources_to_check)
            ])
            
            # Получаем промпт
            prompt_template = prompt_service.get_prompt("sources_qc")
            prompt = prompt_template.format(
                topic=topic,
                goal=goal,
                idea=idea,
                sources_list=sources_list
            )
            
            logger.info(f"[QC] Starting validation of {len(sources_to_check)} sources")
            
            # Используем быструю и дешёвую модель для QC
            model_name = "openai/gpt-4o-mini"
            
            # Защита: timeout на QC валидацию
            try:
                async with asyncio.timeout(SourcesQCService.QC_TIMEOUT):
                    response = await openai_service.chat_completion(
                        model=model_name,
                        messages=[{"role": "user", "content": prompt}],
                        json_mode=True,
                        step_type="sources_qc",
                        work_type=work_type,
                        temperature=0.3  # Низкая температура для более консистентных оценок
                    )
            except asyncio.TimeoutError:
                logger.error(f"[QC] Timeout after {SourcesQCService.QC_TIMEOUT}s, accepting sources as-is")
                return {
                    "validated_sources": sources,
                    "relevant_count": len(sources),
                    "overall_quality": "unknown",
                    "should_retry": False,  # Не retry при timeout
                    "qc_failed": True,
                    "reason": "QC validation timeout"
                }
            
            # Защита: пустой ответ от AI
            if not response:
                logger.warning("[QC] Empty response from AI, accepting sources as-is")
                return {
                    "validated_sources": sources,
                    "relevant_count": len(sources),
                    "overall_quality": "unknown",
                    "should_retry": False,
                    "qc_failed": True,
                    "reason": "Empty QC response"
                }
            
            # Парсим JSON ответ
            try:
                qc_result = json.loads(response)
            except json.JSONDecodeError as e:
                logger.error(f"[QC] Failed to parse JSON: {e}, accepting sources as-is")
                return {
                    "validated_sources": sources,
                    "relevant_count": len(sources),
                    "overall_quality": "unknown",
                    "should_retry": False,
                    "qc_failed": True,
                    "reason": f"QC JSON parse error: {str(e)}"
                }
            
            # Извлекаем оценки
            validated = qc_result.get("sources", [])
            overall_quality = qc_result.get("overall_quality", "unknown")
            recommendation = qc_result.get("recommendation", "accept")
            summary = qc_result.get("summary", "")
            
            # Обогащаем исходные источники QC оценками
            for i, source in enumerate(sources_to_check):
                if i < len(validated):
                    qc_data = validated[i]
                    source["qc_validation"] = {
                        "relevance_score": qc_data.get("relevance_score", 5),
                        "academic_score": qc_data.get("academic_score", 5),
                        "freshness_score": qc_data.get("freshness_score", 5),
                        "is_relevant": qc_data.get("is_relevant", True),
                        "reason": qc_data.get("reason", "")
                    }
                else:
                    # Если AI не оценил этот источник, ставим нейтральные оценки
                    source["qc_validation"] = {
                        "relevance_score": 5,
                        "academic_score": 5,
                        "freshness_score": 5,
                        "is_relevant": True,
                        "reason": "Not evaluated by QC"
                    }
            
            # Подсчитываем релевантные источники (мягкий порог: >= 4/10)
            relevant_count = sum(
                1 for s in sources_to_check
                if s.get("qc_validation", {}).get("relevance_score", 0) >= SourcesQCService.MIN_RELEVANCE_SCORE
            )
            
            # Решаем, нужна ли повторная попытка
            # Retry только если:
            # 1. Явная рекомендация "retry" от AI
            # 2. ИЛИ меньше MIN_ACCEPTABLE_SOURCES релевантных источников
            should_retry = (
                recommendation == "retry" or
                relevant_count < SourcesQCService.MIN_ACCEPTABLE_SOURCES
            )
            
            # НО: если AI нашёл много источников (>= 5), но они нерелевантны,
            # retry может не помочь - не тратим токены
            if len(sources) >= 5 and relevant_count < SourcesQCService.MIN_ACCEPTABLE_SOURCES:
                logger.warning(
                    f"[QC] Many sources ({len(sources)}) but low relevance ({relevant_count}), "
                    "retry unlikely to help"
                )
                should_retry = False
            
            elapsed = (datetime.now() - start_time).total_seconds()
            
            logger.info(
                f"[QC] Validation complete in {elapsed:.2f}s: "
                f"{relevant_count}/{len(sources_to_check)} relevant, "
                f"quality: {overall_quality}, "
                f"recommendation: {recommendation}, "
                f"should_retry: {should_retry}"
            )
            
            return {
                "validated_sources": sources,  # Возвращаем ВСЕ источники (включая не проверенные)
                "relevant_count": relevant_count,
                "overall_quality": overall_quality,
                "should_retry": should_retry,
                "qc_failed": False,
                "reason": summary or f"QC: {relevant_count} relevant sources, {recommendation}"
            }
            
        except Exception as e:
            # Защита: любая неожиданная ошибка
            logger.error(f"[QC] Unexpected error: {e}", exc_info=True)
            # Graceful degradation: принимаем источники как есть
            return {
                "validated_sources": sources,
                "relevant_count": len(sources),
                "overall_quality": "unknown",
                "should_retry": False,  # Не retry при ошибке
                "qc_failed": True,
                "reason": f"QC error: {str(e)}"
            }
    
    @staticmethod
    def filter_relevant_sources(sources: List[Dict]) -> List[Dict]:
        """
        Фильтрует источники, оставляя только релевантные.
        
        Args:
            sources: Список источников с QC оценками
            
        Returns:
            Отфильтрованный список источников
        """
        relevant = []
        
        for source in sources:
            qc = source.get("qc_validation", {})
            relevance_score = qc.get("relevance_score", 10)  # По умолчанию считаем релевантным
            
            # Мягкий порог: >= 4/10
            if relevance_score >= SourcesQCService.MIN_RELEVANCE_SCORE:
                relevant.append(source)
            else:
                logger.debug(
                    f"[QC] Filtering out source with low relevance: "
                    f"{source.get('url', 'N/A')} (score: {relevance_score})"
                )
        
        return relevant


# Singleton instance
sources_qc_service = SourcesQCService()
