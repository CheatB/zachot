"""
Пакет Fair Use для выявления злоупотреблений и управления режимами работы.

Предоставляет механизмы оценки риска злоупотребления системой и
принятия решений о режимах работы. Слой поверх экономики.
"""

from .abuse_score import AbuseScore, AbuseScorer
from .policy import FairUseDecision, FairUseMode, FairUsePolicyEngine

__all__ = [
    # Abuse Scoring
    "AbuseScore",
    "AbuseScorer",
    # Fair Use Policy
    "FairUseMode",
    "FairUseDecision",
    "FairUsePolicyEngine",
]

