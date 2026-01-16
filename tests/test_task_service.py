"""
Unit тесты для TaskService.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from apps.api.services.task_service import task_service


@pytest.mark.asyncio
async def test_classify_input_task():
    """Тест классификации входа как задачи."""
    with patch('apps.api.services.task_service.openai_service.chat_completion', new_callable=AsyncMock) as mock_ai:
        with patch('apps.api.services.task_service.cache_service.get', new_callable=AsyncMock) as mock_cache_get:
            with patch('apps.api.services.task_service.cache_service.set', new_callable=AsyncMock) as mock_cache_set:
                # Кэш пустой
                mock_cache_get.return_value = None
                
                # AI возвращает классификацию
                mock_ai.return_value = '{"type": "task", "reason": "Contains math problem"}'
                
                result = await task_service.classify_input("Решите уравнение x^2 + 5x + 6 = 0")
                
                assert result["type"] == "task"
                assert "reason" in result
                mock_ai.assert_called_once()
                mock_cache_set.assert_called_once()


@pytest.mark.asyncio
async def test_classify_input_chat():
    """Тест классификации входа как чата."""
    with patch('apps.api.services.task_service.openai_service.chat_completion', new_callable=AsyncMock) as mock_ai:
        with patch('apps.api.services.task_service.cache_service.get', new_callable=AsyncMock) as mock_cache_get:
            with patch('apps.api.services.task_service.cache_service.set', new_callable=AsyncMock):
                mock_cache_get.return_value = None
                mock_ai.return_value = '{"type": "chat", "reason": "General question"}'
                
                result = await task_service.classify_input("Привет, как дела?")
                
                assert result["type"] == "chat"


@pytest.mark.asyncio
async def test_classify_input_from_cache():
    """Тест получения классификации из кэша."""
    with patch('apps.api.services.task_service.cache_service.get', new_callable=AsyncMock) as mock_cache_get:
        with patch('apps.api.services.task_service.openai_service.chat_completion', new_callable=AsyncMock) as mock_ai:
            # Возвращаем из кэша
            mock_cache_get.return_value = {"type": "task", "reason": "Cached"}
            
            result = await task_service.classify_input("Test")
            
            assert result["type"] == "task"
            # AI не должен вызываться
            mock_ai.assert_not_called()


@pytest.mark.asyncio
async def test_solve_task_quick_mode():
    """Тест решения задачи в быстром режиме."""
    with patch('apps.api.services.task_service.openai_service.chat_completion', new_callable=AsyncMock) as mock_ai:
        mock_ai.return_value = ("Решение: x = -2 или x = -3", {"tokens": 100})
        
        result_text, usage_info = await task_service.solve_task(
            "Решите уравнение x^2 + 5x + 6 = 0",
            task_mode="quick"
        )
        
        assert "Решение" in result_text
        assert usage_info["tokens"] == 100
        
        # Проверяем, что промпт содержит инструкцию для quick mode
        call_args = mock_ai.call_args
        assert "КРАТКОЕ" in call_args[1]["messages"][0]["content"]


@pytest.mark.asyncio
async def test_solve_task_detailed_mode():
    """Тест решения задачи в подробном режиме."""
    with patch('apps.api.services.task_service.openai_service.chat_completion', new_callable=AsyncMock) as mock_ai:
        mock_ai.return_value = ("Подробное решение...", {"tokens": 500})
        
        result_text, usage_info = await task_service.solve_task(
            "Решите уравнение x^2 + 5x + 6 = 0",
            task_mode="detailed"
        )
        
        assert "Подробное" in result_text
        assert usage_info["tokens"] == 500
        
        # Проверяем, что промпт содержит инструкцию для detailed mode
        call_args = mock_ai.call_args
        assert "подробный" in call_args[1]["messages"][0]["content"]


@pytest.mark.asyncio
async def test_solve_task_failure():
    """Тест обработки ошибки при решении задачи."""
    with patch('apps.api.services.task_service.openai_service.chat_completion', new_callable=AsyncMock) as mock_ai:
        mock_ai.return_value = None
        
        with pytest.raises(ValueError, match="Failed to get solution"):
            await task_service.solve_task("Test task")
