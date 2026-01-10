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

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "model_routing.json")

DEFAULT_CONFIG = {
    "main": {
        "referat": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "openai/gpt-4o", "refine": "anthropic/claude-3.5-sonnet" },
        "kursach": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "openai/gpt-4o", "refine": "anthropic/claude-3.5-sonnet" },
        "essay": { "structure": "openai/gpt-4o-mini", "suggest_details": "openai/gpt-4o-mini", "sources": "openai/gpt-4o-mini", "generation": "openai/gpt-4o-mini", "refine": "anthropic/claude-3.5-sonnet" },
        "doklad": { "structure": "openai/gpt-4o-mini", "suggest_details": "openai/gpt-4o-mini", "sources": "openai/gpt-4o-mini", "generation": "openai/gpt-4o-mini", "refine": "openai/gpt-4o-mini" },
        "article": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-deep-research", "generation": "openai/gpt-4o", "refine": "anthropic/claude-3.5-sonnet" },
        "composition": { "structure": "openai/gpt-4o-mini", "suggest_details": "openai/gpt-4o-mini", "sources": "openai/gpt-4o-mini", "generation": "openai/gpt-4o-mini", "refine": "anthropic/claude-3.5-sonnet" },
        "other": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "openai/gpt-4o", "refine": "anthropic/claude-3.5-sonnet" },
        "presentation": { "structure": "openai/gpt-4o", "suggest_details": "openai/gpt-4o", "sources": "perplexity/sonar-pro", "generation": "openai/gpt-4o-mini", "refine": "anthropic/claude-3.5-sonnet" },
        "task": { "task_solve": "deepseek/deepseek-r1" }
    },
    "fallback": {
        "text": { "structure": "mistralai/mistral-7b-instruct:free", "suggest_details": "mistralai/mistral-7b-instruct:free", "sources": "openai/gpt-4o-mini", "generation": "openai/gpt-4o-mini", "refine": "mistralai/mistral-7b-instruct:free" },
        "presentation": { "structure": "mistralai/mistral-7b-instruct:free", "suggest_details": "mistralai/mistral-7b-instruct:free", "sources": "openai/gpt-4o-mini", "generation": "openai/gpt-4o-mini", "refine": "mistralai/mistral-7b-instruct:free" },
        "task": { "task_solve": "deepseek/deepseek-chat" }
    }
}

class ModelRouter:
    def __init__(self):
        self.config = self._load_config()

    def _load_config(self):
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load model routing config: {e}")
        return DEFAULT_CONFIG

    def save_config(self, new_config: dict):
        try:
            with open(CONFIG_PATH, "w") as f:
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
