"""
Unit-тесты для calculate_input_hash.
"""

import pytest

from packages.core_domain import calculate_input_hash


class TestCalculateInputHash:
    """Тесты функции calculate_input_hash."""
    
    def test_same_input_same_hash(self):
        """Одинаковый input должен давать одинаковый hash."""
        input_data = {"topic": "Python", "level": "beginner"}
        
        hash1 = calculate_input_hash(input_data)
        hash2 = calculate_input_hash(input_data)
        
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA256 hex string length
    
    def test_different_order_same_hash(self):
        """Разный порядок ключей должен давать одинаковый hash."""
        input1 = {"a": 1, "b": 2, "c": 3}
        input2 = {"c": 3, "a": 1, "b": 2}
        input3 = {"b": 2, "c": 3, "a": 1}
        
        hash1 = calculate_input_hash(input1)
        hash2 = calculate_input_hash(input2)
        hash3 = calculate_input_hash(input3)
        
        assert hash1 == hash2 == hash3
    
    def test_different_values_different_hash(self):
        """Разные значения должны давать разный hash."""
        input1 = {"topic": "Python"}
        input2 = {"topic": "Java"}
        
        hash1 = calculate_input_hash(input1)
        hash2 = calculate_input_hash(input2)
        
        assert hash1 != hash2
    
    def test_nested_dicts_normalized(self):
        """Вложенные словари должны нормализоваться."""
        input1 = {
            "outer": {"inner": {"a": 1, "b": 2}},
            "other": "value"
        }
        input2 = {
            "other": "value",
            "outer": {"inner": {"b": 2, "a": 1}}
        }
        
        hash1 = calculate_input_hash(input1)
        hash2 = calculate_input_hash(input2)
        
        assert hash1 == hash2
    
    def test_empty_dict(self):
        """Пустой словарь должен давать валидный hash."""
        hash_value = calculate_input_hash({})
        
        assert isinstance(hash_value, str)
        assert len(hash_value) == 64
    
    def test_complex_structure(self):
        """Сложная структура должна нормализоваться корректно."""
        input1 = {
            "step": "generation",
            "params": {
                "model": "gpt-4",
                "temperature": 0.7,
                "options": {"max_tokens": 1000, "top_p": 0.9}
            },
            "metadata": {"user_id": "123", "session": "abc"}
        }
        
        input2 = {
            "metadata": {"session": "abc", "user_id": "123"},
            "step": "generation",
            "params": {
                "options": {"top_p": 0.9, "max_tokens": 1000},
                "temperature": 0.7,
                "model": "gpt-4"
            }
        }
        
        hash1 = calculate_input_hash(input1)
        hash2 = calculate_input_hash(input2)
        
        assert hash1 == hash2
    
    def test_hash_is_deterministic(self):
        """Hash должен быть детерминированным."""
        input_data = {"test": "data", "number": 42}
        
        hashes = [calculate_input_hash(input_data) for _ in range(10)]
        
        # Все хеши должны быть одинаковыми
        assert len(set(hashes)) == 1
    
    def test_hash_type_is_string(self):
        """Hash должен быть строкой."""
        hash_value = calculate_input_hash({"test": "data"})
        
        assert isinstance(hash_value, str)
        # Проверка, что это hex строка
        assert all(c in '0123456789abcdef' for c in hash_value)

