import pytest
from apps.api.services.model_router import model_router
from apps.api.services.openai_service import openai_service
from unittest.mock import patch, MagicMock

@pytest.mark.asyncio
async def test_model_fallback_on_402():
    # Мы имитируем первый ответ как 402 (ошибка оплаты)
    # и второй как успешный 200
    
    with patch("httpx.AsyncClient.post") as mock_post:
        # 1-й вызов: 402
        mock_resp_402 = MagicMock()
        mock_resp_402.status_code = 402
        
        # 2-й вызов: 200
        mock_resp_200 = MagicMock()
        mock_resp_200.status_code = 200
        mock_resp_200.json.return_value = {
            "choices": [{"message": {"content": "Fallback Result"}}]
        }
        mock_resp_200.raise_for_status = MagicMock()
        
        # httpx.AsyncClient.post - асинхронный метод, поэтому он должен возвращать awaitable
        mock_post.side_effect = [mock_resp_402, mock_resp_200]
        
        result = await openai_service.chat_completion(
            model="premium-model",
            messages=[{"role": "user", "content": "Hello"}],
            step_type="suggest_details",
            work_type="referat"
        )
        
        assert result == "Fallback Result"
        assert mock_post.call_count == 2
        
        # Проверяем, что второй вызов использовал резервную модель
        fallback_model = model_router.get_model_for_step("suggest_details", work_type="referat", is_fallback=True)
        assert mock_post.call_args_list[1].kwargs["json"]["model"] == fallback_model
