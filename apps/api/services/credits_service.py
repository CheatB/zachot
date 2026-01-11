"""
Сервис управления кредитами пользователей.

Отвечает за:
- Проверку баланса перед генерацией
- Списание кредитов при создании генерации
- Начисление кредитов при покупке подписки
- Логирование транзакций
"""

import logging
from datetime import datetime
from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from packages.billing.credits import (
    get_credit_cost,
    get_credits_for_subscription,
    get_work_type_label,
    format_credits_text,
)
from packages.database.src.models import User, CreditTransaction, Generation

logger = logging.getLogger(__name__)


class InsufficientCreditsError(Exception):
    """Исключение при недостатке кредитов."""
    
    def __init__(self, required: int, available: int, work_type: str):
        self.required = required
        self.available = available
        self.work_type = work_type
        super().__init__(
            f"Недостаточно кредитов для {get_work_type_label(work_type)}. "
            f"Требуется: {format_credits_text(required)}, доступно: {format_credits_text(available)}"
        )


class CreditsService:
    """Сервис управления кредитами."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_balance(self, user_id: UUID) -> int:
        """
        Получает текущий баланс кредитов пользователя.
        
        Args:
            user_id: ID пользователя
            
        Returns:
            Количество доступных кредитов
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"[Credits] User {user_id} not found")
            return 0
        return user.credits_balance or 0
    
    def check_can_generate(self, user_id: UUID, work_type: str) -> Tuple[bool, int, int]:
        """
        Проверяет, достаточно ли кредитов для генерации.
        
        Args:
            user_id: ID пользователя
            work_type: Тип работы
            
        Returns:
            Tuple (can_generate, required_credits, available_credits)
        """
        required = get_credit_cost(work_type)
        available = self.get_balance(user_id)
        can_generate = available >= required
        
        logger.info(
            f"[Credits] Check for user {user_id}: "
            f"work_type={work_type}, required={required}, available={available}, can={can_generate}"
        )
        
        return can_generate, required, available
    
    def deduct_credits(
        self, 
        user_id: UUID, 
        work_type: str, 
        generation_id: Optional[UUID] = None
    ) -> int:
        """
        Списывает кредиты за генерацию.
        
        Args:
            user_id: ID пользователя
            work_type: Тип работы
            generation_id: ID генерации (опционально)
            
        Returns:
            Новый баланс после списания
            
        Raises:
            InsufficientCreditsError: Если недостаточно кредитов
        """
        can_generate, required, available = self.check_can_generate(user_id, work_type)
        
        if not can_generate:
            raise InsufficientCreditsError(required, available, work_type)
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Списываем кредиты
        new_balance = user.credits_balance - required
        user.credits_balance = new_balance
        user.credits_used = (user.credits_used or 0) + required
        
        # Обновляем legacy поля для совместимости
        user.generations_used = (user.generations_used or 0) + 1
        
        # Создаём запись транзакции
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-required,
            balance_after=new_balance,
            transaction_type="DEBIT",
            reason=work_type,
            generation_id=generation_id,
        )
        self.db.add(transaction)
        self.db.commit()
        
        logger.info(
            f"[Credits] Deducted {required} credits from user {user_id} for {work_type}. "
            f"New balance: {new_balance}"
        )
        
        return new_balance
    
    def add_credits(
        self, 
        user_id: UUID, 
        amount: int, 
        reason: str,
        transaction_type: str = "CREDIT"
    ) -> int:
        """
        Начисляет кредиты пользователю.
        
        Args:
            user_id: ID пользователя
            amount: Количество кредитов для начисления
            reason: Причина начисления (например, "subscription_month")
            transaction_type: Тип транзакции (CREDIT, REFUND, BONUS)
            
        Returns:
            Новый баланс после начисления
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        new_balance = (user.credits_balance or 0) + amount
        user.credits_balance = new_balance
        
        # Создаём запись транзакции
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,
            balance_after=new_balance,
            transaction_type=transaction_type,
            reason=reason,
        )
        self.db.add(transaction)
        self.db.commit()
        
        logger.info(
            f"[Credits] Added {amount} credits to user {user_id} ({reason}). "
            f"New balance: {new_balance}"
        )
        
        return new_balance
    
    def grant_subscription_credits(self, user_id: UUID, period: str) -> int:
        """
        Начисляет кредиты при покупке/продлении подписки.
        
        Args:
            user_id: ID пользователя
            period: Период подписки (month, quarter, year)
            
        Returns:
            Новый баланс после начисления
        """
        credits_to_add = get_credits_for_subscription(period)
        return self.add_credits(
            user_id=user_id,
            amount=credits_to_add,
            reason=f"subscription_{period}",
            transaction_type="CREDIT"
        )
    
    def refund_credits(self, user_id: UUID, generation_id: UUID) -> Optional[int]:
        """
        Возвращает кредиты за отменённую генерацию.
        
        Args:
            user_id: ID пользователя
            generation_id: ID отменённой генерации
            
        Returns:
            Новый баланс или None, если транзакция не найдена
        """
        # Находим оригинальную транзакцию списания
        original_tx = self.db.query(CreditTransaction).filter(
            CreditTransaction.generation_id == generation_id,
            CreditTransaction.transaction_type == "DEBIT"
        ).first()
        
        if not original_tx:
            logger.warning(f"[Credits] No debit transaction found for generation {generation_id}")
            return None
        
        # Возвращаем кредиты
        refund_amount = abs(original_tx.amount)
        return self.add_credits(
            user_id=user_id,
            amount=refund_amount,
            reason=f"refund_{original_tx.reason}",
            transaction_type="REFUND"
        )
    
    def get_transaction_history(
        self, 
        user_id: UUID, 
        limit: int = 20
    ) -> list:
        """
        Получает историю транзакций пользователя.
        
        Args:
            user_id: ID пользователя
            limit: Максимальное количество записей
            
        Returns:
            Список транзакций
        """
        transactions = self.db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id
        ).order_by(
            CreditTransaction.created_at.desc()
        ).limit(limit).all()
        
        return transactions

