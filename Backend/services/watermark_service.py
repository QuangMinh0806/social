from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
import sys
sys.path.append('..')
from models.model import Watermark
from typing import List, Optional, Dict


class WatermarkService:
    """Service layer for Watermark operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get all watermarks"""
        query = select(Watermark).offset(skip).limit(limit)
        result = await self.db.execute(query)
        watermarks = result.scalars().all()
        return [self._to_dict(wm) for wm in watermarks]
    
    async def get_by_id(self, watermark_id: int) -> Optional[Dict]:
        """Get watermark by ID"""
        query = select(Watermark).where(Watermark.id == watermark_id)
        result = await self.db.execute(query)
        watermark = result.scalar_one_or_none()
        return self._to_dict(watermark) if watermark else None
    
    async def get_default_watermark(self) -> Optional[Dict]:
        """Get default watermark"""
        query = select(Watermark).where(Watermark.is_default == True)
        result = await self.db.execute(query)
        watermark = result.scalar_one_or_none()
        return self._to_dict(watermark) if watermark else None
    
    async def get_by_user(self, user_id: int) -> List[Dict]:
        """Get watermarks created by user"""
        query = select(Watermark).where(Watermark.created_by == user_id)
        result = await self.db.execute(query)
        watermarks = result.scalars().all()
        return [self._to_dict(wm) for wm in watermarks]
    
    async def create(self, data: dict) -> Dict:
        """Create new watermark"""
        watermark = Watermark(**data)
        self.db.add(watermark)
        await self.db.commit()
        await self.db.refresh(watermark)
        return self._to_dict(watermark)
    
    async def update(self, watermark_id: int, data: dict) -> Optional[Dict]:
        """Update watermark"""
        query = (
            update(Watermark)
            .where(Watermark.id == watermark_id)
            .values(**data)
            .returning(Watermark)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        watermark = result.scalar_one_or_none()
        return self._to_dict(watermark) if watermark else None
    
    async def delete(self, watermark_id: int) -> bool:
        """Delete watermark"""
        query = delete(Watermark).where(Watermark.id == watermark_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, watermark: Watermark) -> Dict:
        """Convert SQLAlchemy Watermark model to dictionary"""
        if not watermark:
            return None
        return {
            "id": watermark.id,
            "name": watermark.name,
            "image_url": watermark.image_url,
            "position": watermark.position.value if hasattr(watermark.position, 'value') else watermark.position,
            "opacity": float(watermark.opacity) if watermark.opacity else 0.80,
            "size": watermark.size,
            "is_default": watermark.is_default,
            "created_by": watermark.created_by,
            "created_at": watermark.created_at.isoformat() if watermark.created_at else None,
            "updated_at": watermark.updated_at.isoformat() if watermark.updated_at else None
        }
