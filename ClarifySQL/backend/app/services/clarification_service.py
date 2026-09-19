from app.providers.base import LLMProvider
from app.schemas.intent import QueryIntent
from app.schemas.clarification import ClarificationRequest, ClarificationAnswer, AmbiguityType
import uuid

class ClarificationService:
    def __init__(self, provider: LLMProvider):
        self.provider = provider
    
    async def detect_ambiguities(self, intent: QueryIntent, schema_context: dict) -> ClarificationRequest | None:
        """Detect ambiguities in the parsed intent and generate clarification questions."""
        system_prompt = """You are an AI data assistant tasked with detecting ambiguities in a user's data query intent.
Check for the following 7 ambiguity types:
- MISSING_METRIC: query mentions an entity but no clear metric (revenue? count? units?)
- AMBIGUOUS_ENTITY: entity name matches multiple tables/concepts
- MISSING_DATE_RANGE: time-sensitive query with no date specified
- MISSING_GROUPING: aggregation with unclear grouping dimension
- AMBIGUOUS_COMPARISON: comparison without clear baseline
- MISSING_FILTER: query could apply to all or specific subset
- AMBIGUOUS_TERMINOLOGY: domain term with multiple interpretations

Provide clarifying questions with 2-5 concrete options based on the actual schema context provided. Ask ONLY necessary questions.
If there are no ambiguities, return an empty list of questions.
"""
        
        prompt = f"""
Schema Context:
{schema_context.get('schema_text', '')}

Parsed Intent: {intent.model_dump_json()}

Detect ambiguities and generate clarification questions.
"""
        
        req = await self.provider.generate_structured(
            prompt=prompt,
            system=system_prompt,
            response_model=ClarificationRequest,
            temperature=0.1
        )
        
        if req and req.questions:
            req.session_id = str(uuid.uuid4())
            return req
        return None
    
    async def resolve_clarifications(self, intent: QueryIntent, answers: ClarificationAnswer, schema_context: dict) -> QueryIntent:
        """Refine the QueryIntent using the user's clarification answers."""
        system_prompt = """You are an expert SQL intent resolver. 
Update the query intent by integrating the user's answers to the clarification questions.
Output the finalized QueryIntent with clarification_needed set to False."""
        
        prompt = f"""
Original Intent: {intent.model_dump_json()}
User Answers: {answers.model_dump_json()}

Provide the refined, unambiguous QueryIntent.
"""
        return await self.provider.generate_structured(
            prompt=prompt,
            system=system_prompt,
            response_model=QueryIntent,
            temperature=0.1
        )
