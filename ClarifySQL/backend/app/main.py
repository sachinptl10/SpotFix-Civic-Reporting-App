from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: create tables if they don't exist
    from app.models.database import async_engine
    from app.models.tables import Base
    # import models to register with Base
    try:
        from app.models.query_history import QueryHistory
    except ImportError:
        pass
    
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # On shutdown: dispose engine
    await async_engine.dispose()

app = FastAPI(
    title="ClarifySQL",
    description="Natural Language to SQL with Clarification Engine",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
from app.api.routes.query import router as query_router
from app.api.routes.schema import router as schema_router
from app.api.routes.history import router as history_router

app.include_router(query_router)
app.include_router(schema_router)
app.include_router(history_router)

@app.get("/")
async def root():
    return {"message": "ClarifySQL API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
