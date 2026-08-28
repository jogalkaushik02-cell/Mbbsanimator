import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    KNOWLEDGE_BASE_DIR: Path = BASE_DIR / "knowledge_base"
    MANIM_TEMPLATES_DIR: Path = BASE_DIR / "manim_templates"
    OUTPUT_DIR: Path = BASE_DIR / "output"
    PIPER_MODEL_DIR: Path = BASE_DIR / "piper_models"

    # API
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # External APIs (optional - for internet access)
    SERPER_API_KEY: str = ""  # For Google search
    PUBMED_API_KEY: str = ""  # For PubMed
    WIKIPEDIA_LANG: str = "en"

    # Processing
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    MAX_VIDEO_DURATION: int = 300  # seconds
    DEFAULT_VIDEO_QUALITY: str = "720p30"

    # Medical ontology
    UMLS_API_KEY: str = ""  # For UMLS terminology

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# Ensure output directory exists
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
settings.PIPER_MODEL_DIR.mkdir(parents=True, exist_ok=True)