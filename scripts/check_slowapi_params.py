#!/usr/bin/env python3
"""
Скрипт для проверки правильности использования slowapi параметров.
Проверяет, что все эндпоинты с @limiter.limit используют правильное имя параметра.
"""

import os
import re
import sys
from pathlib import Path

def check_file(filepath):
    """Проверяет файл на правильность использования slowapi."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    lines = content.split('\n')
    
    # Ищем функции с @limiter.limit
    for i, line in enumerate(lines):
        if '@limiter.limit' in line:
            # Проверяем следующие строки для определения функции
            for j in range(i + 1, min(i + 10, len(lines))):
                func_line = lines[j]
                
                # Нашли определение функции
                if 'async def ' in func_line or 'def ' in func_line:
                    # Проверяем параметры
                    # Ищем паттерн: req: Request или другие неправильные имена
                    if re.search(r'\breq:\s*Request\b', func_line):
                        issues.append({
                            'file': filepath,
                            'line': j + 1,
                            'issue': 'Используется "req: Request" вместо "request: Request"',
                            'code': func_line.strip()
                        })
                    
                    # Проверяем, что есть request: Request
                    if '@limiter.limit' in lines[i] and 'request: Request' not in func_line:
                        # Проверяем следующие строки (многострочное определение)
                        full_def = func_line
                        for k in range(j + 1, min(j + 10, len(lines))):
                            full_def += ' ' + lines[k].strip()
                            if ')' in lines[k]:
                                break
                        
                        if 'request: Request' not in full_def:
                            issues.append({
                                'file': filepath,
                                'line': j + 1,
                                'issue': 'Эндпоинт с @limiter.limit не имеет параметра "request: Request"',
                                'code': func_line.strip()
                            })
                    break
    
    return issues

def main():
    """Главная функция."""
    print("🔍 Проверка правильности использования slowapi параметров...\n")
    
    # Путь к роутерам
    routers_path = Path(__file__).parent.parent / 'apps' / 'api' / 'routers'
    
    all_issues = []
    files_checked = 0
    
    # Проверяем все Python файлы в роутерах
    for filepath in routers_path.glob('*.py'):
        if filepath.name == '__init__.py':
            continue
        
        files_checked += 1
        issues = check_file(filepath)
        all_issues.extend(issues)
    
    # Выводим результаты
    if all_issues:
        print(f"❌ Найдено {len(all_issues)} проблем(ы):\n")
        for issue in all_issues:
            print(f"Файл: {issue['file']}")
            print(f"Строка: {issue['line']}")
            print(f"Проблема: {issue['issue']}")
            print(f"Код: {issue['code']}")
            print()
        sys.exit(1)
    else:
        print(f"✅ Все проверки пройдены!")
        print(f"   Проверено файлов: {files_checked}")
        print(f"   Проблем не найдено")
        sys.exit(0)

if __name__ == "__main__":
    main()
