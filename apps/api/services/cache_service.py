"""
Сервис кэширования для AI ответов и других данных.
"""

import json
import hashlib
import logging
from typing import Any, Optional, Callable
from functools import wraps
import redis.asyncio as aioredis

logger = logging.getLogger(__name__)


class CacheService:
    """Сервис для кэширования данных в Redis."""
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self._enabled = True
        
    async def connect(self):
        """Подключение к Redis."""
        try:
            self.redis = await aioredis.from_url(
                "redis://localhost:6379",
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
            )
            await self.redis.ping()
            logger.info("✅ Connected to Redis")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            self._enabled = False
    
    async def disconnect(self):
        """Отключение от Redis."""
        if self.redis:
            try:
                await self.redis.aclose()
            except Exception as e:
                logger.error(f"Error disconnecting from Redis: {e}")
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Генерирует уникальный ключ для кэша."""
        data = json.dumps({
            "args": args,
            "kwargs": sorted(kwargs.items())
        }, sort_keys=True, ensure_ascii=False)
        
        hash_obj = hashlib.sha256(data.encode())
        hash_str = hash_obj.hexdigest()[:16]
        
        return f"{prefix}:{hash_str}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Получает значение из кэша."""
        if not self._enabled or not self.redis:
            return None
        
        try:
            value = await self.redis.get(key)
            if value:
                logger.debug(f"✅ Cache HIT: {key}")
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting from cache: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Сохраняет значение в кэш."""
        if not self._enabled or not self.redis:
            return False
        
        try:
            serialized = json.dumps(value, ensure_ascii=False)
            await self.redis.setex(key, ttl, serialized)
            logger.debug(f"💾 Cached: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Удаляет значение из кэша."""
        if not self._enabled or not self.redis:
            return False
        
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            return False
    
    def cached(self, prefix: str, ttl: int = 3600):
        """Декоратор для кэширования результатов функций."""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                key = self._generate_key(prefix, *args, **kwargs)
                
                cached_value = await self.get(key)
                if cached_value is not None:
                    return cached_value
                
                result = await func(*args, **kwargs)
                await self.set(key, result, ttl)
                
                return result
            return wrapper
        return decorator


cache_service = CacheService()
