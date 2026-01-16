"""
Unit тесты для QualityControlService.
"""

import pytest
from unittest.mock import AsyncMock, patch
from apps.api.services.quality_control_service import quality_control_service


@pytest.mark.asyncio
async def test_check_quality_success():
    """Тест успешной проверки качества."""
    with patch('apps.api.services.quality_control_service.openai_service.chat_completion', new_callable=AsyncMock) as mock_ai:
        mock_ai.return_value = ("Исправленный текст", {"tokens": 200})
        
        result_text, usage_info = await quality_control_service.check_quality("Исходный текст")
        
        assert result_text == "Исправленный текст"
        assert usage_info["tokens"] == 200
        mock_ai.assert_called_once()


@pytest.mark.asyncio
async def test_check_quality_failure():
    """Тест обработки ошибки при проверке качества."""
    with patch('apps.api.services.quality_control_service.openai_service.chat_completion', new_callable=AsyncMock) as mock_ai:
        mock_ai.return_value = None
        
        original_text = "Исходный текст"
        result_text, usage_info = await quality_control_service.check_quality(original_text)
        
        # При ошибке возвращается исходный текст
        assert result_text == original_text
        assert usage_info == {}


def test_check_volume_meets_requirements():
    """Тест проверки объёма - текст соответствует требованиям."""
    text = " ".join(["слово"] * 2800)  # 2800 слов = 10 страниц
    
    result = quality_control_service.check_volume(text, target_pages=10)
    
    assert result["target_pages"] == 10
    assert result["target_words"] == 2800
    assert result["actual_words"] == 2800
    assert result["volume_ratio"] == 100.0
    assert result["status"] == "ok"


def test_check_volume_short():
    """Тест проверки объёма - текст короче требуемого."""
    text = " ".join(["слово"] * 1400)  # 1400 слов = 5 страниц (вместо 10)
    
    result = quality_control_service.check_volume(text, target_pages=10)
    
    assert result["target_pages"] == 10
    assert result["target_words"] == 2800
    assert result["actual_words"] == 1400
    assert result["volume_ratio"] == 50.0
    assert result["status"] == "short"


def test_check_volume_empty():
    """Тест проверки объёма - пустой текст."""
    result = quality_control_service.check_volume("", target_pages=10)
    
    assert result["actual_words"] == 0
    assert result["actual_chars"] == 0
    assert result["volume_ratio"] == 0.0
    assert result["status"] == "short"


def test_check_volume_slightly_short():
    """Тест проверки объёма - текст немного короче (85%)."""
    text = " ".join(["слово"] * 2380)  # 85% от 2800
    
    result = quality_control_service.check_volume(text, target_pages=10)
    
    assert result["volume_ratio"] == pytest.approx(85.0, rel=1e-1)
    assert result["status"] == "short"  # < 90%
