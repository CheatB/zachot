#!/bin/bash
#
# Скрипт резервного копирования базы данных Zachot
# Создаёт бэкапы с ротацией (хранит последние 30 дней)
#

set -e

# Конфигурация
DB_PATH="/home/deploy/zachot/production.db"
BACKUP_DIR="/home/deploy/zachot/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/production_${TIMESTAMP}.db"
LATEST_LINK="${BACKUP_DIR}/production_latest.db"

# Создаём директорию для бэкапов если её нет
mkdir -p "$BACKUP_DIR"

# Проверяем существование БД
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Ошибка: БД не найдена: $DB_PATH"
    exit 1
fi

echo "🔄 Создание бэкапа БД..."
echo "   Источник: $DB_PATH"
echo "   Назначение: $BACKUP_FILE"

# Создаём бэкап с помощью SQLite
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Проверяем успешность
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Бэкап создан успешно: $SIZE"
    
    # Создаём символическую ссылку на последний бэкап
    ln -sf "$(basename "$BACKUP_FILE")" "$LATEST_LINK"
    echo "✅ Обновлена ссылка: production_latest.db"
    
    # Сжимаем бэкап
    gzip -f "$BACKUP_FILE"
    echo "✅ Бэкап сжат: ${BACKUP_FILE}.gz"
    
    # Удаляем старые бэкапы (старше 30 дней)
    find "$BACKUP_DIR" -name "production_*.db.gz" -type f -mtime +30 -delete
    REMAINING=$(find "$BACKUP_DIR" -name "production_*.db.gz" -type f | wc -l)
    echo "✅ Очистка завершена. Осталось бэкапов: $REMAINING"
    
    # Статистика
    echo ""
    echo "📊 Статистика бэкапов:"
    echo "   Всего бэкапов: $REMAINING"
    echo "   Общий размер: $(du -sh "$BACKUP_DIR" | cut -f1)"
    
else
    echo "❌ Ошибка: Бэкап не создан"
    exit 1
fi

# Проверяем целостность бэкапа
echo ""
echo "🔍 Проверка целостности бэкапа..."
gunzip -c "${BACKUP_FILE}.gz" > /tmp/test_backup.db
if sqlite3 /tmp/test_backup.db "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "✅ Целостность бэкапа подтверждена"
    rm /tmp/test_backup.db
else
    echo "❌ Ошибка: Бэкап повреждён!"
    rm /tmp/test_backup.db
    exit 1
fi

echo ""
echo "=" * 60
echo "✅ Бэкап завершён успешно!"
echo "=" * 60
