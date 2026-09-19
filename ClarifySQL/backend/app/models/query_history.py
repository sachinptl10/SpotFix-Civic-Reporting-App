from sqlalchemy import Column, Integer, String, DateTime, Text, Float, JSON, func
from app.models.tables import Base

class QueryHistory(Base):
    __tablename__ = "query_history"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(100), nullable=False)
    question = Column(Text, nullable=False)
    clarification_answers = Column(JSON, nullable=True)
    final_intent = Column(JSON, nullable=True)
    generated_sql = Column(Text, nullable=True)
    execution_status = Column(String(50), nullable=False)
    error_message = Column(Text, nullable=True)
    row_count = Column(Integer, nullable=True)
    execution_time_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
