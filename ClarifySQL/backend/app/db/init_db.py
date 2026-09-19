import asyncio
from app.models.database import engine
from app.models.tables import Base
from app.models.query_history import QueryHistory
from app.db.seed import seed_data

async def init_db():
    print("Initializing database...")
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created.")
    
    print("Seeding database...")
    await seed_data()
    print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(init_db())
