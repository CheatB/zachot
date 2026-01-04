#!/usr/bin/env python3
"""
Простая проверка доступности Redis перед запуском worker.

Используется в systemd ExecCondition для предотвращения запуска worker
если Redis недоступен.

Exit codes:
- 0: Redis доступен
- 1: Redis недоступен
"""

import os
import sys
from urllib.parse import urlparse

try:
    import redis
except ImportError:
    print("ERROR: redis module not found", file=sys.stderr)
    sys.exit(1)


def main():
    """Проверяет доступность Redis."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    try:
        parsed = urlparse(redis_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 6379
        db = int(parsed.path.lstrip("/")) if parsed.path else 0
        password = parsed.password
        
        client = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            socket_connect_timeout=3,
            socket_timeout=3
        )
        
        client.ping()
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: Redis is not accessible: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()


