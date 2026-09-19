from abc import ABC, abstractmethod
from typing import Type, TypeVar, Optional
from pydantic import BaseModel
import json

T = TypeVar("T", bound=BaseModel)

class LLMProvider(ABC):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
    
    @abstractmethod
    async def generate(self, prompt: str, system: str = "", temperature: float = 0.1) -> str:
        """Generate a text response."""
        ...
    
    async def generate_structured(self, prompt: str, system: str, response_model: Type[T], temperature: float = 0.1) -> T:
        """Generate a structured response parsed into a Pydantic model."""
        schema_str = json.dumps(response_model.model_json_schema(), indent=2)
        enhanced_prompt = f"{prompt}\n\nRespond with ONLY valid JSON matching this schema:\n{schema_str}"
        raw = await self.generate(enhanced_prompt, system=system, temperature=temperature)
        # Extract JSON from response (handle markdown code blocks)
        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        return response_model.model_validate_json(cleaned)
