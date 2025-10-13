import asyncio
import sys
sys.path.append('.')

from config.database import async_session_maker
from models.model import User
from sqlalchemy import select

async def create_test_user():
    """Create a test user for testing"""
    
    async with async_session_maker() as db:
        # Check if user exists
        query = select(User).where(User.id == 1)
        result = await db.execute(query)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"✅ User already exists: {existing_user.username}")
            return
        
        # Create test user
        user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password_here",  # In production, use proper hashing
            full_name="Test User",
            role="admin"
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        print(f"✅ Created test user: {user.username} (ID: {user.id})")

if __name__ == "__main__":
    asyncio.run(create_test_user())
