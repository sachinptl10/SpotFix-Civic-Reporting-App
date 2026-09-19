from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/clarifysql"
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    llm_provider: str = "gemini"
    query_timeout: int = 30
    max_rows: int = 1000
    
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
