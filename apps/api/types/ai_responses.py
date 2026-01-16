"""
TypedDict definitions for AI service responses.
Provides type safety for AI-generated data.
"""

from typing import TypedDict, List, Optional


class SuggestDetailsResponse(TypedDict):
    """Ответ от AI для suggest_details."""
    goal: str
    idea: str


class StructureItem(TypedDict):
    """Элемент структуры документа."""
    title: str
    level: int


class SuggestStructureResponse(TypedDict):
    """Ответ от AI для suggest_structure."""
    structure: List[StructureItem]


class SourceItem(TypedDict):
    """Элемент источника литературы."""
    title: str
    author: Optional[str]
    year: Optional[str]
    url: Optional[str]
    description: Optional[str]


class SuggestSourcesResponse(TypedDict):
    """Ответ от AI для suggest_sources."""
    sources: List[SourceItem]
