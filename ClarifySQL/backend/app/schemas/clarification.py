from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class AmbiguityType(str, Enum):
    MISSING_METRIC = "missing_metric"
    AMBIGUOUS_ENTITY = "ambiguous_entity"
    MISSING_DATE_RANGE = "missing_date_range"
    MISSING_GROUPING = "missing_grouping"
    AMBIGUOUS_COMPARISON = "ambiguous_comparison"
    MISSING_FILTER = "missing_filter"
    AMBIGUOUS_TERMINOLOGY = "ambiguous_terminology"

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    ambiguity_type: AmbiguityType
    options: list[str]
    allow_custom: bool = False
    context: Optional[str] = None

class ClarificationRequest(BaseModel):
    session_id: str = ""
    questions: list[ClarificationQuestion] = Field(default_factory=list)
    partial_intent: Optional["QueryIntent"] = None  # forward ref

class ClarificationAnswer(BaseModel):
    session_id: str
    answers: dict[str, str]  # question_id -> selected option

from app.schemas.intent import QueryIntent
ClarificationRequest.model_rebuild()
