"""
Хранилище для Generation на базе PostgreSQL.
"""

import asyncio
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from packages.core_domain import Generation
from .database import SessionLocal, GenerationDB, User as UserDB


class SQLGenerationStore:
    """
    SQL хранилище для Generation.
    """
    
    def __init__(self):
        # Pub/sub для SSE: generation_id -> list[asyncio.Queue]
        self._subscribers: dict[UUID, list[asyncio.Queue]] = {}
    
    def create(self, generation: Generation) -> Generation:
        with SessionLocal() as session:
            db_gen = GenerationDB(
                id=generation.id,
                user_id=generation.user_id,
                module=generation.module.value,
                status=generation.status.value,
                title=generation.title,
                work_type=generation.work_type,
                complexity_level=generation.complexity_level,
                humanity_level=generation.humanity_level,
                input_payload=generation.input_payload,
                settings_payload=generation.settings_payload,
                usage_metadata=generation.usage_metadata,
                created_at=generation.created_at,
                updated_at=generation.updated_at
            )
            session.add(db_gen)
            
            # Декремент лимита у пользователя (только если не DRAFT)
            if db_gen.status != "DRAFT":
                user = session.query(UserDB).filter(UserDB.id == generation.user_id).first()
                if user:
                    user.generations_used += 1
            
            session.commit()
            return generation
    
    def get(self, generation_id: UUID) -> Optional[Generation]:
        with SessionLocal() as session:
            # Очищаем кеш сессии, чтобы получить свежие данные из БД
            session.expire_all()
            db_gen = session.query(GenerationDB).filter(GenerationDB.id == generation_id).first()
            if not db_gen:
                return None
            return self._map_to_domain(db_gen)
    
    def get_all(self) -> List[Generation]:
        with SessionLocal() as session:
            db_gens = session.query(GenerationDB).all()
            return [self._map_to_domain(g) for g in db_gens]

    def get_all_for_user(self, user_id: UUID) -> List[Generation]:
        with SessionLocal() as session:
            db_gens = session.query(GenerationDB).filter(
                GenerationDB.user_id == user_id
            ).order_by(
                GenerationDB.updated_at.desc()  # Сортировка от новых к старым
            ).all()
            return [self._map_to_domain(g) for g in db_gens]
    
    def update(self, generation_id: UUID, **updates) -> Generation:
        import logging
        logger = logging.getLogger(__name__)
        
        with SessionLocal() as session:
            db_gen = session.query(GenerationDB).filter(GenerationDB.id == generation_id).first()
            if not db_gen:
                raise ValueError(f"Generation with id {generation_id} not found")
            
            old_status = db_gen.status
            
            # Логируем обновление result_content
            if 'result_content' in updates:
                content_length = len(updates['result_content']) if updates['result_content'] else 0
                logger.info(f"Updating generation {generation_id}: result_content length={content_length}")
            
            for key, value in updates.items():
                if hasattr(db_gen, key):
                    setattr(db_gen, key, value)
            
            # Если статус изменился с DRAFT на что-то другое, уменьшаем лимит
            if old_status == "DRAFT" and db_gen.status != "DRAFT":
                user = session.query(UserDB).filter(UserDB.id == db_gen.user_id).first()
                if user:
                    user.generations_used += 1

            db_gen.updated_at = datetime.utcnow()
            session.commit()
            
            # Проверяем, что сохранилось
            if 'result_content' in updates:
                saved_length = len(db_gen.result_content) if db_gen.result_content else 0
                logger.info(f"After commit, generation {generation_id}: result_content length={saved_length}")
            
            updated_gen = self._map_to_domain(db_gen)
            self._notify_subscribers(updated_gen)
            return updated_gen
    
    def save(self, generation: Generation) -> Generation:
        # Пакетное сохранение для state transitions
        return self.update(generation.id, 
                           status=generation.status.value,
                           input_payload=generation.input_payload,
                           settings_payload=generation.settings_payload,
                           usage_metadata=generation.usage_metadata)

    def _map_to_domain(self, db_gen: GenerationDB) -> Generation:
        return Generation(
            id=db_gen.id,
            user_id=db_gen.user_id,
            module=db_gen.module,
            status=db_gen.status,
            title=db_gen.title,
            work_type=db_gen.work_type,
            complexity_level=db_gen.complexity_level,
            humanity_level=db_gen.humanity_level,
            created_at=db_gen.created_at,
            updated_at=db_gen.updated_at,
            input_payload=db_gen.input_payload,
            settings_payload=db_gen.settings_payload,
            result_content=db_gen.result_content,
            usage_metadata=db_gen.usage_metadata or []
        )

    def _notify_subscribers(self, generation: Generation):
        if generation.id in self._subscribers:
            event_data = {
                "id": str(generation.id),
                "status": generation.status.value,
                "updated_at": generation.updated_at.isoformat(),
            }
            for queue in self._subscribers[generation.id]:
                try:
                    queue.put_nowait(event_data)
                except asyncio.QueueFull:
                    pass

    def subscribe(self, generation_id: UUID) -> asyncio.Queue:
        if generation_id not in self._subscribers:
            self._subscribers[generation_id] = []
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers[generation_id].append(queue)
        return queue
    
    def unsubscribe(self, generation_id: UUID, queue: asyncio.Queue) -> None:
        if generation_id in self._subscribers:
            try:
                self._subscribers[generation_id].remove(queue)
            except ValueError:
                pass
            if not self._subscribers[generation_id]:
                del self._subscribers[generation_id]

    def clear(self) -> None:
        """
        Очищает хранилище (для тестирования).
        
        Удаляет все записи из таблиц в правильном порядке (с учётом foreign keys).
        """
        from packages.database.src.models import Payment, AuthToken, CreditTransaction, Subscription
        
        with SessionLocal() as session:
            # Удаляем в порядке зависимостей: сначала дочерние таблицы, потом родительские
            # 1. Таблицы, зависящие от generations и payments
            session.query(CreditTransaction).delete()
            session.query(Subscription).delete()
            
            # 2. Таблицы, зависящие от users
            session.query(GenerationDB).delete()
            session.query(Payment).delete()
            session.query(AuthToken).delete()
            
            # 3. Родительская таблица
            session.query(UserDB).delete()
            
            session.commit()
        self._subscribers.clear()

# Глобальный экземпляр хранилища
generation_store = SQLGenerationStore()
