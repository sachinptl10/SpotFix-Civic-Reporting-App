from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.query_history import QueryHistory
from typing import Optional


class HistoryService:
    async def save_query(
        self,
        session: AsyncSession,
        session_id: str = "",
        question: str = "",
        sql_query: str = None,
        execution_status: str = "pending",
        error_message: str = None,
        execution_time_ms: float = None,
        row_count: int = None,
        clarification_answers: dict = None,
        final_intent: dict = None,
        **kwargs,
    ) -> int:
        """Save a query to history. Return the ID."""
        history = QueryHistory(
            session_id=session_id,
            question=question or "N/A",
            generated_sql=sql_query,
            execution_status=execution_status,
            error_message=error_message,
            execution_time_ms=execution_time_ms,
            row_count=row_count,
            clarification_answers=clarification_answers,
            final_intent=final_intent,
        )
        session.add(history)
        await session.flush()  # flush instead of commit — let the route handle commit
        return history.id

    async def get_history(self, session: AsyncSession, limit: int = 50) -> list[dict]:
        """Get recent query history."""
        stmt = (
            select(QueryHistory)
            .order_by(desc(QueryHistory.created_at))
            .limit(limit)
        )
        result = await session.execute(stmt)
        records = result.scalars().all()
        return [self._to_dict(r) for r in records]

    async def get_query(self, session: AsyncSession, query_id: int) -> Optional[dict]:
        """Get a single history entry."""
        stmt = select(QueryHistory).where(QueryHistory.id == query_id)
        result = await session.execute(stmt)
        record = result.scalars().first()
        if not record:
            return None
        return self._to_dict(record)

    @staticmethod
    def _to_dict(record: QueryHistory) -> dict:
        return {
            "id": record.id,
            "session_id": record.session_id,
            "question": record.question,
            "generated_sql": record.generated_sql,
            "execution_status": record.execution_status,
            "error_message": record.error_message,
            "row_count": record.row_count,
            "execution_time_ms": record.execution_time_ms,
            "clarification_answers": record.clarification_answers,
            "created_at": record.created_at.isoformat() if record.created_at else None,
        }
