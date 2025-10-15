from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
import os
from typing import AsyncGenerator
from dotenv import load_dotenv

# Load các biến môi trường từ file .env
load_dotenv()
# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL")

print(f"Using DATABASE_URL: {DATABASE_URL}")
# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    future=True,
    poolclass=NullPool,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Dependency to get database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Initialize database
async def init_db():
    """
    Initialize database and create all tables
    Note: Import models.model before calling this to register all tables
    """
    from models.model import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Close database connection
async def close_db():
    await engine.dispose()
