#!/usr/bin/env python3
"""
Тестовый скрипт для проверки endpoint загрузки файлов-источников.
"""

import sys
import os

# Добавляем путь к проекту
sys.path.insert(0, '/root/zachot')

from apps.api.routers.sources import router
from apps.api.services.file_parser_service import file_parser_service

def test_file_parser():
    """Тестирует парсер файлов."""
    
    print("\n" + "="*80)
    print("🧪 Тестирую FileParserService")
    print("="*80 + "\n")
    
    # Проверяем, что сервис существует
    print(f"✓ FileParserService импортирован: {file_parser_service}")
    print(f"  Методы: {[m for m in dir(file_parser_service) if not m.startswith('_')]}")
    
    # Проверяем роутер
    print(f"\n✓ Sources router импортирован: {router}")
    print(f"  Prefix: {router.prefix}")
    print(f"  Routes:")
    for route in router.routes:
        print(f"    - {route.methods} {route.path}")

if __name__ == "__main__":
    test_file_parser()
