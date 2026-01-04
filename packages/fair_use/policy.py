"""
Fair Use Policy Engine для управления режимами работы системы.

Предоставляет логику принятия решений о режиме работы на основе
AbuseScore и BudgetDecision. Слой поверх экономики, управляет режимами работы.
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from packages.llm_economics.budget import BudgetDecision

from .abuse_score import AbuseScore

FairUseMode = Literal["normal", "degraded", "strict"]


class FairUseDecision(BaseModel):
    """
    Решение Fair Use Policy о режиме работы системы.
    
    Содержит информацию о режиме работы, разрешении запроса,
    причине решения и применённых ограничениях.
    
    Attributes:
        mode: Режим работы системы ("normal", "degraded", "strict")
        allowed: Разрешён ли запрос
        reason: Причина решения
        applied_limits: Применённые ограничения (например, max_tokens, streaming)
    
    Examples:
        >>> decision = FairUseDecision(
        ...     mode="normal",
        ...     allowed=True,
        ...     reason="Normal usage",
        ...     applied_limits={}
        ... )
        >>> 
        >>> if decision.mode == "degraded":
        ...     max_tokens = decision.applied_limits.get("max_tokens", 1000)
        ...     streaming = decision.applied_limits.get("streaming", True)
    """
    
    mode: FairUseMode = Field(..., description="Режим работы системы")
    allowed: bool = Field(..., description="Разрешён ли запрос")
    reason: str = Field(..., description="Причина решения")
    applied_limits: dict[str, Any] = Field(
        default_factory=dict,
        description="Применённые ограничения (max_tokens, streaming, etc.)"
    )
    
    model_config = ConfigDict(frozen=True)  # Делаем модель immutable
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return (
            f"FairUseDecision(mode={self.mode!r}, allowed={self.allowed}, "
            f"reason={self.reason!r}, limits={len(self.applied_limits)})"
        )
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        status = "ALLOWED" if self.allowed else "DENIED"
        return f"FairUseDecision[{self.mode.upper()}] ({status}: {self.reason})"


class FairUsePolicyEngine:
    """
    Движок Fair Use Policy для управления режимами работы системы.
    
    Принимает решения о режиме работы на основе AbuseScore и BudgetDecision.
    Это слой ПОВЕРХ экономики - не считает деньги и токены,
    а управляет режимами работы системы.
    
    Режимы работы:
    - normal: Нормальная работа, без ограничений
    - degraded: Деградированный режим, с ограничениями
    - strict: Строгий режим, блокировка запросов
    
    Логика принятия решений:
    - normal: abuse=low AND budget=ok → allowed=True, без ограничений
    - degraded: abuse=medium OR soft_limit_exceeded → allowed=True, но с ограничениями
    - strict: abuse=high OR hard_limit_exceeded → allowed=False
    
    Examples:
        >>> from packages.fair_use import AbuseScore, AbuseScorer
        >>> from packages.llm_economics import BudgetDecision, BudgetEvaluator
        >>> 
        >>> # Оценка злоупотребления
        >>> abuse_score = AbuseScore(
        ...     score=25,
        ...     level="medium",
        ...     reasons=["High request frequency"]
        ... )
        >>> 
        >>> # Решение бюджета
        >>> budget_decision = BudgetDecision(
        ...     allowed=True,
        ...     reason="soft_limit_exceeded",
        ...     remaining_tokens=0,
        ...     remaining_budget_rub=0.0
        ... )
        >>> 
        >>> # Принятие решения Fair Use
        >>> engine = FairUsePolicyEngine()
        >>> decision = engine.decide(
        ...     abuse_score=abuse_score,
        ...     budget_decision=budget_decision,
        ...     pricing_plan="BASE_499"
        ... )
        >>> 
        >>> if decision.mode == "degraded":
        ...     max_tokens = decision.applied_limits.get("max_tokens")
        ...     streaming = decision.applied_limits.get("streaming")
        ...     print(f"Degraded mode: max_tokens={max_tokens}, streaming={streaming}")
    """
    
    def decide(
        self,
        abuse_score: AbuseScore,
        budget_decision: BudgetDecision,
        pricing_plan: str
    ) -> FairUseDecision:
        """
        Принимает решение о режиме работы системы.
        
        Использует явные правила для определения режима работы:
        - normal: Нормальная работа
        - degraded: Деградированный режим с ограничениями
        - strict: Строгий режим с блокировкой
        
        Args:
            abuse_score: Оценка риска злоупотребления
            budget_decision: Решение о бюджете
            pricing_plan: Название тарифного плана (для будущего использования)
        
        Returns:
            FairUseDecision с решением о режиме работы
        
        Examples:
            >>> engine = FairUsePolicyEngine()
            >>> 
            >>> # Сценарий 1: Нормальная работа
            >>> abuse_low = AbuseScore(score=10, level="low", reasons=[])
            >>> budget_ok = BudgetDecision(
            ...     allowed=True,
            ...     reason="ok",
            ...     remaining_tokens=1000,
            ...     remaining_budget_rub=10.0
            ... )
            >>> 
            >>> decision1 = engine.decide(abuse_low, budget_ok, "PRO")
            >>> assert decision1.mode == "normal"
            >>> assert decision1.allowed == True
            >>> assert len(decision1.applied_limits) == 0
            >>> 
            >>> # Сценарий 2: Деградированный режим
            >>> abuse_medium = AbuseScore(score=50, level="medium", reasons=["High frequency"])
            >>> budget_soft = BudgetDecision(
            ...     allowed=True,
            ...     reason="soft_limit_exceeded",
            ...     remaining_tokens=0,
            ...     remaining_budget_rub=0.0
            ... )
            >>> 
            >>> decision2 = engine.decide(abuse_medium, budget_soft, "BASE_499")
            >>> assert decision2.mode == "degraded"
            >>> assert decision2.allowed == True
            >>> assert "max_tokens" in decision2.applied_limits
            >>> 
            >>> # Сценарий 3: Строгий режим (блокировка)
            >>> abuse_high = AbuseScore(score=80, level="high", reasons=["Bot detected"])
            >>> budget_hard = BudgetDecision(
            ...     allowed=False,
            ...     reason="hard_limit_exceeded",
            ...     remaining_tokens=0,
            ...     remaining_budget_rub=0.0
            ... )
            >>> 
            >>> decision3 = engine.decide(abuse_high, budget_hard, "FREE")
            >>> assert decision3.mode == "strict"
            >>> assert decision3.allowed == False
        """
        # Правило 1: Строгий режим (блокировка)
        # Условия: abuse=high OR hard_limit_exceeded
        if (
            abuse_score.level == "high" or
            budget_decision.reason == "hard_limit_exceeded"
        ):
            return FairUseDecision(
                mode="strict",
                allowed=False,
                reason="fair_use_block",
                applied_limits={}
            )
        
        # Правило 2: Деградированный режим (с ограничениями)
        # Условия: abuse=medium OR soft_limit_exceeded
        if (
            abuse_score.level == "medium" or
            budget_decision.reason == "soft_limit_exceeded"
        ):
            # Вычисляем ограничения на основе оставшегося бюджета
            # Ограничиваем max_tokens до 50% от оставшегося бюджета или минимум 500
            max_tokens_limit = max(500, budget_decision.remaining_tokens // 2)
            
            # Если бюджет исчерпан, используем минимальный лимит
            if budget_decision.remaining_tokens == 0:
                max_tokens_limit = 500
            
            return FairUseDecision(
                mode="degraded",
                allowed=True,
                reason="degraded_mode_limits",
                applied_limits={
                    "max_tokens": max_tokens_limit,
                    "streaming": False,
                    "priority": "low"
                }
            )
        
        # Правило 3: Нормальный режим
        # Условия: abuse=low AND budget=ok
        if (
            abuse_score.level == "low" and
            budget_decision.reason == "ok"
        ):
            return FairUseDecision(
                mode="normal",
                allowed=True,
                reason="normal_operation",
                applied_limits={}
            )
        
        # Fallback: если не подошло ни одно правило, используем деградированный режим
        # (на случай, если логика изменится в будущем)
        return FairUseDecision(
            mode="degraded",
            allowed=True,
            reason="fallback_degraded",
            applied_limits={
                "max_tokens": 1000,
                "streaming": False,
                "priority": "low"
            }
        )
    
    def __repr__(self) -> str:
        """Строковое представление для отладки."""
        return "FairUsePolicyEngine()"
    
    def __str__(self) -> str:
        """Человекочитаемое представление."""
        return "FairUsePolicyEngine"


