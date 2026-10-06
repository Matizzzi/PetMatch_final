import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://neondb_owner:npg_VTEdG6hXmPH7@ep-crimson-butterfly-atp0naml-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )
    JWT_SECRET: str = os.getenv("JWT_SECRET", "escribo-yoyo-una-frase-larga-random-solo-tuya-32-caracteres-oo-mas")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))
    BASE_URL: str = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("BASE_URL", "https://petmatch-backend-japt.onrender.com")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6IiYze8t2WdcQ6i0Ikspy2GFskSxyLATlvRtKtiZ4lx0g")

    class Config:
        case_sensitive = True

settings = Settings()
