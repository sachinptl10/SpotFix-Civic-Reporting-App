from fastapi import APIRouter, HTTPException
import logging

from app.services.schema_service import SchemaService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/schema", tags=["schema"])

@router.get("/tables")
async def get_tables():
    """Return all tables with columns for the schema explorer."""
    try:
        schema_service = SchemaService()
        return await schema_service.get_tables_list()
    except Exception as e:
        logger.error(f"Error getting tables: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/relationships")
async def get_relationships():
    """Return FK relationships."""
    try:
        schema_service = SchemaService()
        return await schema_service.get_relationships()
    except Exception as e:
        logger.error(f"Error getting relationships: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
