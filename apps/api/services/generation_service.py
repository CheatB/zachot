import logging
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import HTTPException, status

from ..database import SessionLocal, User as UserDB
from ..storage import generation_store
from packages.core_domain import Generation, GenerationStateMachine
from packages.core_domain.enums import GenerationStatus
from packages.billing.credits import get_credit_cost, format_credits_text

logger = logging.getLogger(__name__)

class GenerationService:
    @staticmethod
    async def create_draft(user: UserDB, module: str, input_payload: dict, 
                           work_type: str = None, complexity: str = "student", 
                           humanity: str = "medium", settings: dict = None) -> Generation:
        # 1. Проверяем баланс кредитов
        work_type_val = work_type or "other"
        required_credits = get_credit_cost(work_type_val)
        
        with SessionLocal() as session:
            db_user = session.query(UserDB).filter(UserDB.id == user.id).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")
                
            credits_balance = db_user.credits_balance or 0
            
            if credits_balance < required_credits:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Недостаточно кредитов. Требуется {format_credits_text(required_credits)}, "
                           f"доступно: {format_credits_text(credits_balance)}."
                )

            # 2. Создаем объект генерации
            generation_id = uuid4()
            now = datetime.now()
            generation = Generation(
                id=generation_id,
                user_id=user.id,
                module=module,
                status=GenerationStatus.DRAFT,
                title=input_payload.get("topic") or input_payload.get("input") or "Без названия",
                work_type=work_type,
                complexity_level=complexity,
                humanity_level=humanity,
                created_at=now,
                updated_at=now,
                input_payload=input_payload,
                settings_payload=settings or {},
                usage_metadata=[],
            )
            
            saved_generation = generation_store.create(generation)
            
            # 3. Списываем кредиты
            db_user.credits_balance -= required_credits
            db_user.credits_used = (db_user.credits_used or 0) + required_credits
            db_user.generations_used = (db_user.generations_used or 0) + 1
            session.commit()
            
            logger.info(f"Created generation {generation_id} for user {user.id}. Credits deducted: {required_credits}")
            return saved_generation

    @staticmethod
    async def update_draft(generation_id: UUID, user_id: UUID, 
                           input_payload: dict = None, settings_payload: dict = None) -> Generation:
        generation = generation_store.get(generation_id)
        if generation is None or generation.user_id != user_id:
            raise HTTPException(status_code=404, detail="Generation not found")
        if generation.status != GenerationStatus.DRAFT:
            raise HTTPException(status_code=409, detail="Only DRAFT generations can be updated.")
        
        update_data = {}
        if input_payload is not None: update_data["input_payload"] = input_payload
        if settings_payload is not None: update_data["settings_payload"] = settings_payload
        
        if not update_data:
            return generation
            
        return generation_store.update(generation_id, **update_data)

    @staticmethod
    async def perform_action(generation_id: UUID, user_id: UUID, action: str) -> Generation:
        generation = generation_store.get(generation_id)
        if generation is None or generation.user_id != user_id:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        target_status = None
        if action == "next":
            if generation.status != GenerationStatus.DRAFT:
                raise HTTPException(status_code=409, detail="Must be in DRAFT status")
            target_status = GenerationStatus.RUNNING
        elif action == "confirm":
            if generation.status != GenerationStatus.WAITING_USER:
                raise HTTPException(status_code=409, detail="Must be in WAITING_USER status")
            target_status = GenerationStatus.RUNNING
        elif action == "cancel":
            target_status = GenerationStatus.CANCELED
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
        
        updated_generation = GenerationStateMachine.transition(generation, target_status)
        return generation_store.save(updated_generation)

generation_service = GenerationService()



