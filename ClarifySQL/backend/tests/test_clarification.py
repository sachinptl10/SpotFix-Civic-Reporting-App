import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.clarification_service import ClarificationService
from app.schemas.intent import QueryIntent
from app.schemas.clarification import AmbiguityType, ClarificationRequest, ClarificationQuestion

@pytest.fixture
def mock_provider():
    provider = MagicMock()
    provider.generate_structured = AsyncMock()
    return provider

@pytest.fixture
def schema_context():
    return {
        "tables": {
            "customers": {"columns": {"id": {}, "name": {}}},
            "products": {"columns": {"id": {}, "name": {}, "brand": {}}},
            "orders": {"columns": {"id": {}, "customer_id": {}, "order_date": {}, "total_amount": {}}}
        }
    }

@pytest.mark.asyncio
async def test_ambiguous_entity(mock_provider, schema_context):
    service = ClarificationService(mock_provider)
    intent = QueryIntent(original_question="Show me Apple's data")
    
    mock_provider.generate_structured.return_value = ClarificationRequest(
        questions=[ClarificationQuestion(
            ambiguity_type=AmbiguityType.AMBIGUOUS_ENTITY,
            question="Do you mean the Apple brand products or a company named Apple?",
            options=["Apple brand products", "Company named Apple"]
        )]
    )
    
    result = await service.detect_ambiguities(intent, schema_context)
    assert result is not None
    assert len(result.questions) == 1
    assert result.questions[0].ambiguity_type == AmbiguityType.AMBIGUOUS_ENTITY

@pytest.mark.asyncio
async def test_missing_metric(mock_provider, schema_context):
    service = ClarificationService(mock_provider)
    intent = QueryIntent(original_question="Show me sales")
    
    mock_provider.generate_structured.return_value = ClarificationRequest(
        questions=[ClarificationQuestion(
            ambiguity_type=AmbiguityType.MISSING_METRIC,
            question="Which sales metric do you want to see?",
            options=["Total revenue", "Number of orders"]
        )]
    )
    
    result = await service.detect_ambiguities(intent, schema_context)
    assert result is not None
    assert result.questions[0].ambiguity_type == AmbiguityType.MISSING_METRIC

@pytest.mark.asyncio
async def test_missing_date_range(mock_provider, schema_context):
    service = ClarificationService(mock_provider)
    intent = QueryIntent(original_question="Show me monthly revenue")
    
    mock_provider.generate_structured.return_value = ClarificationRequest(
        questions=[ClarificationQuestion(
            ambiguity_type=AmbiguityType.MISSING_DATE_RANGE,
            question="For which date range?",
            options=["This year", "Last year", "All time"]
        )]
    )
    
    result = await service.detect_ambiguities(intent, schema_context)
    assert result is not None
    assert result.questions[0].ambiguity_type == AmbiguityType.MISSING_DATE_RANGE

@pytest.mark.asyncio
async def test_clear_query(mock_provider, schema_context):
    service = ClarificationService(mock_provider)
    intent = QueryIntent(original_question="SELECT all customer names")
    
    mock_provider.generate_structured.return_value = None
    
    result = await service.detect_ambiguities(intent, schema_context)
    assert result is None

@pytest.mark.asyncio
async def test_multiple_ambiguities(mock_provider, schema_context):
    service = ClarificationService(mock_provider)
    intent = QueryIntent(original_question="Show me Apple's sales")
    
    mock_provider.generate_structured.return_value = ClarificationRequest(
        questions=[
            ClarificationQuestion(ambiguity_type=AmbiguityType.AMBIGUOUS_ENTITY, question="Entity?", options=[]),
            ClarificationQuestion(ambiguity_type=AmbiguityType.AMBIGUOUS_TERMINOLOGY, question="Terminology?", options=[]),
            ClarificationQuestion(ambiguity_type=AmbiguityType.MISSING_DATE_RANGE, question="Date?", options=[])
        ]
    )
    
    result = await service.detect_ambiguities(intent, schema_context)
    assert result is not None
    assert len(result.questions) == 3
    types = [q.ambiguity_type for q in result.questions]
    assert AmbiguityType.AMBIGUOUS_ENTITY in types
    assert AmbiguityType.AMBIGUOUS_TERMINOLOGY in types
    assert AmbiguityType.MISSING_DATE_RANGE in types

@pytest.mark.asyncio
async def test_ambiguous_comparison(mock_provider, schema_context):
    service = ClarificationService(mock_provider)
    intent = QueryIntent(original_question="Compare products")
    
    mock_provider.generate_structured.return_value = ClarificationRequest(
        questions=[ClarificationQuestion(
            ambiguity_type=AmbiguityType.AMBIGUOUS_COMPARISON,
            question="Compare them by what?",
            options=["Price", "Sales volume"]
        )]
    )
    
    result = await service.detect_ambiguities(intent, schema_context)
    assert result is not None
    assert result.questions[0].ambiguity_type == AmbiguityType.AMBIGUOUS_COMPARISON
