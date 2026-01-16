"""
Утилиты для работы с параметром humanity (очеловечивание).
"""

from typing import Union


def convert_humanity_to_numeric(humanity: Union[str, int, None]) -> int:
    """
    Конвертирует значение humanity в числовое представление.
    
    Поддерживает:
    - Старый формат: 'low', 'medium', 'high' → 0, 50, 100
    - Новый формат: 0, 25, 50, 75, 100 → без изменений
    - None → 50 (значение по умолчанию)
    
    Args:
        humanity: Значение humanity (строка, число или None)
        
    Returns:
        int: Числовое значение от 0 до 100
        
    Examples:
        >>> convert_humanity_to_numeric('low')
        0
        >>> convert_humanity_to_numeric('medium')
        50
        >>> convert_humanity_to_numeric('high')
        100
        >>> convert_humanity_to_numeric(25)
        25
        >>> convert_humanity_to_numeric(None)
        50
    """
    if humanity is None:
        return 50
    
    if isinstance(humanity, str):
        # Старая система: low/medium/high
        mapping = {
            'low': 0,
            'medium': 50,
            'high': 100
        }
        return mapping.get(humanity.lower(), 50)
    
    # Новая система: числовые значения
    return int(humanity)


def get_humanity_label(humanity_level: int) -> str:
    """
    Возвращает текстовую метку для уровня humanity.
    
    Args:
        humanity_level: Числовое значение от 0 до 100
        
    Returns:
        str: Текстовая метка
        
    Examples:
        >>> get_humanity_label(0)
        'Строгий AI-стиль'
        >>> get_humanity_label(50)
        'Естественный стиль'
        >>> get_humanity_label(100)
        'Anti-AI Maximum'
    """
    if humanity_level < 12.5:
        return "Строгий AI-стиль"
    elif humanity_level < 37.5:
        return "Легкое сглаживание"
    elif humanity_level < 62.5:
        return "Естественный стиль"
    elif humanity_level < 87.5:
        return "Авторский почерк"
    else:
        return "Anti-AI Maximum"
