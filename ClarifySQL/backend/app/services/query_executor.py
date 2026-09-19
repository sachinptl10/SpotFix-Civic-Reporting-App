import asyncio
import time
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy import text
from app.models.database import async_session_factory


def _serialize_value(val):
    """Convert DB values to JSON-serializable types."""
    if val is None:
        return None
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, bytes):
        return val.decode('utf-8', errors='replace')
    return val


class QueryExecutorService:
    def __init__(self, timeout: int = 30, max_rows: int = 1000):
        self.timeout = timeout
        self.max_rows = max_rows

    async def execute(self, sql: str) -> dict:
        """Execute validated SQL with timeout and row limits."""
        start_time = time.time()

        # Add LIMIT if not already present
        sql_stripped = sql.rstrip().rstrip(';')
        if 'limit' not in sql.lower():
            sql_stripped = f"{sql_stripped} LIMIT {self.max_rows}"

        try:
            async with async_session_factory() as session:
                # Set statement timeout on the connection
                await session.execute(
                    text(f"SET statement_timeout = '{self.timeout * 1000}'")
                )

                async def _exec():
                    return await session.execute(text(sql_stripped))

                result = await asyncio.wait_for(_exec(), timeout=self.timeout)

                # Get column names BEFORE consuming rows
                columns = list(result.keys())
                raw_rows = result.fetchall()

                rows = [
                    {col: _serialize_value(val) for col, val in zip(columns, row)}
                    for row in raw_rows
                ]

                elapsed = (time.time() - start_time) * 1000
                return {
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "execution_time_ms": round(elapsed, 2),
                }

        except asyncio.TimeoutError:
            return {
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": self.timeout * 1000,
                "error": "Query execution timed out."
            }
        except Exception as e:
            elapsed = (time.time() - start_time) * 1000
            return {
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": round(elapsed, 2),
                "error": str(e)
            }
