from pydantic import BaseModel, Field

class SQLGenerationResult(BaseModel):
    sql: str
    explanation: str
    confidence: float = Field(ge=0.0, le=1.0)
    tables_used: list[str] = Field(default_factory=list)
    columns_used: list[str] = Field(default_factory=list)

class ValidationResult(BaseModel):
    is_valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    query_type: str = ""
    tables_referenced: list[str] = Field(default_factory=list)
    is_read_only: bool = True
