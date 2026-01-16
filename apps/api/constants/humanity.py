"""
Константы и enum для работы с уровнями humanity (очеловечивания).
"""

from enum import IntEnum
from typing import Dict


class HumanityLevel(IntEnum):
    """Уровни очеловечивания текста."""
    
    STRICT_AI = 0          # 🤖 Строгий AI-стиль
    LIGHT_SMOOTHING = 25   # 📝 Легкое сглаживание
    NATURAL = 50           # ✍️ Естественный стиль (по умолчанию)
    AUTHORIAL = 75         # 🎭 Авторский почерк
    ANTI_AI_MAX = 100      # 🔥 Anti-AI Maximum


# Маппинг уровней humanity на промпты
HUMANITY_PROMPT_MAP: Dict[int, str] = {
    HumanityLevel.STRICT_AI: "humanize_0",
    HumanityLevel.LIGHT_SMOOTHING: "humanize_25",
    HumanityLevel.NATURAL: "humanize_50",
    HumanityLevel.AUTHORIAL: "humanize_75",
    HumanityLevel.ANTI_AI_MAX: "humanize_100",
}


# Маппинг уровней humanity на текстовые метки
HUMANITY_LABELS: Dict[int, str] = {
    HumanityLevel.STRICT_AI: "Строгий AI-стиль",
    HumanityLevel.LIGHT_SMOOTHING: "Легкое сглаживание",
    HumanityLevel.NATURAL: "Естественный стиль",
    HumanityLevel.AUTHORIAL: "Авторский почерк",
    HumanityLevel.ANTI_AI_MAX: "Anti-AI Maximum",
}


# Маппинг уровней humanity на иконки
HUMANITY_ICONS: Dict[int, str] = {
    HumanityLevel.STRICT_AI: "🤖",
    HumanityLevel.LIGHT_SMOOTHING: "📝",
    HumanityLevel.NATURAL: "✍️",
    HumanityLevel.AUTHORIAL: "🎭",
    HumanityLevel.ANTI_AI_MAX: "🔥",
}


# Значение по умолчанию
DEFAULT_HUMANITY_LEVEL = HumanityLevel.NATURAL


def get_humanity_prompt_key(humanity_level: int) -> str:
    """
    Возвращает ключ промпта для заданного уровня humanity.
    
    Args:
        humanity_level: Числовое значение от 0 до 100
        
    Returns:
        str: Ключ промпта (например, "humanize_50")
        
    Examples:
        >>> get_humanity_prompt_key(0)
        'humanize_0'
        >>> get_humanity_prompt_key(50)
        'humanize_50'
        >>> get_humanity_prompt_key(37)  # Округляется к ближайшему
        'humanize_25'
    """
    # Находим ближайший уровень
    if humanity_level < 12.5:
        return HUMANITY_PROMPT_MAP[HumanityLevel.STRICT_AI]
    elif humanity_level < 37.5:
        return HUMANITY_PROMPT_MAP[HumanityLevel.LIGHT_SMOOTHING]
    elif humanity_level < 62.5:
        return HUMANITY_PROMPT_MAP[HumanityLevel.NATURAL]
    elif humanity_level < 87.5:
        return HUMANITY_PROMPT_MAP[HumanityLevel.AUTHORIAL]
    else:
        return HUMANITY_PROMPT_MAP[HumanityLevel.ANTI_AI_MAX]
