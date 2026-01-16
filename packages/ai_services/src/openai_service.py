import httpx
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class OpenAIService:
    """
    Сервис для взаимодействия с OpenAI / OpenRouter API.
    Поддерживает текстовую генерацию и JSON-вывод.
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
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
        temperature: float = 0.7,
        is_fallback: bool = False,
        step_type: Optional[str] = None,
        work_type: str = "other",
        return_usage: bool = False
    ) -> Optional[str] | Optional[Tuple[str, Dict[str, Any]]]:
        """
        Отправляет запрос в Chat Completion API.
        С поддержкой автоматического переключения на резервные модели из конфига.
        
        Args:
            return_usage: Если True, возвращает tuple (content, usage_info)
                         где usage_info содержит tokens, cost_usd, model
        """
        if not self.api_key:
            logger.error("API_KEY is not set")
            return None

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature
        }

        # Perplexity не поддерживает response_format, отключаем JSON mode для них
        if json_mode and not model.startswith("perplexity/"):
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=120.0) as client: # Увеличен таймаут для тяжелых моделей
                response = await client.post(self.api_url, headers=self.headers, json=payload)
                
                # Проверяем на нехватку средств (402) или ошибки провайдера
                if response.status_code == 402 and not is_fallback and step_type:
                    from .model_router import model_router
                    fallback_model = model_router.get_model_for_step(step_type, work_type, is_fallback=True)
                    logger.warning(f"Insufficient credits for {model}. Switching to RESERVE model: {fallback_model}")
                    return await self.chat_completion(
                        model=fallback_model,
                        messages=messages,
                        json_mode=json_mode,
                        temperature=temperature,
                        is_fallback=True,
                        step_type=step_type,
                        work_type=work_type,
                        return_usage=return_usage
                    )

                response.raise_for_status()
                
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                # Логируем и возвращаем расход
                usage = data.get("usage", {})
                tokens = usage.get('total_tokens', 0)
                content_length = len(content) if content else 0
                
                # Примерная стоимость (в USD)
                # OpenRouter возвращает стоимость в usage, если нет - считаем примерно
                cost_usd = usage.get('cost', tokens * 0.00001)  # ~$0.01 за 1k токенов как fallback
                
                logger.info(f"OpenAI Usage [{model}]: {tokens} tokens, ${cost_usd:.6f}, response length: {content_length} chars")
                
                if return_usage:
                    usage_info = {
                        "tokens": tokens,
                        "cost_usd": cost_usd,
                        "model": model
                    }
                    return (content, usage_info)
                
                return content
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAI API error {e.response.status_code}: {e.response.text}")
            
            # Попытка переключиться на резерв при любой ошибке API (кроме 401/403)
            if e.response.status_code not in [401, 403] and not is_fallback and step_type:
                from .model_router import model_router
                fallback_model = model_router.get_model_for_step(step_type, work_type, is_fallback=True)
                logger.info(f"API Error. Attempting fallback to {fallback_model}")
                return await self.chat_completion(
                    model=fallback_model,
                    messages=messages,
                    json_mode=json_mode,
                    temperature=temperature,
                    is_fallback=True,
                    step_type=step_type,
                    work_type=work_type,
                    return_usage=return_usage
                )
            if return_usage:
                return (None, {"tokens": 0, "cost_usd": 0.0, "model": model})
            return None
        except Exception as e:
            logger.error(f"Unexpected error calling OpenAI: {str(e)}")
            if return_usage:
                return (None, {"tokens": 0, "cost_usd": 0.0, "model": model})
            return None
