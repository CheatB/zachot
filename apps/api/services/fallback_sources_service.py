"""
Fallback Sources Service
Предоставляет надёжные проверенные источники, если AI не смог найти достаточно валидных.
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class FallbackSourcesService:
    """
    Предоставляет надёжные источники, если AI не смог найти достаточно валидных.
    Все источники проверены вручную и имеют рабочие ссылки.
    """
    
    # Надёжные источники по темам (все проверены вручную)
    RELIABLE_SOURCES_BY_TOPIC = {
        'искусственный интеллект': [
            {
                'title': 'Рассел С., Норвиг П. Искусственный интеллект: современный подход. М.: Вильямс, 2021. 1408 с.',
                'url': 'https://scholar.google.com/scholar?q=Russell+Norvig+Artificial+Intelligence+Modern+Approach',
                'description': 'Фундаментальный учебник по искусственному интеллекту, охватывающий все основные направления',
                'source_type': 'book',
                'isVerified': True,
                'isTrustedDomain': True,
                'isFallback': True
            },
            {
                'title': 'Гудфеллоу Я., Бенджио И., Курвилль А. Глубокое обучение. М.: ДМК Пресс, 2018. 652 с.',
                'url': 'https://scholar.google.com/scholar?q=Goodfellow+Deep+Learning+Book',
                'description': 'Классический учебник по глубокому обучению от ведущих специалистов в области',
                'source_type': 'book',
                'isVerified': True,
                'isTrustedDomain': True,
                'isFallback': True
            }
        ],
        'машинное обучение': [
            {
                'title': 'Флах П. Машинное обучение. Наука и искусство построения алгоритмов. М.: ДМК Пресс, 2015. 400 с.',
                'url': 'https://scholar.google.com/scholar?q=Peter+Flach+Machine+Learning',
                'description': 'Практическое руководство по машинному обучению с примерами и алгоритмами',
                'source_type': 'book',
                'isVerified': True,
                'isTrustedDomain': True,
                'isFallback': True
            }
        ],
        'нейронные сети': [
            {
                'title': 'Хайкин С. Нейронные сети: полный курс. М.: Вильямс, 2006. 1104 с.',
                'url': 'https://scholar.google.com/scholar?q=Simon+Haykin+Neural+Networks',
                'description': 'Полный курс по нейронным сетям, охватывающий теорию и практику',
                'source_type': 'book',
                'isVerified': True,
                'isTrustedDomain': True,
                'isFallback': True
            }
        ],
        'образование': [
            {
                'title': 'Педагогика: учебник для вузов / под ред. П.И. Пидкасистого. М.: Юрайт, 2020. 408 с.',
                'url': 'https://scholar.google.com/scholar?q=Педагогика+Пидкасистый',
                'description': 'Фундаментальный учебник по педагогике для высших учебных заведений',
                'source_type': 'textbook',
                'isVerified': True,
                'isTrustedDomain': True,
                'isFallback': True
            }
        ],
        'экономика': [
            {
                'title': 'Мэнкью Н.Г. Принципы экономикс. СПб.: Питер, 2018. 672 с.',
                'url': 'https://scholar.google.com/scholar?q=Mankiw+Principles+of+Economics',
                'description': 'Классический учебник по основам экономической теории',
                'source_type': 'textbook',
                'isVerified': True,
                'isTrustedDomain': True,
                'isFallback': True
            }
        ],
        'менеджмент': [
            {
                'title': 'Друкер П. Практика менеджмента. М.: Манн, Иванов и Фербер, 2015. 416 с.',
                'url': 'https://scholar.google.com/scholar?q=Peter+Drucker+Practice+of+Management',
                'description': 'Классическая работа по теории и практике управления',
                'source_type': 'book',
                'isVerified': True,
                'isTrustedDomain': True,
                'isFallback': True
            }
        ],
        'маркетинг': [
            {
                'title': 'Котлер Ф., Келлер К.Л. Маркетинг менеджмент. СПб.: Питер, 2018. 848 с.',
                'url': 'https://scholar.google.com/scholar?q=Kotler+Keller+Marketing+Management',
                'description': 'Фундаментальный учебник по маркетингу от ведущих специалистов',
                'source_type': 'textbook',
                'isVerified': True,
                'isTrustedDomain': True,
                'isFallback': True
            }
        ]
    }
    
    # Универсальные источники (применимы к любой теме)
    UNIVERSAL_SOURCES = [
        {
            'title': 'Научная электронная библиотека КиберЛенинка',
            'url': 'https://cyberleninka.ru/',
            'description': 'Крупнейшая российская научная электронная библиотека с открытым доступом',
            'source_type': 'website',
            'isVerified': True,
            'isTrustedDomain': True,
            'isFallback': True
        },
        {
            'title': 'Google Scholar - Академия Google',
            'url': 'https://scholar.google.com/',
            'description': 'Поисковая система по научным публикациям и академической литературе',
            'source_type': 'website',
            'isVerified': True,
            'isTrustedDomain': True,
            'isFallback': True
        }
    ]
    
    def get_fallback_sources(self, topic: str, count: int = 3) -> List[Dict[str, Any]]:
        """
        Возвращает надёжные источники по теме.
        
        Args:
            topic: Тема работы
            count: Количество источников для возврата
            
        Returns:
            Список надёжных источников
        """
        if not topic:
            logger.warning("No topic provided for fallback sources")
            return self.UNIVERSAL_SOURCES[:count]
        
        topic_lower = topic.lower()
        matched_sources = []
        
        # Ищем источники по ключевым словам в теме
        for keyword, sources in self.RELIABLE_SOURCES_BY_TOPIC.items():
            if keyword in topic_lower:
                logger.info(f"Found fallback sources for keyword: {keyword}")
                matched_sources.extend(sources)
        
        # Если нашли подходящие источники, возвращаем их
        if matched_sources:
            return matched_sources[:count]
        
        # Иначе возвращаем универсальные
        logger.info("No specific fallback sources found, returning universal sources")
        return self.UNIVERSAL_SOURCES[:count]
    
    def enrich_sources_with_fallback(
        self,
        sources: List[Dict[str, Any]],
        topic: str,
        min_sources: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Дополняет список источников fallback источниками, если их недостаточно.
        
        Args:
            sources: Текущий список источников
            topic: Тема работы
            min_sources: Минимальное количество источников
            
        Returns:
            Дополненный список источников
        """
        if len(sources) >= min_sources:
            return sources
        
        needed = min_sources - len(sources)
        logger.info(f"Adding {needed} fallback sources to reach minimum of {min_sources}")
        
        fallback_sources = self.get_fallback_sources(topic, count=needed)
        
        # Проверяем, что fallback источники не дублируют существующие
        existing_urls = {s.get('url') for s in sources if s.get('url')}
        unique_fallback = [
            s for s in fallback_sources 
            if s.get('url') not in existing_urls
        ]
        
        return sources + unique_fallback[:needed]


# Singleton instance
fallback_sources_service = FallbackSourcesService()

