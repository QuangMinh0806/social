import os
from typing import Optional


class Settings:
    """Application configuration settings"""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:password@localhost:5432/social_media_db"
    )
    
    # Application
    APP_NAME: str = "Social Media Auto Posting API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    
    # API Settings
    API_PREFIX: str = "/api"
    
    # Pagination
    DEFAULT_SKIP: int = 0
    DEFAULT_LIMIT: int = 100
    MAX_LIMIT: int = 1000


settings = Settings()
