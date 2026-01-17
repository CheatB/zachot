"""
Система кредитов для управления лимитами генераций.

Кредиты — это внутренняя валюта сервиса "Зачёт".
Разные типы работ требуют разное количество кредитов,
в зависимости от объёма и сложности генерации.

Примеры:
    - Реферат (до 10 стр) = 1 кредит
    - Курсовая (до 35 стр) = 3 кредита
    
Подписка на месяц = 5 кредитов, что эквивалентно:
    - 5 рефератов/эссе, ИЛИ
    - 1 курсовая + 2 реферата, ИЛИ
    - 2 научные статьи + 1 реферат
"""

from typing import Dict, Literal


# Стоимость генерации в кредитах по типу работы
CREDIT_COSTS: Dict[str, int] = {
    # Небольшие работы (до 10-15 страниц) — 1 кредит
    "referat": 1,       # Реферат
    "essay": 1,         # Эссе
    "doklad": 1,        # Доклад
    "composition": 1,   # Сочинение
    
    # Средние работы (15-25 страниц) — 2 кредита
    "article": 2,       # Научная статья
    "presentation": 1,  # Презентация (меньше текста)
    
    # Большие работы (25-40 страниц) — 3 кредита
    "kursach": 3,       # Курсовая работа
    
    # Прочее — 2 кредита (средний расход)
    "other": 2,
}

# Альтернативные названия типов работ (для совместимости)
WORK_TYPE_ALIASES: Dict[str, str] = {
    "coursework": "kursach",
    "course_work": "kursach",
    "курсовая": "kursach",
    "реферат": "referat",
    "эссе": "essay",
    "доклад": "doklad",
    "сочинение": "composition",
    "статья": "article",
    "презентация": "presentation",
}


# Кредиты, выдаваемые при покупке подписки
CREDITS_PER_PERIOD: Dict[str, int] = {
    "month": 5,      # 1 месяц = 5 кредитов
    "quarter": 15,   # 3 месяца = 15 кредитов (5 × 3)
    "year": 60,      # 12 месяцев = 60 кредитов (5 × 12)
}


# Пакеты кредитов для разовой покупки (без подписки)
CREDIT_PACKAGES: Dict[str, Dict[str, any]] = {
    "package_5": {
        "credits": 5,
        "price_rub": 599,
        "name": "5 кредитов",
        "description": "Для небольших работ"
    },
    "package_10": {
        "credits": 10,
        "price_rub": 1199,
        "name": "10 кредитов",
        "description": "Оптимальный выбор"
    },
    "package_20": {
        "credits": 20,
        "price_rub": 1999,
        "name": "20 кредитов",
        "description": "Максимальная выгода"
    }
}


def get_credit_cost(work_type: str) -> int:
    """
    Возвращает стоимость генерации в кредитах.
    
    Args:
        work_type: Тип работы (referat, kursach, etc.)
        
    Returns:
        Количество кредитов для списания
        
    Examples:
        >>> get_credit_cost("referat")
        1
        >>> get_credit_cost("kursach")
        3
        >>> get_credit_cost("unknown_type")
        2
    """
    # Нормализуем тип работы
    normalized = work_type.lower().strip()
    
    # Проверяем алиасы
    if normalized in WORK_TYPE_ALIASES:
        normalized = WORK_TYPE_ALIASES[normalized]
    
    # Возвращаем стоимость или дефолт
    return CREDIT_COSTS.get(normalized, CREDIT_COSTS["other"])


def get_credits_for_subscription(period: str) -> int:
    """
    Возвращает количество кредитов для начисления при покупке подписки.
    
    Args:
        period: Период подписки (month, quarter, year)
        
    Returns:
        Количество кредитов для начисления
        
    Examples:
        >>> get_credits_for_subscription("month")
        5
        >>> get_credits_for_subscription("year")
        60
    """
    return CREDITS_PER_PERIOD.get(period.lower(), CREDITS_PER_PERIOD["month"])


def get_work_type_label(work_type: str) -> str:
    """
    Возвращает человекочитаемое название типа работы.
    
    Args:
        work_type: Код типа работы
        
    Returns:
        Название на русском языке
    """
    labels = {
        "referat": "Реферат",
        "essay": "Эссе",
        "doklad": "Доклад",
        "composition": "Сочинение",
        "article": "Научная статья",
        "presentation": "Презентация",
        "kursach": "Курсовая работа",
        "other": "Другое",
    }
    normalized = work_type.lower().strip()
    if normalized in WORK_TYPE_ALIASES:
        normalized = WORK_TYPE_ALIASES[normalized]
    return labels.get(normalized, "Работа")


def format_credits_text(credits: int) -> str:
    """
    Форматирует количество кредитов с правильным склонением.
    
    Args:
        credits: Количество кредитов
        
    Returns:
        Строка вида "1 кредит", "2 кредита", "5 кредитов"
    """
    if credits % 10 == 1 and credits % 100 != 11:
        return f"{credits} кредит"
    elif credits % 10 in [2, 3, 4] and credits % 100 not in [12, 13, 14]:
        return f"{credits} кредита"
    else:
        return f"{credits} кредитов"


def get_credit_package(package_id: str) -> dict:
    """
    Возвращает информацию о пакете кредитов.
    
    Args:
        package_id: ID пакета (package_5, package_10, package_20)
        
    Returns:
        Словарь с информацией о пакете
        
    Examples:
        >>> get_credit_package("package_5")
        {'credits': 5, 'price_rub': 599, 'name': '5 кредитов', 'description': 'Для небольших работ'}
    """
    return CREDIT_PACKAGES.get(package_id, CREDIT_PACKAGES["package_5"])


def get_all_credit_packages() -> list:
    """
    Возвращает список всех доступных пакетов кредитов.
    
    Returns:
        Список словарей с информацией о пакетах
        
    Examples:
        >>> packages = get_all_credit_packages()
        >>> len(packages)
        3
    """
    return [
        {"id": key, **value} 
        for key, value in CREDIT_PACKAGES.items()
    ]

