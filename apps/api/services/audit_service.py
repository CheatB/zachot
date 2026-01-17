"""
Сервис для audit logging критичных операций.
"""

import logging
import json
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from packages.database.src.models import AuditLog
from apps.api.database import SessionLocal

logger = logging.getLogger(__name__)


class AuditService:
    """Сервис для логирования критичных операций."""
    
    @staticmethod
    def log_event(
        event_type: str,
        action: str,
        user_id: Optional[UUID] = None,
        before_data: Optional[Dict[str, Any]] = None,
        after_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        target_user_id: Optional[UUID] = None,
        target_generation_id: Optional[UUID] = None,
        target_payment_id: Optional[UUID] = None
    ) -> bool:
        """
        Логирует событие в audit trail.
        
        Args:
            event_type: Тип события (USER_ROLE_CHANGE, USER_CREDITS_CHANGE, etc.)
            action: Описание действия
            user_id: ID пользователя, совершившего действие
            before_data: Данные до изменения
            after_data: Данные после изменения
            ip_address: IP адрес
            user_agent: User agent
            target_user_id: ID целевого пользователя (если применимо)
            target_generation_id: ID целевой генерации (если применимо)
            target_payment_id: ID целевого платежа (если применимо)
        
        Returns:
            bool: True если успешно, False если ошибка
        """
        
        try:
            with SessionLocal() as session:
                audit_log = AuditLog(
                    user_id=user_id,
                    event_type=event_type,
                    action=action,
                    before_data=json.dumps(before_data) if before_data else None,
                    after_data=json.dumps(after_data) if after_data else None,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    target_user_id=target_user_id,
                    target_generation_id=target_generation_id,
                    target_payment_id=target_payment_id,
                    created_at=datetime.utcnow()
                )
                
                session.add(audit_log)
                session.commit()
                
                logger.info(
                    f"Audit log created: {event_type} - {action} "
                    f"(user_id={user_id}, target_user_id={target_user_id})"
                )
                
                return True
                
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}", exc_info=True)
            return False
    
    @staticmethod
    def log_role_change(
        admin_user_id: UUID,
        target_user_id: UUID,
        old_role: str,
        new_role: str,
        ip_address: Optional[str] = None
    ):
        """Логирует изменение роли пользователя."""
        
        return AuditService.log_event(
            event_type="USER_ROLE_CHANGE",
            action=f"Changed user role from '{old_role}' to '{new_role}'",
            user_id=admin_user_id,
            before_data={"role": old_role},
            after_data={"role": new_role},
            ip_address=ip_address,
            target_user_id=target_user_id
        )
    
    @staticmethod
    def log_credits_change(
        user_id: UUID,
        target_user_id: UUID,
        old_balance: int,
        new_balance: int,
        reason: str,
        ip_address: Optional[str] = None
    ):
        """Логирует изменение кредитов пользователя."""
        
        return AuditService.log_event(
            event_type="USER_CREDITS_CHANGE",
            action=f"Changed credits from {old_balance} to {new_balance}. Reason: {reason}",
            user_id=user_id,
            before_data={"credits_balance": old_balance},
            after_data={"credits_balance": new_balance},
            ip_address=ip_address,
            target_user_id=target_user_id
        )
    
    @staticmethod
    def log_user_login(
        user_id: UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Логирует вход пользователя."""
        
        return AuditService.log_event(
            event_type="USER_LOGIN",
            action="User logged in",
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_admin_action(
        admin_user_id: UUID,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        """Логирует административное действие."""
        
        return AuditService.log_event(
            event_type="ADMIN_ACTION",
            action=action,
            user_id=admin_user_id,
            after_data=details,
            ip_address=ip_address
        )
    
    @staticmethod
    def log_generation_create(
        user_id: UUID,
        generation_id: UUID,
        work_type: str
    ):
        """Логирует создание генерации."""
        
        return AuditService.log_event(
            event_type="GENERATION_CREATE",
            action=f"Created generation: {work_type}",
            user_id=user_id,
            target_generation_id=generation_id,
            after_data={"work_type": work_type}
        )
    
    @staticmethod
    def log_generation_delete(
        user_id: UUID,
        generation_id: UUID
    ):
        """Логирует удаление генерации."""
        
        return AuditService.log_event(
            event_type="GENERATION_DELETE",
            action="Deleted generation",
            user_id=user_id,
            target_generation_id=generation_id
        )
    
    @staticmethod
    def log_payment_confirm(
        user_id: UUID,
        payment_id: UUID,
        amount: int
    ):
        """Логирует подтверждение платежа."""
        
        return AuditService.log_event(
            event_type="PAYMENT_CONFIRM",
            action=f"Payment confirmed: {amount / 100:.2f} RUB",
            user_id=user_id,
            target_payment_id=payment_id,
            after_data={"amount": amount}
        )


# Глобальный экземпляр
audit_service = AuditService()
