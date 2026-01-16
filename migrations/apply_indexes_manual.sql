-- Миграция: Добавление индексов производительности
-- Дата: 2026-01-16
-- Описание: Индексы для ускорения критичных запросов

-- Индексы для таблицы generations
CREATE INDEX IF NOT EXISTS ix_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS ix_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS ix_generations_updated_at ON generations(updated_at);
CREATE INDEX IF NOT EXISTS ix_generations_created_at ON generations(created_at);
CREATE INDEX IF NOT EXISTS ix_generations_user_status ON generations(user_id, status);

-- Индексы для таблицы payments
CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS ix_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS ix_payments_created_at ON payments(created_at);

-- Индексы для таблицы auth_tokens
CREATE INDEX IF NOT EXISTS ix_auth_tokens_user_id ON auth_tokens(user_id);

-- Индексы для таблицы credit_transactions
CREATE INDEX IF NOT EXISTS ix_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS ix_credit_transactions_created_at ON credit_transactions(created_at);

-- Индексы для таблицы subscriptions
CREATE INDEX IF NOT EXISTS ix_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS ix_subscriptions_status ON subscriptions(status);

-- Проверка созданных индексов
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
