import json
import os
import logging
from enum import Enum
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class AIModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    DEEPSEEK = "deepseek"
    PERPLEXITY = "perplexity"

DEFAULT_CONFIG = {
    "main": {
        "referat": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "anthropic/claude-3.5-sonnet", "editor": "openai/gpt-4o-mini" },
        "kursach": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "anthropic/claude-3.5-sonnet", "editor": "openai/gpt-4o-mini" },
        "essay": { "structure": "openai/gpt-4o-mini", "suggest_details": "openai/gpt-4o-mini", "sources": "perplexity/sonar-pro", "generation": "anthropic/claude-3.5-sonnet", "editor": "openai/gpt-4o-mini" },
        "doklad": { "structure": "openai/gpt-4o-mini", "suggest_details": "openai/gpt-4o-mini", "sources": "perplexity/sonar-pro", "generation": "anthropic/claude-3.5-sonnet", "editor": "openai/gpt-4o-mini" },
        "article": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "anthropic/claude-3.5-sonnet", "editor": "openai/gpt-4o" },
        "composition": { "structure": "openai/gpt-4o-mini", "suggest_details": "openai/gpt-4o-mini", "sources": "perplexity/sonar-pro", "generation": "anthropic/claude-3.5-sonnet", "editor": "openai/gpt-4o-mini" },
        "other": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "anthropic/claude-3.5-sonnet", "editor": "openai/gpt-4o-mini" },
        "presentation": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "openai/gpt-4o-mini", "editor": "openai/gpt-4o-mini" },
        "task": { "task_solve": "deepseek/deepseek-r1" }
    },
    "fallback": {
        "text": { "structure": "mistralai/mistral-7b-instruct:free", "suggest_details": "mistralai/mistral-7b-instruct:free", "sources": "openai/gpt-4o-mini", "generation": "openai/gpt-4o-mini" },
        "presentation": { "structure": "mistralai/mistral-7b-instruct:free", "suggest_details": "mistralai/mistral-7b-instruct:free", "sources": "openai/gpt-4o-mini", "generation": "openai/gpt-4o-mini" },
        "task": { "task_solve": "deepseek/deepseek-chat" }
    }
}

class ModelRouter:
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self):
        if self.config_path and os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load model routing config: {e}")
        return DEFAULT_CONFIG

    def save_config(self, new_config: dict):
        if not self.config_path:
            logger.error("Cannot save config: no config_path set")
            return False
        try:
            with open(self.config_path, "w") as f:
                json.dump(new_config, f, indent=2)
            self.config = new_config
            return True
        except Exception as e:
            logger.error(f"Failed to save model routing config: {e}")
            return False

    def get_model_for_step(self, step_type: str, work_type: str = "other", is_fallback: bool = False) -> str:
        config_type = "fallback" if is_fallback else "main"
        
        # Mapping frontend work types to backend config categories if needed
        category = work_type
        if config_type == "fallback":
            if work_type in ["referat", "kursach", "essay", "doklad", "article", "composition", "other"]:
                category = "text"
        
        # Try to get specific model
        model = self.config.get(config_type, {}).get(category, {}).get(step_type)
        
        # Fallback to default category if specific work_type not found
        if not model and config_type == "main":
            model = self.config.get("main", {}).get("other", {}).get(step_type)
            
        # Last resort default
        if not model:
            if is_fallback:
                model = "google/gemini-2.0-flash-exp:free"
            else:
                model = "openai/gpt-4o-mini"
                
        return model

model_router = ModelRouter()

def get_model_for_step(step_type: str, work_type: str = "other", is_fallback: bool = False) -> str:
    """Wrapper function for getting model"""
    return model_router.get_model_for_step(step_type, work_type, is_fallback)
