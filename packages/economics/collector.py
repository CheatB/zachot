"""
Сборщик данных о стоимости (CostCollector).

Извлекает данные о стоимости из JobResult и создает CostRecord.
Не принимает решений, не применяет лимиты, только извлекает данные.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from packages.jobs import JobResult

from .record import CostRecord


class CostCollector:
    """
    Сборщик данных о стоимости из JobResult.
    
    Извлекает метрики использования LLM из output_payload JobResult
    и создает CostRecord. Работает только с успешными результатами.
    
    Ожидаемая структура output_payload:
    {
        "llm_metrics": {
            "provider_name": "openai",
            "tokens_used": 1500,
            "latency_ms": 1200,
            "cost_rub": 0.15
        },
        ... другие данные
    }
    
    Или на верхнем уровне:
    {
        "provider_name": "openai",
        "tokens_used": 1500,
        "latency_ms": 1200,
        "cost_rub": 0.15,
        ... другие данные
    }
    
    Examples:
        >>> collector = CostCollector()
        >>> 
        >>> # После выполнения задачи воркером
        >>> job_result = JobResult(
        ...     job_id=job.id,
        ...     success=True,
        ...     output_payload={
        ...         "llm_metrics": {
        ...             "provider_name": "openai",
        ...             "tokens_used": 1500,
        ...             "latency_ms": 1200,
        ...             "cost_rub": 0.15
        ...         },
        ...         "result": {...}
        ...     },
        ...     finished_at=datetime.now()
        ... )
        >>> 
        >>> # Собрать данные о стоимости
        >>> cost_record = collector.collect(
        ...     job_result=job_result,
        ...     generation_id=job.generation_id,
        ...     user_id=user_id  # опционально
        ... )
        >>> 
        >>> # cost_record содержит извлеченные данные
        >>> print(f"Cost: {cost_record.cost_rub} RUB")
        Cost: 0.15 RUB
    """
    
    def collect(
        self,
        job_result: JobResult,
        generation_id: UUID,
        user_id: Optional[UUID] = None
    ) -> Optional[CostRecord]:
        """
        Извлекает данные о стоимости из JobResult и создает CostRecord.
        
        Работает только с успешными результатами (success=True).
        Если данных о стоимости нет, возвращает None.
        
        Ищет данные в следующем порядке:
        1. output_payload["llm_metrics"] - предпочтительный формат
        2. output_payload на верхнем уровне (provider_name, tokens_used, etc.)
        
        Args:
            job_result: Результат выполнения задачи
            generation_id: Идентификатор генерации
            user_id: Идентификатор пользователя (опционально)
        
        Returns:
            CostRecord с извлеченными данными или None, если данных нет
        
        Examples:
            >>> collector = CostCollector()
            >>> 
            >>> # Успешный результат с метриками
            >>> job_result = JobResult(
            ...     job_id=UUID("..."),
            ...     success=True,
            ...     output_payload={
            ...         "llm_metrics": {
            ...             "provider_name": "openai",
            ...             "tokens_used": 1500,
            ...             "latency_ms": 1200,
            ...             "cost_rub": 0.15
            ...         }
            ...     },
            ...     finished_at=datetime.now()
            ... )
            >>> 
            >>> record = collector.collect(job_result, generation_id)
            >>> print(record.cost_rub)
            0.15
            
            >>> # Результат без метрик
            >>> job_result_no_metrics = JobResult(
            ...     job_id=UUID("..."),
            ...     success=True,
            ...     output_payload={"result": "some data"},
            ...     finished_at=datetime.now()
            ... )
            >>> 
            >>> record = collector.collect(job_result_no_metrics, generation_id)
            >>> print(record)
            None
        """
        # Работаем только с успешными результатами
        if not job_result.success:
            return None
        
        if job_result.output_payload is None:
            return None
        
        payload = job_result.output_payload
        
        # Пытаемся найти данные в llm_metrics
        metrics = payload.get("llm_metrics")
        
        # Если нет llm_metrics, ищем на верхнем уровне
        if metrics is None:
            # Проверяем наличие обязательных полей на верхнем уровне
            if "provider_name" in payload:
                metrics = payload
            else:
                # Данных о стоимости нет
                return None
        
        # Извлекаем обязательные поля
        provider_name = metrics.get("provider_name")
        if provider_name is None:
            return None
        
        tokens_used = metrics.get("tokens_used", 0)
        latency_ms = metrics.get("latency_ms", 0)
        cost_rub = metrics.get("cost_rub", 0.0)
        
        # Создаем запись
        return CostRecord(
            job_id=job_result.job_id,
            generation_id=generation_id,
            user_id=user_id,
            provider_name=str(provider_name),
            tokens_used=int(tokens_used),
            latency_ms=int(latency_ms),
            cost_rub=float(cost_rub),
            recorded_at=job_result.finished_at
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return f"CostCollector()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "CostCollector"


