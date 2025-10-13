from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
import sys
sys.path.append('..')
from models.model import Platform
from typing import List, Optional, Dict


class PlatformService:
    """Service layer for Platform operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all platforms with pagination"""
        query = select(Platform).offset(skip).limit(limit)
        result = await self.db.execute(query)
        platforms = result.scalars().all()
        return [self._to_dict(platform) for platform in platforms]
    
    async def get_active_platforms(self) -> List[Dict]:
        """Get all active platforms"""
        query = select(Platform).where(Platform.is_active == True)
        result = await self.db.execute(query)
        platforms = result.scalars().all()
        return [self._to_dict(platform) for platform in platforms]
    
    async def get_by_id(self, platform_id: int) -> Optional[Dict]:
        """Get platform by ID"""
        query = select(Platform).where(Platform.id == platform_id)
        result = await self.db.execute(query)
        platform = result.scalar_one_or_none()
        return self._to_dict(platform) if platform else None
    
    async def get_by_name(self, name: str) -> Optional[Dict]:
        """Get platform by name"""
        query = select(Platform).where(Platform.name == name)
        result = await self.db.execute(query)
        platform = result.scalar_one_or_none()
        return self._to_dict(platform) if platform else None
    
    async def create(self, data: dict) -> Dict:
        """Create a new platform"""
        platform = Platform(**data)
        self.db.add(platform)
        await self.db.commit()
        await self.db.refresh(platform)
        return self._to_dict(platform)
    
    async def update(self, platform_id: int, data: dict) -> Optional[Dict]:
        """Update platform information"""
        query = (
            update(Platform)
            .where(Platform.id == platform_id)
            .values(**data)
            .returning(Platform)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        platform = result.scalar_one_or_none()
        return self._to_dict(platform) if platform else None
    
    async def delete(self, platform_id: int) -> bool:
        """Delete a platform"""
        query = delete(Platform).where(Platform.id == platform_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, platform: Platform) -> Dict:
        """Convert SQLAlchemy Platform model to dictionary"""
        if not platform:
            return None
        return {
            "id": platform.id,
            "name": platform.name,
            "icon_url": platform.icon_url,
            "is_active": platform.is_active,
            "created_at": platform.created_at.isoformat() if platform.created_at else None
        }
