import json
import os
import logging
import time
from typing import Optional, Dict

logger = logging.getLogger(__name__)

DEFAULT_PROMPTS = {
    "classifier": "Ты — системный фильтр сервиса \"Зачёт\". Твоя задача — определить, является ли текст ниже условием конкретной академической задачи (математика, физика, химия, программирование и т.д.).\n\nТЕКСТ ПОЛЬЗОВАТЕЛЯ:\n---\n{input_text}\n---\n\nПРАВИЛА КЛАССИФИКАЦИИ:\n1. Если текст содержит условие задачи, вопрос по конкретному примеру или данные для расчета — это \"task\".\n2. Если текст является общим вопросом (\"расскажи про ИИ\", \"как выучить питон\"), просьбой написать эссе без темы, или просто приветствием — это \"chat\".\n3. Если в тексте только общие слова типа \"помоги\", \"объясни\" без контекста — это \"chat\".\n\nВерни результат в формате JSON: {\"type\": \"task\" | \"chat\", \"reason\": \"краткое пояснение\"}",
    "structure": "Ты — экспертный академический методист. Сформулируй подробный план для работы типа {work_type}.\nТема: {topic}\nЦель: {goal}\nОсновная идея: {idea}\nОбъем: {volume} страниц.\n\nИНСТРУКЦИЯ ПО ФОРМАТУ:\n- Тон изложения: {style}.\n- План должен включать: Введение, Основную часть (главы/параграфы), Заключение, Литература.\n- НИКАКИХ приветствий и лишних рассуждений. Только структура.\n\nВерни результат в формате JSON: {\"structure\": [{\"title\": \"...\", \"level\": 1}]}",
    "sources_academic": "Ты — библиограф в крупной научной библиотеке. Подбери список АКАДЕМИЧЕСКИХ источников для следующей работы:\nТип: {work_type}\nТема: {topic}\n\nТРЕБОВАНИЯ:\n1. Минимум 5-7 АКАДЕМИЧЕСКИХ источников.\n2. ТОЛЬКО научные статьи, монографии, учебники, диссертации, официальные документы, научные журналы.\n3. Обязательно ищи доступные в сети книги и PDF-документы из научных баз.\n4. Оформи по стандарту ГОСТ Р 7.0.100–2018.\n5. Для каждого источника напиши краткое описание (1-2 предложения), почему он важен для этой темы.\n6. СТРОГО РЕАЛЬНЫЕ URL (прямые ссылки на PDF, страницы в КиберЛенинке, eLibrary, Google Scholar или сайты издательств). НИКАКИХ placeholder-ов или example.com.\n7. Добавь поле \"type\" для каждого источника: \"article\" (статья), \"book\" (книга), \"thesis\" (диссертация), \"textbook\" (учебник), \"document\" (документ).\n\nЕсли для данной темы НЕ СУЩЕСТВУЕТ академических источников (например, тема про игры, фильмы, фантастику), верни ПУСТОЙ список.\n\nВерни результат в формате JSON: {\"sources\": [{\"title\": \"...\", \"url\": \"...\", \"description\": \"...\", \"type\": \"...\", \"author\": \"...\", \"year\": \"...\"}]}",
    "sources_non_academic": "Ты — исследователь интернет-ресурсов. Подбери список ЛЮБЫХ доступных источников информации для следующей темы:\nТип работы: {work_type}\nТема: {topic}\n\nТРЕБОВАНИЯ:\n1. Минимум 5-7 источников ЛЮБОГО типа.\n2. Ищи: вики-ресурсы (Wikipedia, Fandom, специализированные вики), официальные сайты, базы данных, форумы, блоги экспертов, YouTube-каналы, документацию.\n3. Для каждого источника напиши краткое описание (1-2 предложения), почему он полезен для этой темы.\n4. СТРОГО РЕАЛЬНЫЕ URL. НИКАКИХ placeholder-ов или example.com.\n5. Добавь поле \"type\" для каждого источника: \"wiki\" (вики), \"website\" (сайт), \"forum\" (форум), \"blog\" (блог), \"video\" (видео), \"database\" (база данных), \"documentation\" (документация).\n6. Все источники будут помечены как \"не академические\".\n\nВерни результат в формате JSON: {\"sources\": [{\"title\": \"...\", \"url\": \"...\", \"description\": \"...\", \"type\": \"...\", \"author\": \"...\", \"year\": \"2024\"}]}",
    "generation": "Напиши контент для раздела \"{section_title}\" работы на тему \"{topic}\".\n\nКОНТЕКСТ:\nЦель: {goal}\nИдея: {idea}\n\nТРЕБОВАНИЯ:\n- Академический стиль.\n- Плотный текст без воды.\n{layout_instruction}\n\n{previous_context_instruction}\n\nВерни результат в формате JSON: {\"content\": \"...\", \"layout\": \"...\", \"icons\": [\"...\"], \"visual_meta\": {{...}}, \"image_prompt\": \"...\"}",
    "humanize": "Перепиши следующий академический текст, чтобы он выглядел так, будто его написал человек, а не ИИ.\n\nТЕКСТ ДЛЯ ОБРАБОТКИ:\n---\n{text}\n---\n\nИНСТРУКЦИИ:\n{instructions}\n\nВАЖНО: Сохрани все факты, цифры и научную суть. Изменяй ТОЛЬКО стиль и структуру предложений.",
    "qc": "Ты — строгий академический корректор. Проверь текст на соответствие стандартам ГОСТ и научному стилю.\n\nТЕКСТ ПРОВЕРКИ:\n---\n{text}\n---\n\nЗАДАЧИ:\n1. Проверь отсутствие местоимений \"я\", \"мой\" (замени на \"мы\", \"наш\" или безличные формы).\n2. Убери точки в конце заголовков.\n3. Исправь стилистические ошибки и канцеляризмы.\n4. Проверь логичность переходов между абзацами.\n5. Удали любые фразы-клише ИИ (например, \"в данной главе мы рассмотрели\", \"важно отметить, что\").\n\nВерни ПОЛНОСТЬЮ исправленный текст. Никаких комментариев от себя, только текст работы.",
    "suggest_details": "Ты — академический консультант. На основе темы \"{topic}\" предложи:\n1. Цель работы (1 предложение)\n2. Основную идею (тезис) работы (1-2 предложения)\n\nВерни результат в формате JSON: {\"goal\": \"...\", \"idea\": \"...\"}",
    "suggest_title_info": "Ты — сотрудник отдела кадров университета. По краткому названию вуза \"{university_short}\" найди:\n1. Полное официальное название (например, для МГУ это \"Московский государственный университет имени М.В. Ломоносова\").\n2. Город, в котором находится главный корпус.\n\nВерни результат в формате JSON: {\"university_full\": \"...\", \"city\": \"...\"}"
}

class PromptManager:
    """
    Менеджер промптов с кэшированием.
    
    Кэширует промпты в памяти на 5 минут для уменьшения I/O операций.
    """
    
    def __init__(self, config_path: Optional[str] = None, cache_ttl: int = 300):
        self.config_path = config_path
        self.cache_ttl = cache_ttl  # Время жизни кэша в секундах (по умолчанию 5 минут)
        self._cache = None
        self._cache_timestamp = 0
        self.prompts = self._load_config()

    def _load_config(self):
        """
        Загружает конфигурацию промптов с кэшированием.
        
        Кэш обновляется автоматически, если:
        - Прошло больше cache_ttl секунд с последней загрузки
        - Кэш еще не инициализирован
        """
        current_time = time.time()
        
        # Проверяем, нужно ли обновить кэш
        if self._cache is None or (current_time - self._cache_timestamp) > self.cache_ttl:
            if self.config_path and os.path.exists(self.config_path):
                try:
                    with open(self.config_path, "r", encoding="utf-8") as f:
                        self._cache = json.load(f)
                    self._cache_timestamp = current_time
                    logger.debug(f"Prompts loaded from {self.config_path} and cached")
                except Exception as e:
                    logger.error(f"Failed to load prompts config: {e}")
                    self._cache = DEFAULT_PROMPTS
                    self._cache_timestamp = current_time
            else:
                self._cache = DEFAULT_PROMPTS
                self._cache_timestamp = current_time
        
        return self._cache

    def save_config(self, new_config: dict):
        """
        Сохраняет новую конфигурацию промптов и инвалидирует кэш.
        """
        if not self.config_path:
            logger.error("Cannot save config: no config_path set")
            return False
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(new_config, f, indent=2, ensure_ascii=False)
            
            # Инвалидируем кэш, чтобы при следующем обращении загрузились новые промпты
            self._cache = new_config
            self._cache_timestamp = time.time()
            self.prompts = new_config
            
            logger.info(f"Prompts config saved and cache updated")
            return True
        except Exception as e:
            logger.error(f"Failed to save prompts config: {e}")
            return False

    def get_prompt(self, name: str) -> str:
        """
        Получает промпт по имени из кэша.
        
        Автоматически обновляет кэш, если он устарел.
        """
        # Обновляем кэш, если нужно
        self.prompts = self._load_config()
        return self.prompts.get(name, DEFAULT_PROMPTS.get(name, ""))
    
    def invalidate_cache(self):
        """Принудительно инвалидирует кэш промптов."""
        self._cache = None
        self._cache_timestamp = 0
        logger.info("Prompts cache invalidated")

prompt_manager = PromptManager(os.path.join(os.path.dirname(__file__), "../../../apps/api/data/prompts.json"))
