import os
from packages.ai_services.src.model_router import ModelRouter

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "model_routing.json")
model_router = ModelRouter(config_path=CONFIG_PATH)
