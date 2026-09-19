from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.models.database import get_db
from app.services.history_service import HistoryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("")
async def get_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get recent query history."""
    try:
        history_service = HistoryService()
        return await history_service.get_history(db, limit=limit)
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{query_id}")
async def get_query(query_id: int, db: AsyncSession = Depends(get_db)):
    """Get single history entry."""
    try:
        history_service = HistoryService()
        query = await history_service.get_query(db, query_id)
        if not query:
            raise HTTPException(status_code=404, detail="Query not found")
        return query
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting query {query_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
