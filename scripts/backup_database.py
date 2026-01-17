#!/usr/bin/env python3
"""
Скрипт резервного копирования базы данных Zachot.
Создаёт бэкапы с ротацией (хранит последние 30 дней).
"""

import os
import shutil
import gzip
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

# Конфигурация
DB_PATH = "/home/deploy/zachot/production.db"
BACKUP_DIR = "/home/deploy/zachot/backups"
RETENTION_DAYS = 30

def create_backup():
    """Создаёт бэкап базы данных."""
    
    # Создаём директорию для бэкапов
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    # Проверяем существование БД
    if not os.path.exists(DB_PATH):
        print(f"❌ Ошибка: БД не найдена: {DB_PATH}")
        return False
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUP_DIR, f"production_{timestamp}.db")
    backup_file_gz = f"{backup_file}.gz"
    
    print("🔄 Создание бэкапа БД...")
    print(f"   Источник: {DB_PATH}")
    print(f"   Назначение: {backup_file}")
    
    try:
        # Создаём бэкап с помощью SQLite
        source_conn = sqlite3.connect(DB_PATH)
        backup_conn = sqlite3.connect(backup_file)
        source_conn.backup(backup_conn)
        backup_conn.close()
        source_conn.close()
        
        # Получаем размер
        size = os.path.getsize(backup_file)
        size_mb = size / (1024 * 1024)
        print(f"✅ Бэкап создан успешно: {size_mb:.2f} MB")
        
        # Сжимаем бэкап
        print("🗜️  Сжатие бэкапа...")
        with open(backup_file, 'rb') as f_in:
            with gzip.open(backup_file_gz, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        
        # Удаляем несжатый файл
        os.remove(backup_file)
        
        compressed_size = os.path.getsize(backup_file_gz)
        compressed_size_mb = compressed_size / (1024 * 1024)
        compression_ratio = (1 - compressed_size / size) * 100
        print(f"✅ Бэкап сжат: {compressed_size_mb:.2f} MB (экономия: {compression_ratio:.1f}%)")
        
        # Создаём символическую ссылку на последний бэкап
        latest_link = os.path.join(BACKUP_DIR, "production_latest.db.gz")
        if os.path.exists(latest_link):
            os.remove(latest_link)
        os.symlink(os.path.basename(backup_file_gz), latest_link)
        print("✅ Обновлена ссылка: production_latest.db.gz")
        
        # Удаляем старые бэкапы
        cleanup_old_backups()
        
        # Проверяем целостность
        verify_backup(backup_file_gz)
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка создания бэкапа: {e}")
        return False

def cleanup_old_backups():
    """Удаляет старые бэкапы."""
    
    print(f"\n🧹 Очистка старых бэкапов (старше {RETENTION_DAYS} дней)...")
    
    cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
    deleted_count = 0
    
    for backup_file in Path(BACKUP_DIR).glob("production_*.db.gz"):
        if backup_file.is_symlink():
            continue
        
        file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
        if file_time < cutoff_date:
            backup_file.unlink()
            deleted_count += 1
    
    remaining = len(list(Path(BACKUP_DIR).glob("production_*.db.gz"))) - 1  # -1 для symlink
    print(f"✅ Удалено: {deleted_count}, осталось: {remaining}")
    
    # Статистика
    total_size = sum(f.stat().st_size for f in Path(BACKUP_DIR).glob("production_*.db.gz") if not f.is_symlink())
    total_size_mb = total_size / (1024 * 1024)
    print(f"\n📊 Статистика бэкапов:")
    print(f"   Всего бэкапов: {remaining}")
    print(f"   Общий размер: {total_size_mb:.2f} MB")

def verify_backup(backup_file_gz):
    """Проверяет целостность бэкапа."""
    
    print(f"\n🔍 Проверка целостности бэкапа...")
    
    try:
        # Распаковываем во временный файл
        temp_file = "/tmp/test_backup.db"
        with gzip.open(backup_file_gz, 'rb') as f_in:
            with open(temp_file, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        
        # Проверяем целостность
        conn = sqlite3.connect(temp_file)
        cursor = conn.cursor()
        cursor.execute("PRAGMA integrity_check")
        result = cursor.fetchone()[0]
        conn.close()
        
        # Удаляем временный файл
        os.remove(temp_file)
        
        if result == "ok":
            print("✅ Целостность бэкапа подтверждена")
            return True
        else:
            print(f"❌ Ошибка: Бэкап повреждён! {result}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка проверки: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("💾 Резервное копирование БД Zachot")
    print("=" * 60)
    print()
    
    if create_backup():
        print()
        print("=" * 60)
        print("✅ Бэкап завершён успешно!")
        print("=" * 60)
        exit(0)
    else:
        print()
        print("=" * 60)
        print("❌ Бэкап не удался!")
        print("=" * 60)
        exit(1)
