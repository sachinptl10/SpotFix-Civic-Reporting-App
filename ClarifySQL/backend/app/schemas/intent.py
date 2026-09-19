from pydantic import BaseModel, Field
from typing import Optional, Any, Literal

class QueryIntent(BaseModel):
    intent_type: Literal["ranking", "aggregation", "comparison", "trend", "detail", "count", "list"] = "list"
    entities: list[str] = Field(default_factory=list)
    metric: Optional[str] = None
    filters: dict[str, Any] = Field(default_factory=dict)
    date_range: Optional[str] = None
    group_by: list[str] = Field(default_factory=list)
    sort_order: Optional[Literal["asc", "desc"]] = None
    limit: Optional[int] = None
    clarification_needed: bool = False
    raw_question: str = ""
