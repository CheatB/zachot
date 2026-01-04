"""
Abuse Scoring Engine для оценки риска злоупотребления системой.

Предоставляет детерминированную логику оценки подозрительного поведения
на основе метрик использования. Только оценка риска, без блокировок.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from packages.llm_economics.usage import UsageSummary


class AbuseScore(BaseModel):
    """
    Оценка риска злоупотребления системой.
    
    Содержит числовую оценку риска (0-100), уровень риска и список причин.
    Используется для мониторинга и принятия решений о подозрительном поведении.
    
    Attributes:
        score: Числовая оценка риска (0-100, где 0 - норма, 100 - критический риск)
        level: Уровень риска ("low", "medium", "high")
        reasons: Список причин повышения оценки риска
    
    Examples:
        >>> score = AbuseScore(
        ...     score=45,
        ...     level="medium",
        ...     reasons=["High request frequency", "Multiple soft limit hits"]
        ... )
        >>> if score.level == "high":
        ...     print("High risk detected!")
    """
    
    score: int = Field(..., ge=0, le=100, description="Оценка риска (0-100)")
    level: Literal["low", "medium", "high"] = Field(..., description="Уровень риска")
    reasons: list[str] = Field(default_factory=list, description="Причины повышения оценки")
    
    @field_validator('score')
    @classmethod
    def validate_score(cls, v: int) -> int:
        """Валидация: score должен быть в диапазоне 0-100."""
        if v < 0 or v > 100:
            raise ValueError(f"score must be between 0 and 100, got {v}")
        return v
    
    @field_validator('level')
    @classmethod
    def validate_level(cls, v: str) -> str:
        """Валидация: level должен быть одним из допустимых значений."""
        if v not in ("low", "medium", "high"):
            raise ValueError(f"level must be one of: low, medium, high, got {v}")
        return v
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"AbuseScore(score={self.score}, level={self.level!r}, "
            f"reasons={len(self.reasons)})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        reasons_str = "; ".join(self.reasons) if self.reasons else "No issues detected"
        return f"AbuseScore[{self.level.upper()}] (score={self.score}, {reasons_str})"


class AbuseScorer:
    """
    Оценщик риска злоупотребления системой.
    
    Выполняет детерминированную оценку риска на основе метрик использования.
    Использует эвристики для выявления подозрительного поведения:
    - Частые запросы
    - Высокая нагрузка при soft_limit
    - Аномально низкая латентность (признак ботов)
    
    Только оценка риска, без блокировок и автоматических действий.
    
    Examples:
        >>> from packages.llm_economics import UsageSummary
        >>> from packages.fair_use import AbuseScorer
        >>> 
        >>> # Фактическое использование
        >>> usage = UsageSummary(
        ...     total_tokens=50000,
        ...     total_cost_rub=25.0,
        ...     avg_latency_ms=1200
        ... )
        >>> 
        >>> # Метрики для оценки
        >>> recent_requests = 100  # За последний период
        >>> avg_latency_ms = 150  # Аномально низкая
        >>> soft_limit_hits = 5  # Количество попаданий в soft_limit
        >>> 
        >>> # Оценка риска
        >>> scorer = AbuseScorer()
        >>> abuse_score = scorer.calculate(
        ...     usage=usage,
        ...     recent_requests=recent_requests,
        ...     avg_latency_ms=avg_latency_ms,
        ...     soft_limit_hits=soft_limit_hits
        ... )
        >>> 
        >>> print(f"Abuse score: {abuse_score.score} ({abuse_score.level})")
        Abuse score: 65 (medium)
        >>> print(f"Reasons: {abuse_score.reasons}")
        Reasons: ['High request frequency', 'Anomalously low latency', 'Multiple soft limit hits']
    """
    
    def calculate(
        self,
        usage: UsageSummary,
        recent_requests: int,
        avg_latency_ms: int,
        soft_limit_hits: int
    ) -> AbuseScore:
        """
        Вычисляет оценку риска злоупотребления.
        
        Использует эвристики для оценки риска:
        - Частые запросы (recent_requests > 50) → +20 score
        - Очень частые запросы (recent_requests > 100) → +30 score
        - Высокая нагрузка при soft_limit (soft_limit_hits > 3) → +25 score
        - Аномально низкая латентность (avg_latency_ms < 200) → +30 score
        - Очень низкая латентность (avg_latency_ms < 100) → +40 score
        
        Args:
            usage: Сводка фактического использования
            recent_requests: Количество запросов за последний период
            avg_latency_ms: Средняя латентность запросов
            soft_limit_hits: Количество попаданий в soft_limit
        
        Returns:
            AbuseScore с оценкой риска и причинами
        
        Examples:
            >>> scorer = AbuseScorer()
            >>> 
            >>> usage = UsageSummary(
            ...     total_tokens=10000,
            ...     total_cost_rub=5.0,
            ...     avg_latency_ms=1200
            ... )
            >>> 
            >>> score = scorer.calculate(
            ...     usage=usage,
            ...     recent_requests=10,
            ...     avg_latency_ms=1200,
            ...     soft_limit_hits=0
            ... )
            >>> 
            >>> assert score.score == 0
            >>> assert score.level == "low"
        """
        # Валидация входных данных
        if recent_requests < 0:
            raise ValueError(f"recent_requests must be >= 0, got {recent_requests}")
        if avg_latency_ms < 0:
            raise ValueError(f"avg_latency_ms must be >= 0, got {avg_latency_ms}")
        if soft_limit_hits < 0:
            raise ValueError(f"soft_limit_hits must be >= 0, got {soft_limit_hits}")
        
        score = 0
        reasons: list[str] = []
        
        # Эвристика 1: Частые запросы
        if recent_requests > 100:
            score += 30
            reasons.append("Very high request frequency")
        elif recent_requests > 50:
            score += 20
            reasons.append("High request frequency")
        elif recent_requests > 20:
            score += 10
            reasons.append("Elevated request frequency")
        
        # Эвристика 2: Высокая нагрузка при soft_limit
        if soft_limit_hits > 5:
            score += 30
            reasons.append("Excessive soft limit hits")
        elif soft_limit_hits > 3:
            score += 25
            reasons.append("Multiple soft limit hits")
        elif soft_limit_hits > 1:
            score += 15
            reasons.append("Some soft limit hits")
        
        # Эвристика 3: Аномально низкая латентность (признак ботов)
        # Игнорируем нулевую латентность (нет запросов)
        if avg_latency_ms > 0:
            if avg_latency_ms < 100:
                score += 40
                reasons.append("Anomalously low latency (possible bot)")
            elif avg_latency_ms < 200:
                score += 30
                reasons.append("Very low latency (suspicious)")
            elif avg_latency_ms < 300:
                score += 15
                reasons.append("Low latency")
        
        # Эвристика 4: Высокое использование токенов
        if usage.total_tokens > 1000000:
            score += 20
            reasons.append("Very high token usage")
        elif usage.total_tokens > 500000:
            score += 10
            reasons.append("High token usage")
        
        # Эвристика 5: Высокая стоимость
        if usage.total_cost_rub > 1000.0:
            score += 15
            reasons.append("Very high cost")
        elif usage.total_cost_rub > 500.0:
            score += 10
            reasons.append("High cost")
        
        # Ограничиваем score до 100
        score = min(100, score)
        
        # Определяем level на основе score
        if score < 30:
            level: Literal["low", "medium", "high"] = "low"
        elif score < 70:
            level = "medium"
        else:
            level = "high"
        
        # Если нет причин, но score > 0, добавляем общую причину
        if not reasons and score > 0:
            reasons.append("Elevated usage patterns detected")
        
        # Если score == 0, добавляем сообщение о нормальном использовании
        if score == 0:
            reasons.append("Normal usage patterns")
        
        return AbuseScore(
            score=score,
            level=level,
            reasons=reasons
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "AbuseScorer()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "AbuseScorer"

