from app.providers.base import LLMProvider
from app.schemas.intent import QueryIntent

class IntentService:
    def __init__(self, provider: LLMProvider):
        self.provider = provider
    
    async def parse_intent(self, question: str, schema_context: dict) -> QueryIntent:
        """Parse natural language question into structured QueryIntent."""
        system_prompt = """You are an expert SQL query intent parser.
Given a database schema and a natural language user question, extract the underlying intent.

Determine the intent_type (e.g., metric, ranking, trend, comparison, list).
Extract any entities, metric, filters, date_range, group_by, sort_order, and limit.
If the query is ambiguous, missing crucial context, or referring to non-existent concepts, set clarification_needed=True.
"""
        
        prompt = f"""
Schema Context:
{schema_context.get('schema_text', '')}

User Question: {question}

Please analyze this question and extract the query intent.
"""
        
        return await self.provider.generate_structured(
            prompt=prompt,
            system=system_prompt,
            response_model=QueryIntent,
            temperature=0.1
        )
