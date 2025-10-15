from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
from pathlib import Path
from fastapi.responses import PlainTextResponse


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
    analytics_router,
    tiktok_router,
    youtube_router,
    facebook_router
)


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Social Media Auto Posting API - Hệ thống quản lý đăng bài tự động lên mạng xã hội",
    docs_url="/docs",
    redoc_url="/redoc"
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
app.include_router(tiktok_router.router)
app.include_router(youtube_router.router)
app.include_router(facebook_router.router)

# Mount static files directory for uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# @app.on_event("startup")
# async def startup_event():
#     """Initialize database on startup - create tables if they don't exist"""
#     try:
#         async with engine.begin() as conn:
#             await conn.run_sync(Base.metadata.create_all)
#         print("✅ Database tables initialized successfully!")
#     except Exception as e:
#         print(f"⚠️ Warning: Could not initialize database: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await engine.dispose()
    print("👋 Application shutdown complete")



@app.get("/tiktokHaQNpbAkImf0dbxp7GrOR7oF2H8vb3WZ.txt", response_class=PlainTextResponse)
def verify_tiktok_file():

    return "tiktok-developers-site-verification=HaQNpbAkImf0dbxp7GrOR7oF2H8vb3WZ"

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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )



