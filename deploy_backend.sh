#!/bin/bash
set -e

echo "🔄 Backend Deployment Started"
echo "================================"

# 1. Применяем миграции БД
echo "📊 Applying database migrations..."
cd /home/deploy/zachot
export PYTHONPATH=/home/deploy/zachot
alembic upgrade head

# 2. Проверяем, что API может стартовать (dry-run)
echo "🧪 Testing API startup..."
timeout 10 python3 -c "
import sys
sys.path.append('.')
from apps.api.main import app
print('✅ API imports successfully')
" || (echo "❌ API startup test failed" && exit 1)

# 3. Перезапускаем сервисы
echo "🔄 Restarting services..."
sudo systemctl restart zachot-api
sudo systemctl restart zachot-worker

# 4. Ждем запуска
echo "⏳ Waiting for services to start..."
sleep 5

# 5. Проверяем health
echo "🏥 Checking health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
echo "Health response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ Backend deployed successfully!"
    echo "================================"
    exit 0
else
    echo "❌ Health check failed!"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi
