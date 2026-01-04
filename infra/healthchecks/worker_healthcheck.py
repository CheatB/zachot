#!/usr/bin/env python3
"""
Healthcheck скрипт для zachot-worker (Dramatiq).

Проверяет:
- Python процессы под пользователем zachot
- Активные процессы dramatiq
- Доступность Redis (ping)
- Существование очереди default (llen)

Exit codes:
- 0: OK - все проверки пройдены
- 1: DEGRADED - частичные проблемы, но сервис работает
- 2: DOWN - критические проблемы, сервис не работает
"""

import os
import sys
import subprocess
from urllib.parse import urlparse

try:
    import redis
except ImportError:
    print("ERROR: redis module not found. Install with: pip install redis", file=sys.stderr)
    sys.exit(2)


def check_python_processes() -> bool:
    """Проверяет наличие Python процессов под пользователем zachot."""
    try:
        result = subprocess.run(
            ["ps", "aux"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            return False
        
        lines = result.stdout.split("\n")
        for line in lines:
            if "zachot" in line and "python" in line.lower():
                return True
        return False
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        return False


def check_dramatiq_processes() -> bool:
    """Проверяет наличие активных процессов dramatiq."""
    try:
        result = subprocess.run(
            ["ps", "aux"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            return False
        
        lines = result.stdout.split("\n")
        for line in lines:
            if "dramatiq" in line.lower() and "apps.worker.actors" in line:
                return True
        return False
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        return False


def get_redis_client():
    """Создает и возвращает Redis клиент из REDIS_URL."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    try:
        parsed = urlparse(redis_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 6379
        db = int(parsed.path.lstrip("/")) if parsed.path else 0
        
        # Парсим пароль из URL если есть
        password = parsed.password
        
        client = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            socket_connect_timeout=5,
            socket_timeout=5,
            decode_responses=False
        )
        return client
    except Exception as e:
        print(f"ERROR: Failed to create Redis client: {e}", file=sys.stderr)
        return None


def check_redis_connection(client: redis.Redis) -> bool:
    """Проверяет доступность Redis через ping."""
    try:
        client.ping()
        return True
    except Exception:
        return False


def check_default_queue(client: redis.Redis) -> bool:
    """Проверяет существование очереди default через llen."""
    try:
        # Dramatiq использует ключи вида: dramatiq:queue:default
        queue_key = "dramatiq:queue:default"
        # Просто проверяем, что ключ существует или можем выполнить команду
        # llen вернет 0 если очередь пуста, но не упадет если ключ не существует
        client.llen(queue_key)
        return True
    except Exception:
        return False


def main():
    """Основная функция healthcheck."""
    status_ok = True
    status_degraded = False
    
    # Проверка процессов Python под zachot
    if not check_python_processes():
        print("WARNING: No Python processes found for user zachot", file=sys.stderr)
        status_degraded = True
    
    # Проверка процессов dramatiq
    if not check_dramatiq_processes():
        print("WARNING: No active dramatiq processes found", file=sys.stderr)
        status_degraded = True
    
    # Проверка Redis
    client = get_redis_client()
    if client is None:
        print("ERROR: Cannot create Redis client", file=sys.stderr)
        sys.exit(2)
    
    if not check_redis_connection(client):
        print("ERROR: Redis is not accessible (ping failed)", file=sys.stderr)
        sys.exit(2)
    
    if not check_default_queue(client):
        print("ERROR: Default queue is not accessible", file=sys.stderr)
        sys.exit(2)
    
    # Если все критичные проверки прошли, но есть предупреждения
    if status_degraded:
        print("WARNING: Service is degraded but operational", file=sys.stderr)
        sys.exit(1)
    
    # Все проверки пройдены
    print("OK: All health checks passed")
    sys.exit(0)


if __name__ == "__main__":
    main()


