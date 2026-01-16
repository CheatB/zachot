"""
Prometheus метрики для мониторинга системы.

Отслеживает:
- Количество генераций по типам и статусам
- Длительность операций
- Использование AI токенов
- Активные задачи
- Стоимость AI операций
"""

from prometheus_client import Counter, Histogram, Gauge, Info
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# ГЕНЕРАЦИИ
# ============================================================================

generation_requests_total = Counter(
    'generation_requests_total',
    'Общее количество запросов на генерацию',
    ['work_type', 'status', 'module']
)

generation_duration_seconds = Histogram(
    'generation_duration_seconds',
    'Длительность генерации по этапам',
    ['step', 'work_type'],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600, 1200]  # от 1 сек до 20 минут
)

# ============================================================================
# AI / LLM МЕТРИКИ
# ============================================================================

ai_tokens_used_total = Counter(
    'ai_tokens_used_total',
    'Общее количество использованных AI токенов',
    ['model', 'step', 'work_type']
)

ai_requests_total = Counter(
    'ai_requests_total',
    'Общее количество запросов к AI',
    ['model', 'step', 'status']  # status: success, error, timeout
)

ai_cost_usd_total = Counter(
    'ai_cost_usd_total',
    'Общая стоимость AI операций в USD',
    ['model', 'step']
)

ai_request_duration_seconds = Histogram(
    'ai_request_duration_seconds',
    'Длительность запросов к AI',
    ['model', 'step'],
    buckets=[0.5, 1, 2, 5, 10, 20, 30, 60]
)

# ============================================================================
# АКТИВНЫЕ ЗАДАЧИ
# ============================================================================

active_generations = Gauge(
    'active_generations',
    'Количество активных генераций',
    ['module']
)

active_jobs = Gauge(
    'active_jobs',
    'Количество активных jobs в очереди',
    ['type']
)

# ============================================================================
# БАЗА ДАННЫХ
# ============================================================================

db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Длительность запросов к БД',
    ['operation', 'table'],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
)

db_connections_active = Gauge(
    'db_connections_active',
    'Количество активных соединений с БД'
)

# ============================================================================
# HTTP API
# ============================================================================

http_requests_total = Counter(
    'http_requests_total',
    'Общее количество HTTP запросов',
    ['method', 'endpoint', 'status_code']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'Длительность HTTP запросов',
    ['method', 'endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
)

# ============================================================================
# RATE LIMITING
# ============================================================================

rate_limit_exceeded_total = Counter(
    'rate_limit_exceeded_total',
    'Количество превышений rate limit',
    ['endpoint', 'ip']
)

# ============================================================================
# ОШИБКИ
# ============================================================================

errors_total = Counter(
    'errors_total',
    'Общее количество ошибок',
    ['type', 'component']
)

# ============================================================================
# СИСТЕМА
# ============================================================================

app_info = Info('app', 'Информация о приложении')
app_info.info({
    'version': '1.0.0',
    'service': 'zachot-api',
    'environment': 'production'
})

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def track_generation_start(work_type: str, module: str):
    """Отслеживает начало генерации."""
    generation_requests_total.labels(
        work_type=work_type,
        status='started',
        module=module
    ).inc()
    active_generations.labels(module=module).inc()
    logger.debug(f"Tracked generation start: {work_type} ({module})")


def track_generation_complete(work_type: str, module: str, duration: float):
    """Отслеживает завершение генерации."""
    generation_requests_total.labels(
        work_type=work_type,
        status='completed',
        module=module
    ).inc()
    active_generations.labels(module=module).dec()
    logger.debug(f"Tracked generation complete: {work_type} ({module}), duration: {duration}s")


def track_generation_failed(work_type: str, module: str, error_type: str):
    """Отслеживает ошибку генерации."""
    generation_requests_total.labels(
        work_type=work_type,
        status='failed',
        module=module
    ).inc()
    active_generations.labels(module=module).dec()
    errors_total.labels(type=error_type, component='generation').inc()
    logger.debug(f"Tracked generation failed: {work_type} ({module}), error: {error_type}")


def track_ai_request(model: str, step: str, tokens: int, duration: float, cost_usd: float):
    """Отслеживает запрос к AI."""
    ai_requests_total.labels(model=model, step=step, status='success').inc()
    ai_tokens_used_total.labels(model=model, step=step, work_type='unknown').inc(tokens)
    ai_cost_usd_total.labels(model=model, step=step).inc(cost_usd)
    ai_request_duration_seconds.labels(model=model, step=step).observe(duration)
    logger.debug(f"Tracked AI request: {model}/{step}, tokens: {tokens}, cost: ${cost_usd:.4f}")


def track_ai_error(model: str, step: str, error_type: str):
    """Отслеживает ошибку AI."""
    ai_requests_total.labels(model=model, step=step, status='error').inc()
    errors_total.labels(type=error_type, component='ai').inc()
    logger.debug(f"Tracked AI error: {model}/{step}, error: {error_type}")
