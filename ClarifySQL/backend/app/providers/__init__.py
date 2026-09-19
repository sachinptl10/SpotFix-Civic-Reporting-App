from app.providers.base import LLMProvider
from app.config import settings

def get_provider() -> LLMProvider:
    name = settings.llm_provider.lower()
    if name == "gemini":
        from app.providers.gemini import GeminiProvider
        return GeminiProvider(api_key=settings.gemini_api_key)
    elif name == "openai":
        from app.providers.openai import OpenAIProvider
        return OpenAIProvider(api_key=settings.openai_api_key)
    elif name == "groq":
        from app.providers.groq import GroqProvider
        return GroqProvider(api_key=settings.groq_api_key)
    else:
        raise ValueError(f"Unknown LLM provider: {name}")
