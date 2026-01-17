#!/usr/bin/env python3
"""
Скрипт восстановления базы данных из бэкапа.
"""

import os
import shutil
import gzip
import sqlite3
from datetime import datetime
from pathlib import Path

# Конфигурация
DB_PATH = "/home/deploy/zachot/production.db"
BACKUP_DIR = "/home/deploy/zachot/backups"

def list_backups():
    """Список доступных бэкапов."""
    
    backups = []
    for backup_file in Path(BACKUP_DIR).glob("production_*.db.gz"):
        if backup_file.is_symlink():
            continue
        
        file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
        size = backup_file.stat().st_size / (1024 * 1024)
        
        backups.append({
            'path': str(backup_file),
            'name': backup_file.name,
            'time': file_time,
            'size_mb': size
        })
    
    backups.sort(key=lambda x: x['time'], reverse=True)
    return backups

def restore_backup(backup_path: str):
    """Восстанавливает БД из бэкапа."""
    
    print(f"🔄 Восстановление из бэкапа: {backup_path}")
    
    # Создаём бэкап текущей БД
    if os.path.exists(DB_PATH):
        current_backup = f"{DB_PATH}.before_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(DB_PATH, current_backup)
        print(f"✅ Создан бэкап текущей БД: {current_backup}")
    
    # Распаковываем бэкап
    temp_file = "/tmp/restore_temp.db"
    print("📦 Распаковка бэкапа...")
    with gzip.open(backup_path, 'rb') as f_in:
        with open(temp_file, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    
    # Проверяем целостность
    print("🔍 Проверка целостности...")
    conn = sqlite3.connect(temp_file)
    cursor = conn.cursor()
    cursor.execute("PRAGMA integrity_check")
    result = cursor.fetchone()[0]
    conn.close()
    
    if result != "ok":
        print(f"❌ Ошибка: Бэкап повреждён! {result}")
        os.remove(temp_file)
        return False
    
    print("✅ Целостность подтверждена")
    
    # Восстанавливаем
    print("💾 Восстановление БД...")
    shutil.move(temp_file, DB_PATH)
    
    print("✅ БД восстановлена успешно!")
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Восстановление БД из бэкапа")
    print("=" * 60)
    print()
    
    # Список бэкапов
    backups = list_backups()
    
    if not backups:
        print("❌ Бэкапы не найдены!")
        exit(1)
    
    print("📋 Доступные бэкапы:")
    for i, backup in enumerate(backups, 1):
        print(f"   {i}. {backup['name']}")
        print(f"      Дата: {backup['time'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"      Размер: {backup['size_mb']:.2f} MB")
        print()
    
    # Используем последний бэкап
    latest_backup = backups[0]
    print(f"🎯 Используется последний бэкап: {latest_backup['name']}")
    print()
    
    if restore_backup(latest_backup['path']):
        print()
        print("=" * 60)
        print("✅ Восстановление завершено успешно!")
        print("=" * 60)
        exit(0)
    else:
        print()
        print("=" * 60)
        print("❌ Восстановление не удалось!")
        print("=" * 60)
        exit(1)
