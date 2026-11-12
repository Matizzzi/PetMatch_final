"""
Configuración de la API.

Todo lo que cambia entre local, Render o un futuro deploy vive acá
(variables de entorno + defaults). Los algoritmos leen `settings`,
no números sueltos en los routers.
"""
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True,
    )

    APP_NAME: str = "PetMatch API"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = ""
    BASE_URL: str = "http://localhost:8000"
    RENDER_EXTERNAL_URL: str = ""

    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    GROQ_ENDPOINT: str = "https://api.groq.com/openai/v1/chat/completions"
    GEMINI_MODELS: str = (
        "gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite,"
        "gemini-flash-lite-latest,gemini-3.5-flash,gemini-flash-latest,"
        "gemini-3.1-flash-lite"
    )
    GEMINI_ENDPOINT: str = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    CORS_ORIGINS: str = "*"
    IMAGE_FALLBACK_URL: str = (
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop"
    )

    GUEST_EMAIL: str = "comunidad@petmatch.app"
    GUEST_NAME: str = "Comunidad PetMatch"

    MATCH_UMBRAL: float = 48.0
    MATCH_PESO_DISTANCIA: float = 0.35
    MATCH_PESO_TIEMPO: float = 0.20
    MATCH_PESO_TEXTO: float = 0.45
    MATCH_LIMITE_AVISTAMIENTOS: int = 200
    MATCH_PISO_ZONA: float = 52.0
    MATCH_TOPE_CONFLICTO_CERCA: float = 54.0
    MATCH_TOPE_CONFLICTO_LEJOS: float = 34.0

    IA_RATE_MAX: int = 12
    IA_RATE_VENTANA_S: int = 300
    IA_MAX_PART_BYTES: int = 25 * 1024 * 1024

    @property
    def UPLOAD_DIR(self) -> str:
        return str(_BACKEND_ROOT / "uploads")

    @property
    def public_base_url(self) -> str:
        return (self.RENDER_EXTERNAL_URL or self.BASE_URL).rstrip("/")

    @property
    def cors_origins(self) -> List[str]:
        raw = (self.CORS_ORIGINS or "*").strip()
        if raw == "*":
            return ["*"]
        return [origen.strip() for origen in raw.split(",") if origen.strip()]

    @property
    def groq_models(self) -> tuple[str, ...]:
        return (self.GROQ_MODEL,)

    @property
    def gemini_models(self) -> List[str]:
        return [m.strip() for m in self.GEMINI_MODELS.split(",") if m.strip()]


settings = Settings()
