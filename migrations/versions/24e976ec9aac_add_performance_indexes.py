"""add_performance_indexes

Revision ID: 24e976ec9aac
Revises: ae46a7fe79d0
Create Date: 2026-01-16 15:30:59.602783

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24e976ec9aac'
down_revision: Union[str, None] = 'ae46a7fe79d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Добавляем индексы для критичных запросов.
    
    Эти индексы ускорят:
    - Получение генераций пользователя (user_id)
    - Фильтрацию по статусу (status)
    - Сортировку по дате (updated_at, created_at)
    - Комбинированные запросы (user_id + status)
    """
    
    # Индексы для таблицы generations
    op.create_index('ix_generations_user_id', 'generations', ['user_id'])
    op.create_index('ix_generations_status', 'generations', ['status'])
    op.create_index('ix_generations_updated_at', 'generations', ['updated_at'])
    op.create_index('ix_generations_created_at', 'generations', ['created_at'])
    op.create_index('ix_generations_user_status', 'generations', ['user_id', 'status'])
    
    # Индексы для таблицы payments
    op.create_index('ix_payments_user_id', 'payments', ['user_id'])
    op.create_index('ix_payments_status', 'payments', ['status'])
    op.create_index('ix_payments_created_at', 'payments', ['created_at'])
    
    # Индексы для таблицы auth_tokens
    op.create_index('ix_auth_tokens_user_id', 'auth_tokens', ['user_id'])
    
    # Индексы для таблицы credit_transactions
    op.create_index('ix_credit_transactions_user_id', 'credit_transactions', ['user_id'])
    op.create_index('ix_credit_transactions_created_at', 'credit_transactions', ['created_at'])
    
    # Индексы для таблицы subscriptions
    op.create_index('ix_subscriptions_user_id', 'subscriptions', ['user_id'])
    op.create_index('ix_subscriptions_status', 'subscriptions', ['status'])


def downgrade() -> None:
    """Удаляем индексы при откате миграции."""
    
    # Удаляем индексы для subscriptions
    op.drop_index('ix_subscriptions_status', table_name='subscriptions')
    op.drop_index('ix_subscriptions_user_id', table_name='subscriptions')
    
    # Удаляем индексы для credit_transactions
    op.drop_index('ix_credit_transactions_created_at', table_name='credit_transactions')
    op.drop_index('ix_credit_transactions_user_id', table_name='credit_transactions')
    
    # Удаляем индексы для auth_tokens
    op.drop_index('ix_auth_tokens_user_id', table_name='auth_tokens')
    
    # Удаляем индексы для payments
    op.drop_index('ix_payments_created_at', table_name='payments')
    op.drop_index('ix_payments_status', table_name='payments')
    op.drop_index('ix_payments_user_id', table_name='payments')
    
    # Удаляем индексы для generations
    op.drop_index('ix_generations_user_status', table_name='generations')
    op.drop_index('ix_generations_created_at', table_name='generations')
    op.drop_index('ix_generations_updated_at', table_name='generations')
    op.drop_index('ix_generations_status', table_name='generations')
    op.drop_index('ix_generations_user_id', table_name='generations')
