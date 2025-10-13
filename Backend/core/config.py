import os
from typing import Optional
from dotenv import load_dotenv

# Load các biến môi trường từ file .env
load_dotenv()
class Settings:
    """Application configuration settings"""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL")
    print(f"Using DATABASE_URL: {DATABASE_URL}")
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
