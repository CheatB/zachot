"""
FormattingService - базовое форматирование текста без ИИ
Выполняет техническую обработку текста: орфографию, пунктуацию, структуру
"""

import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class FormattingService:
    """Сервис базового форматирования текста"""
    
    @staticmethod
    def normalize_punctuation(text: str) -> str:
        """Нормализует пунктуацию в тексте"""
        # Убираем множественные пробелы
        text = re.sub(r'\s+', ' ', text)
        
        # Убираем пробелы перед знаками препинания
        text = re.sub(r'\s+([,.;:!?])', r'\1', text)
        
        # Добавляем пробел после знаков препинания (если его нет)
        text = re.sub(r'([,.;:!?])([^\s\n])', r'\1 \2', text)
        
        # Нормализуем кавычки
        text = text.replace('"', '«').replace('"', '»')
        text = re.sub(r'"([^"]+)"', r'«\1»', text)
        
        # Нормализуем тире
        text = text.replace(' - ', ' — ')
        text = re.sub(r'(\w)\s*-\s*(\w)', r'\1—\2', text)
        
        # Убираем пробелы в начале и конце строк
        text = '\n'.join(line.strip() for line in text.split('\n'))
        
        return text
    
    @staticmethod
    def format_headings(text: str) -> str:
        """Форматирует заголовки согласно ГОСТ"""
        lines = text.split('\n')
        formatted_lines = []
        
        for line in lines:
            # Заголовки 1 уровня (начинаются с #)
            if line.startswith('# '):
                heading = line.replace('# ', '').strip().upper()
                formatted_lines.append(f'# {heading}')
            
            # Заголовки 2 уровня (начинаются с ##)
            elif line.startswith('## '):
                heading = line.replace('## ', '').strip()
                # Заголовки 2 уровня с заглавной буквы
                heading = heading[0].upper() + heading[1:] if heading else heading
                formatted_lines.append(f'## {heading}')
            
            else:
                formatted_lines.append(line)
        
        return '\n'.join(formatted_lines)
    
    @staticmethod
    def format_lists(text: str) -> str:
        """Форматирует списки"""
        lines = text.split('\n')
        formatted_lines = []
        in_list = False
        
        for line in lines:
            # Нумерованные списки
            if re.match(r'^\d+\.\s+', line):
                in_list = True
                # Нормализуем отступ
                formatted_lines.append(line.strip())
            
            # Маркированные списки
            elif re.match(r'^[-•*]\s+', line):
                in_list = True
                # Заменяем все маркеры на единый
                line = re.sub(r'^[-•*]\s+', '• ', line.strip())
                formatted_lines.append(line)
            
            else:
                if in_list and line.strip() == '':
                    in_list = False
                formatted_lines.append(line)
        
        return '\n'.join(formatted_lines)
    
    @staticmethod
    def normalize_references(text: str) -> str:
        """Нормализует ссылки на источники"""
        # Ищем ссылки в квадратных скобках [1], [2] и т.д.
        text = re.sub(r'\[\s*(\d+)\s*\]', r'[\1]', text)
        
        # Убираем лишние пробелы вокруг ссылок
        text = re.sub(r'\s+\[(\d+)\]', r' [\1]', text)
        
        return text
    
    @staticmethod
    def apply_basic_formatting(text: str, formatting_settings: Dict[str, Any] = None) -> str:
        """
        Применяет базовое форматирование к тексту
        Это быстрая и бесплатная обработка без использования ИИ
        """
        if not text:
            return text
        
        logger.info("Applying basic formatting (no AI)")
        
        # Шаг 1: Нормализация пунктуации
        text = FormattingService.normalize_punctuation(text)
        
        # Шаг 2: Форматирование заголовков
        text = FormattingService.format_headings(text)
        
        # Шаг 3: Форматирование списков
        text = FormattingService.format_lists(text)
        
        # Шаг 4: Нормализация ссылок на источники
        text = FormattingService.normalize_references(text)
        
        # Шаг 5: Финальная очистка
        # Убираем множественные пустые строки
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Убираем пробелы в конце строк
        text = '\n'.join(line.rstrip() for line in text.split('\n'))
        
        logger.info("Basic formatting completed")
        return text


# Создаем singleton instance
formatting_service = FormattingService()
