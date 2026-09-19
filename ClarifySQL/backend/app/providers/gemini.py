from app.providers.base import LLMProvider
from google import genai
from google.genai import types
import asyncio

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str | None = None):
        super().__init__(api_key)
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash"
    
    async def generate(self, prompt: str, system: str = "", temperature: float = 0.1) -> str:
        config = types.GenerateContentConfig(
            system_instruction=system if system else None,
            temperature=temperature,
        )
        def _generate():
            return self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )
        response = await asyncio.to_thread(_generate)
        return response.text
