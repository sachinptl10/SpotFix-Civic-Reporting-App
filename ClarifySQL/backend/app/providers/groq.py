from app.providers.base import LLMProvider
from groq import AsyncGroq

class GroqProvider(LLMProvider):
    def __init__(self, api_key: str | None = None):
        super().__init__(api_key)
        self.client = AsyncGroq(api_key=api_key)
        self.model = "llama-3.1-70b-versatile"
    
    async def generate(self, prompt: str, system: str = "", temperature: float = 0.1) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
        )
        return response.choices[0].message.content
