"""
Text Editor Service
Сервис для AI-редактирования текста
"""

import httpx
import os
from typing import Dict, Any, Literal

from packages.ai_services.src.prompt_manager import prompt_manager
from packages.ai_services.src.model_router import get_model_for_step


class TextEditorService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
    
    async def edit_text(
        self,
        text: str,
        action: Literal['rewrite', 'shorter', 'longer'],
        context: str = "",
        work_type: str = "other"
    ) -> Dict[str, Any]:
        """
        Редактирование текста с помощью AI
        """
        # Получить промпт для действия
        prompt_key = f"editor_{action}"
        prompt_template = prompt_manager.get_prompt(prompt_key)
        
        if not prompt_template:
            raise ValueError(f"Prompt not found: {prompt_key}")
        
        # Форматировать промпт
        user_prompt = prompt_template.get("user_template", "").format(
            text=text,
            context=context[:500] if context else ""  # Ограничить контекст
        )
        
        system_prompt = prompt_template.get("system", "")
        
        # Получить модель для редактирования
        model = get_model_for_step("editor", work_type)
        
        # Вызвать OpenRouter API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenRouter API error: {response.text}")
            
            data = response.json()
            edited_text = data["choices"][0]["message"]["content"]
            
            return {
                "edited_text": edited_text.strip(),
                "tokens_used": data.get("usage", {}).get("total_tokens", 0),
                "model_used": model
            }
    
    async def generate_content(
        self,
        content_type: Literal['chart', 'table', 'custom'],
        instruction: str = None,
        context: str = "",
        work_type: str = "other"
    ) -> Dict[str, Any]:
        """
        Генерация дополнительного контента
        """
        # Получить промпт для типа контента
        if content_type == 'custom':
            prompt_key = "editor_custom"
            user_instruction = instruction or "Создай дополнительный контент"
        else:
            prompt_key = f"editor_generate_{content_type}"
            user_instruction = ""
        
        prompt_template = prompt_manager.get_prompt(prompt_key)
        
        if not prompt_template:
            raise ValueError(f"Prompt not found: {prompt_key}")
        
        # Форматировать промпт
        user_prompt = prompt_template.get("user_template", "").format(
            context=context[:1000] if context else "",
            instruction=user_instruction
        )
        
        system_prompt = prompt_template.get("system", "")
        
        # Получить модель
        model = get_model_for_step("editor", work_type)
        
        # Вызвать OpenRouter API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.8,
                    "max_tokens": 3000,
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenRouter API error: {response.text}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            return {
                "content": content.strip(),
                "tokens_used": data.get("usage", {}).get("total_tokens", 0),
                "model_used": model
            }


text_editor_service = TextEditorService()

