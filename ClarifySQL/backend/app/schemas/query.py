from pydantic import BaseModel, Field
from typing import Optional, Any, Literal

class ChartRecommendation(BaseModel):
    chart_type: Literal["bar", "line", "pie", "donut", "table"] = "table"
    x_axis: str = ""
    y_axis: str = ""
    title: str = ""

class QueryResult(BaseModel):
    columns: list[str] = Field(default_factory=list)
    rows: list[dict[str, Any]] = Field(default_factory=list)
    row_count: int = 0
    execution_time_ms: float = 0.0
    sql: str = ""
    explanation: str = ""
    chart_recommendation: Optional[ChartRecommendation] = None

class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

class ClarifyResponse(BaseModel):
    session_id: str
    needs_clarification: bool
    clarification: Optional["ClarificationRequest"] = None
    result: Optional[QueryResult] = None
    intent: Optional["QueryIntent"] = None
    sql_result: Optional["SQLGenerationResult"] = None
    validation: Optional["ValidationResult"] = None
    error: Optional[str] = None

from app.schemas.clarification import ClarificationRequest
from app.schemas.intent import QueryIntent
from app.schemas.sql import SQLGenerationResult, ValidationResult
ClarifyResponse.model_rebuild()
