from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
from pathlib import Path
from sqlalchemy import text
from contextlib import asynccontextmanager

# Import models to register them with Base
from models.model import Base
from config.database import engine

# Import routers
from routers import (
    auth_router,
    user_router,
    platform_router,
    page_router,
    page_permission_router,
    template_router,
    watermark_router,
    media_router,
    hashtag_router,
    post_router,
    analytics_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown"""
    # Startup
    print("🔧 Initializing database connection...")
    try:
        # Create all tables from Base metadata
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Database initialized successfully!")
        print("📋 Tables created/verified:")
        tables = [
            "users", "platforms", "pages", "page_permissions",
            "templates", "watermarks", "media_library", "hashtags", 
            "posts", "post_media", "post_hashtags", "post_analytics"
        ]
        for table in tables:
            print(f"  ✓ {table}")
        print("🚀 Application ready to serve requests!")
        
    except Exception as e:
        print(f"❌ Error: Could not initialize database: {e}")
        print("💡 Please check your DATABASE_URL and ensure PostgreSQL is running")
        # Don't exit - let the app start anyway for debugging
    
    yield  # Application runs here
    
    # Shutdown
    print("🔄 Shutting down application...")
    try:
        await engine.dispose()
        print("✅ Database connections closed successfully")
    except Exception as e:
        print(f"⚠️ Warning during shutdown: {e}")
    print("👋 Application shutdown complete")


# Create FastAPI app with lifespan
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Social Media Auto Posting API - Hệ thống quản lý đăng bài tự động lên mạng xã hội",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(platform_router.router)
app.include_router(page_router.router)
app.include_router(page_permission_router.router)
app.include_router(template_router.router)
app.include_router(watermark_router.router)
app.include_router(media_router.router)
app.include_router(hashtag_router.router)
app.include_router(post_router.router)
app.include_router(analytics_router.router)

# Mount static files directory for uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")



@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Social Media Auto Posting API",
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint with database connection test"""
    health_status = {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "unknown"
    }
    
    try:
        # Test database connection
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            if result:
                health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
