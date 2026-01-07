import httpx
import logging
from typing import List, Dict, Any, Optional
from ..settings import settings

logger = logging.getLogger(__name__)

class OpenAIService:
    """
    Сервис для взаимодействия с OpenAI / OpenRouter API.
    Поддерживает текстовую генерацию и JSON-вывод.
    """
    
    def __init__(self):
        self.api_key = settings.openrouter_api_key or settings.openai_api_key
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://app.zachet.tech",
            "X-Title": "Zachet AI"
        }

    async def chat_completion(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        json_mode: bool = False,
        temperature: float = 0.7
    ) -> Optional[str]:
        """
        Отправляет запрос в Chat Completion API.
        """
        if not self.api_key:
            logger.error("OPENAI_API_KEY is not set in settings")
            return None

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.api_url, headers=self.headers, json=payload)
                response.raise_for_status()
                
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                # Логируем расход (для будущей аналитики)
                usage = data.get("usage", {})
                logger.info(f"OpenAI Usage [{model}]: {usage.get('total_tokens')} tokens")
                
                return content
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAI API error {e.response.status_code}: {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error calling OpenAI: {str(e)}")
            return None

openai_service = OpenAIService()

