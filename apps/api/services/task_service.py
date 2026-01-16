"""
Сервис для решения задач.

Вынесенная бизнес-логика из task_worker.
"""

import logging
import json
from typing import Dict, Any
from packages.core_domain import Generation
from .openai_service import openai_service
from .prompt_service import prompt_service
from .model_router import model_router

logger = logging.getLogger(__name__)


class TaskService:
    """
    Сервис для решения учебных задач.
    
    Отвечает за:
    - Классификацию входных данных (задача vs чат)
    - Решение задач с разными режимами (quick/detailed)
    """
    
    async def classify_input(self, text: str) -> Dict[str, Any]:
        """
        Классифицирует входной текст: задача или чат.
        
        Args:
            text: Текст для классификации
            
        Returns:
            dict: {"type": "task" | "chat", "reason": "..."}
        """
        logger.info(f"Classifying input text (length: {len(text)})")
        
        classifier_prompt = prompt_service.construct_classifier_prompt(text)
        
        raw_class = await openai_service.chat_completion(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": classifier_prompt}],
            json_mode=True
        )
        
        classification = json.loads(raw_class or '{"type": "task"}')
        
        logger.info(f"Classification result: {classification.get('type')}")
        
        return classification
    
    async def solve_task(
        self,
        task_text: str,
        task_mode: str = "quick",
        work_type: str = "task"
    ) -> tuple[str, Dict[str, Any]]:
        """
        Решает учебную задачу.
        
        Args:
            task_text: Условие задачи
            task_mode: Режим решения ("quick" или "detailed")
            work_type: Тип работы
            
        Returns:
            tuple: (текст решения, usage_info)
        """
        logger.info(f"Solving task in {task_mode} mode")
        
        # Выбор модели
        model_name = model_router.get_model_for_step("task_solve", work_type)
        
        # Конструируем промпт с учётом режима
        mode_instruction = ""
        if task_mode == "quick":
            mode_instruction = "Выдай КРАТКОЕ, точное решение и финальный ответ. Без лишних вступлений."
        else:
            mode_instruction = "Выдай максимально подробный пошаговый разбор. Каждый шаг должен содержать формулы и логику. Не пиши общих лекций."
        
        prompt = f"""
Реши задачу из условия: {task_text}

ПРАВИЛА (АНТИ-ХАК):
- СТРОГО академический стиль.
- Для формул используй LaTeX.
- {mode_instruction}
- Если в условии нет задачи — вежливо откажи.
"""
        
        logger.info(f"Solving task using {model_name}...")
        
        result = await openai_service.chat_completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            step_type="task_solve",
            work_type=work_type,
            return_usage=True
        )
        
        if not result or not result[0]:
            raise ValueError("Failed to get solution from AI")
        
        result_text, usage_info = result
        
        logger.info(f"Task solved, solution length: {len(result_text)}")
        
        return result_text, usage_info


# Singleton instance
task_service = TaskService()
