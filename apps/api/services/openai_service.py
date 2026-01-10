from ..settings import settings
from packages.ai_services.src.openai_service import OpenAIService

api_key = settings.openrouter_api_key or settings.openai_api_key
openai_service = OpenAIService(api_key=api_key)
