from enum import Enum
from typing import Optional

class AIModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    DEEPSEEK = "deepseek"
    PERPLEXITY = "perplexity"

class ModelRouter:
    """
    Определяет, какую модель использовать для каждого этапа генерации
    с учетом экономики и требуемого качества.
    """
    
    @staticmethod
    def get_model_for_step(step_type: str, complexity: str = "student") -> dict:
        if step_type == "sources":
            # Для серьезных работ используем Deep Research, для остальных обычный Pro
            if complexity == "research":
                return {
                    "provider": "openrouter",
                    "model": "perplexity/sonar-deep-research",
                    "cost_priority": "high"
                }
            return {
                "provider": "openrouter",
                "model": "perplexity/sonar-pro",
                "cost_priority": "low"
            }
        
        if step_type == "structure":
            return {
                "provider": "openrouter",
                "model": "openai/o1-mini",
                "cost_priority": "medium"
            }

        if step_type == "suggest_details":
            return {
                "provider": "openrouter",
                "model": "openai/gpt-4o-mini",
                "cost_priority": "low"
            }
            
        if step_type == "draft":
            # Для высокого качества используем старшие модели
            if complexity == "research":
                return {
                    "provider": "openrouter",
                    "model": "openai/gpt-4o",
                    "cost_priority": "high"
                }
            return {
                "provider": "openrouter",
                "model": "openai/gpt-4o-mini",
                "cost_priority": "low"
            }
            
        if step_type == "refine":
            return {
                "provider": "openrouter",
                "model": "anthropic/claude-3.5-sonnet",
                "cost_priority": "medium"
            }

        if step_type == "task_solve":
            # Умный каскад для задач: DeepSeek R1 по дефолту, o3 для сложных
            if complexity == "research":
                return {
                    "provider": "openrouter",
                    "model": "openai/o3",
                    "cost_priority": "high"
                }
            return {
                "provider": "openrouter",
                "model": "deepseek/deepseek-r1",
                "cost_priority": "medium"
            }
            
        return {
            "provider": "openrouter",
            "model": "openai/gpt-4o-mini",
            "cost_priority": "low"
        }

model_router = ModelRouter()

