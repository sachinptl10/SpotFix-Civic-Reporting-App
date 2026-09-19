from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import logging

from app.config import settings
from app.models.database import get_db
from app.schemas.intent import QueryIntent
from app.schemas.clarification import ClarificationRequest, ClarificationAnswer
from app.schemas.sql import SQLGenerationResult, ValidationResult
from app.schemas.query import QueryResult, ChartRecommendation, QueryRequest, ClarifyResponse
from app.services.schema_service import SchemaService
from app.services.intent_service import IntentService
from app.services.clarification_service import ClarificationService
from app.services.sql_generator import SQLGeneratorService
from app.services.sql_validator import SQLValidatorService
from app.services.query_executor import QueryExecutorService
from app.services.result_processor import ResultProcessorService
from app.services.history_service import HistoryService
from app.providers import get_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/query", tags=["query"])

# In-memory session store for clarification state
# Maps session_id -> {intent: QueryIntent, schema_context: dict}
_sessions: dict = {}

@router.post("/ask", response_model=ClarifyResponse)
async def ask_question(request: QueryRequest, db: AsyncSession = Depends(get_db)):
    """
    Main entry point. Accepts a natural language question.
    """
    try:
        provider = get_provider()
        schema_service = SchemaService()
        intent_service = IntentService(provider)
        clarification_service = ClarificationService(provider)
        history_service = HistoryService()
        
        # 1. Get schema
        schema_context = await schema_service.get_schema_context()
        
        # 2. Parse intent
        intent = await intent_service.parse_intent(request.question, schema_context)
        
        # 3. Check ambiguities
        session_id = request.session_id or str(uuid.uuid4())
        clarification = await clarification_service.detect_ambiguities(intent, schema_context)
        
        if clarification:
            clarification.session_id = session_id
            _sessions[session_id] = {"intent": intent, "schema_context": schema_context}
            
            # Save to history
            await history_service.save_query(
                db, session_id=session_id, question=request.question,
                execution_status="pending_clarification"
            )
            await db.commit()
            
            return ClarifyResponse(
                session_id=session_id,
                needs_clarification=True,
                clarification=clarification,
                intent=intent
            )
        
        # 4. No ambiguity - generate SQL directly
        sql_generator = SQLGeneratorService(provider)
        sql_result = await sql_generator.generate_sql(intent, schema_context)
        
        validator = SQLValidatorService(schema_context=schema_context)
        validation = validator.validate(sql_result.sql)
        
        if not validation.is_valid:
            return ClarifyResponse(
                session_id=session_id,
                needs_clarification=False,
                intent=intent,
                sql_result=sql_result,
                validation=validation,
                error="; ".join(validation.errors)
            )
            
        executor = QueryExecutorService(timeout=settings.query_timeout, max_rows=settings.max_rows)
        raw_result = await executor.execute(sql_result.sql)
        
        if "error" in raw_result:
            return ClarifyResponse(
                session_id=session_id,
                needs_clarification=False,
                intent=intent,
                sql_result=sql_result,
                validation=validation,
                error=raw_result["error"]
            )
            
        result_processor = ResultProcessorService(provider)
        query_result = await result_processor.process(raw_result, intent, sql_result.sql)
        
        await history_service.save_query(
            db, session_id=session_id, question=request.question,
            sql_query=sql_result.sql, execution_status="success",
            execution_time_ms=raw_result.get("execution_time_ms", 0),
            row_count=raw_result.get("row_count", 0)
        )
        await db.commit()
        
        return ClarifyResponse(
            session_id=session_id,
            needs_clarification=False,
            intent=intent,
            sql_result=sql_result,
            validation=validation,
            result=query_result
        )

    except Exception as e:
        logger.error(f"Error in ask_question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clarify", response_model=ClarifyResponse)
async def clarify(answer: ClarificationAnswer, db: AsyncSession = Depends(get_db)):
    """
    Accept clarification answers, refine intent, generate SQL.
    """
    try:
        session = _sessions.get(answer.session_id)
        if not session:
            raise HTTPException(404, "Session not found")
        
        provider = get_provider()
        clarification_service = ClarificationService(provider)
        sql_generator = SQLGeneratorService(provider)
        
        # 1. Resolve clarifications -> refined intent
        refined_intent = await clarification_service.resolve_clarifications(
            session["intent"], answer, session["schema_context"]
        )
        
        # Update session
        session["intent"] = refined_intent
        
        # 2. Generate SQL
        sql_result = await sql_generator.generate_sql(refined_intent, session["schema_context"])
        
        # 3. Validate
        validator = SQLValidatorService(schema_context=session["schema_context"])
        validation = validator.validate(sql_result.sql)
        
        # Update history
        history_service = HistoryService()
        await history_service.save_query(
            db, session_id=answer.session_id, sql_query=sql_result.sql,
            execution_status="sql_generated"
        )
        await db.commit()
        
        # 4. Return response (don't auto-execute - let user click execute)
        return ClarifyResponse(
            session_id=answer.session_id,
            needs_clarification=False,
            intent=refined_intent,
            sql_result=sql_result,
            validation=validation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in clarify: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
async def execute_query(request: dict, db: AsyncSession = Depends(get_db)):
    """
    Execute validated SQL.
    Expects: {session_id: str, sql: str}
    """
    try:
        session_id = request.get("session_id")
        sql = request.get("sql")
        
        if not session_id or not sql:
            raise HTTPException(status_code=400, detail="session_id and sql are required")
            
        session = _sessions.get(session_id)
        schema_context = session.get("schema_context") if session else None
        intent = session.get("intent") if session else None
        
        if not schema_context:
            schema_service = SchemaService()
            schema_context = await schema_service.get_schema_context()
            
        validator = SQLValidatorService(schema_context=schema_context)
        validation = validator.validate(sql)
        
        if not validation.is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid SQL: {'; '.join(validation.errors)}")
            
        executor = QueryExecutorService(timeout=settings.query_timeout, max_rows=settings.max_rows)
        raw_result = await executor.execute(sql)
        
        history_service = HistoryService()
        
        if "error" in raw_result:
            await history_service.save_query(
                db, session_id=session_id, sql_query=sql,
                execution_status="error", error_message=raw_result["error"]
            )
            await db.commit()
            raise HTTPException(status_code=400, detail=raw_result["error"])
            
        provider = get_provider()
        result_processor = ResultProcessorService(provider)
        
        # We might not have intent if session expired, pass None or basic intent
        query_result = await result_processor.process(raw_result, intent, sql)
        
        await history_service.save_query(
            db, session_id=session_id, sql_query=sql,
            execution_status="success",
            execution_time_ms=raw_result.get("execution_time_ms", 0),
            row_count=raw_result.get("row_count", 0)
        )
        await db.commit()
        
        return query_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in execute_query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
