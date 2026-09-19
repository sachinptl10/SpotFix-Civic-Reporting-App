from app.providers.base import LLMProvider
from app.schemas.intent import QueryIntent
from app.schemas.query import QueryResult, ChartRecommendation
from typing import Optional


class ResultProcessorService:
    def __init__(self, provider: LLMProvider):
        self.provider = provider

    async def process(self, raw_result: dict, intent: Optional[QueryIntent], sql: str) -> QueryResult:
        """Process raw query results into QueryResult with explanation and chart recommendation."""
        rows = raw_result.get("rows", [])
        columns = raw_result.get("columns", [])
        row_count = raw_result.get("row_count", len(rows))
        execution_time_ms = raw_result.get("execution_time_ms", 0)
        error = raw_result.get("error")

        if error:
            return QueryResult(
                sql=sql,
                columns=[],
                rows=[],
                row_count=0,
                execution_time_ms=execution_time_ms,
                explanation=f"Query failed: {error}",
                chart_recommendation=None,
            )

        chart = self._recommend_chart(columns, rows, intent)

        # Generate natural language explanation
        try:
            preview = str(rows[:5]) if rows else "No rows returned"
            system_prompt = (
                "You are a data analyst. Summarize query results in 2-3 concise sentences. "
                "Mention key numbers, trends, or patterns. Do not repeat the SQL."
            )
            prompt = (
                f"User question: {intent.raw_question if intent else 'N/A'}\n"
                f"SQL: {sql}\n"
                f"Result: {row_count} rows returned.\n"
                f"Sample data: {preview}\n\n"
                f"Provide a brief summary of what this data shows."
            )
            explanation = await self.provider.generate(prompt=prompt, system=system_prompt)
        except Exception:
            explanation = f"Query returned {row_count} rows."

        return QueryResult(
            sql=sql,
            columns=columns,
            rows=rows,
            row_count=row_count,
            execution_time_ms=execution_time_ms,
            explanation=explanation.strip(),
            chart_recommendation=chart,
        )

    def _recommend_chart(
        self, columns: list[str], rows: list[dict], intent: Optional[QueryIntent]
    ) -> Optional[ChartRecommendation]:
        """Determine best chart type based on data shape and intent."""
        if not columns or not rows or len(rows) == 0:
            return None

        num_cols = len(columns)
        num_rows = len(rows)
        intent_type = (intent.intent_type if intent else "list").lower()

        # Detect numeric columns from the first row
        numeric_cols = []
        string_cols = []
        date_cols = []
        for col in columns:
            sample = rows[0].get(col)
            if isinstance(sample, (int, float)):
                numeric_cols.append(col)
            elif isinstance(sample, str) and any(
                kw in col.lower() for kw in ['date', 'month', 'year', 'day', 'time', 'week']
            ):
                date_cols.append(col)
            elif isinstance(sample, str):
                string_cols.append(col)

        # Time series -> line chart
        if intent_type == 'trend' or (date_cols and numeric_cols):
            x = date_cols[0] if date_cols else (string_cols[0] if string_cols else columns[0])
            y = numeric_cols[0] if numeric_cols else columns[-1]
            return ChartRecommendation(
                chart_type="line", x_axis=x, y_axis=y,
                title=f"{y} over {x}"
            )

        # Ranking -> horizontal bar
        if intent_type == 'ranking' and num_cols >= 2:
            x = string_cols[0] if string_cols else columns[0]
            y = numeric_cols[0] if numeric_cols else columns[1]
            return ChartRecommendation(
                chart_type="bar", x_axis=x, y_axis=y,
                title=f"{y} by {x}"
            )

        # Comparison -> bar or pie
        if intent_type == 'comparison' or (intent_type in ('aggregation', 'count') and string_cols and numeric_cols):
            x = string_cols[0] if string_cols else columns[0]
            y = numeric_cols[0] if numeric_cols else columns[1]
            if num_rows <= 6:
                return ChartRecommendation(
                    chart_type="pie", x_axis=x, y_axis=y,
                    title=f"{y} by {x}"
                )
            return ChartRecommendation(
                chart_type="bar", x_axis=x, y_axis=y,
                title=f"{y} by {x}"
            )

        # Two columns: string + number -> bar
        if num_cols == 2 and string_cols and numeric_cols:
            return ChartRecommendation(
                chart_type="bar", x_axis=string_cols[0], y_axis=numeric_cols[0],
                title=f"{numeric_cols[0]} by {string_cols[0]}"
            )

        # Default: table for raw records
        return ChartRecommendation(chart_type="table", x_axis="", y_axis="", title="Results")
