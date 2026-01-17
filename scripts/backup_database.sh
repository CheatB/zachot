#!/bin/bash
#
# Скрипт для автоматического бэкапа PostgreSQL базы данных
#

# Настройки
DB_NAME="zachot"
DB_USER="marka"
DB_HOST="localhost"
DB_PORT="5433"
BACKUP_DIR="/var/backups/zachot"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/zachot_${DATE}.sql.gz"

# Создаём директорию для бэкапов, если её нет
mkdir -p "$BACKUP_DIR"

# Экспортируем пароль для pg_dump
export PGPASSWORD="marka_pass"

# Создаём бэкап
echo "Creating backup: $BACKUP_FILE"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    
    # Удаляем старые бэкапы (старше 7 дней)
    find "$BACKUP_DIR" -name "zachot_*.sql.gz" -mtime +7 -delete
    echo "Old backups cleaned up"
else
    echo "Backup failed!"
    exit 1
fi

# Очищаем переменную с паролем
unset PGPASSWORD
