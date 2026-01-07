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
        if step_type == "search":
            return {
                "provider": AIModelProvider.PERPLEXITY,
                "model": "sonar-pro",
                "cost_priority": "medium"
            }
        
        if step_type == "structure":
            return {
                "provider": AIModelProvider.OPENAI,
                "model": "gpt-4o-mini",
                "cost_priority": "low"
            }
            
        if step_type == "draft":
            return {
                "provider": AIModelProvider.DEEPSEEK,
                "model": "deepseek-v3",
                "cost_priority": "low"
            }
            
        if step_type == "refine":
            # Для высокого качества и Anti-AI используем Claude
            if complexity == "research":
                return {
                    "provider": AIModelProvider.ANTHROPIC,
                    "model": "claude-3-5-sonnet-latest",
                    "cost_priority": "high"
                }
            return {
                "provider": AIModelProvider.DEEPSEEK,
                "model": "deepseek-v3",
                "cost_priority": "medium"
            }
            
        return {
            "provider": AIModelProvider.OPENAI,
            "model": "gpt-4o-mini",
            "cost_priority": "low"
        }

model_router = ModelRouter()

