from app.providers.base import LLMProvider
from app.schemas.intent import QueryIntent
from app.schemas.sql import SQLGenerationResult

class SQLGeneratorService:
    def __init__(self, provider: LLMProvider):
        self.provider = provider
    
    async def generate_sql(self, intent: QueryIntent, schema_context: dict) -> SQLGenerationResult:
        """Generate PostgreSQL SQL from a finalized QueryIntent."""
        system_prompt = """You are an expert PostgreSQL SQL developer.
Generate a valid, efficient, and readable SQL query based on the database schema and query intent.
- Use ONLY tables and columns that exist in the schema.
- Use proper JOINs based on FK relationships.
- Use PostgreSQL-specific date functions where necessary.
- Use table aliases for clarity.
- Handle aggregations (GROUP BY) correctly.
"""
        
        prompt = f"""
Schema Context:
{schema_context.get('schema_text', '')}

Finalized Intent: {intent.model_dump_json()}

Generate the SQL query.
"""
        return await self.provider.generate_structured(
            prompt=prompt,
            system=system_prompt,
            response_model=SQLGenerationResult,
            temperature=0.1
        )
