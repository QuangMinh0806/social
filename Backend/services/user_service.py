from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from config.database import Base
import sys
sys.path.append('..')
from models.model import User
from typing import List, Optional, Dict
from datetime import datetime


class UserService:
    """Service layer for User operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 100, search: str = None, role: str = None, status: str = None) -> List[Dict]:
        """Get all users with pagination, search and filters"""
        query = select(User)
        
        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (User.username.ilike(search_pattern)) |
                (User.email.ilike(search_pattern)) |
                (User.full_name.ilike(search_pattern))
            )
        
        # Apply role filter
        if role and role != 'all':
            query = query.where(User.role == role)
        
        # Apply status filter
        if status and status != 'all':
            from models.model import UserStatus
            try:
                status_enum = UserStatus[status]
                query = query.where(User.status == status_enum)
            except KeyError:
                pass
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        users = result.scalars().all()
        return [self._to_dict(user) for user in users]
    
    async def get_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        return self._to_dict(user) if user else None
    
    async def get_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email address"""
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        return self._to_dict(user) if user else None
    
    async def get_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        query = select(User).where(User.username == username)
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        return self._to_dict(user) if user else None
    
    async def create(self, data: dict) -> Dict:
        """Create a new user"""
        user = User(**data)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return self._to_dict(user)
    
    async def update(self, user_id: int, data: dict) -> Optional[Dict]:
        """Update user information"""
        query = (
            update(User)
            .where(User.id == user_id)
            .values(**data)
            .returning(User)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        user = result.scalar_one_or_none()
        return self._to_dict(user) if user else None
    
    async def update_last_login(self, user_id: int) -> Optional[Dict]:
        """Update user's last login timestamp"""
        data = {"last_login": datetime.utcnow()}
        return await self.update(user_id, data)
    
    async def delete(self, user_id: int) -> bool:
        """Delete a user"""
        query = delete(User).where(User.id == user_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, user: User) -> Dict:
        """Convert SQLAlchemy User model to dictionary"""
        if not user:
            return None
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "status": user.status.value if hasattr(user.status, 'value') else user.status,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }
