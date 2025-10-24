from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
import sys
sys.path.append('..')
from models.model import Hashtag
from typing import List, Optional, Dict


class HashtagService:
    """Service layer for Hashtag operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        query = select(Hashtag).offset(skip).limit(limit)
        result = await self.db.execute(query)
        hashtags = result.scalars().all()
        return [self._to_dict(h) for h in hashtags]
    
    async def get_by_id(self, hashtag_id: int) -> Optional[Dict]:
        query = select(Hashtag).where(Hashtag.id == hashtag_id)
        result = await self.db.execute(query)
        hashtag = result.scalar_one_or_none()
        return self._to_dict(hashtag) if hashtag else None
    
    async def get_by_name(self, name: str) -> Optional[Dict]:
        query = select(Hashtag).where(Hashtag.name == name)
        result = await self.db.execute(query)
        hashtag = result.scalar_one_or_none()
        return self._to_dict(hashtag) if hashtag else None
    
    async def search_by_name(self, search_term: str, limit: int = 50) -> List[Dict]:
        query = select(Hashtag).where(Hashtag.name.ilike(f"%{search_term}%")).limit(limit)
        result = await self.db.execute(query)
        hashtags = result.scalars().all()
        return [self._to_dict(h) for h in hashtags]
    
    async def get_popular_hashtags(self, limit: int = 50) -> List[Dict]:
        query = select(Hashtag).order_by(Hashtag.usage_count.desc()).limit(limit)
        result = await self.db.execute(query)
        hashtags = result.scalars().all()
        return [self._to_dict(h) for h in hashtags]
    
    async def increment_usage(self, hashtag_id: int) -> Optional[Dict]:
        hashtag = await self.get_by_id(hashtag_id)
        if not hashtag:
            return None
        new_count = hashtag["usage_count"] + 1
        return await self.update(hashtag_id, {"usage_count": new_count})
    
    async def create(self, data: dict) -> Dict:
        hashtag = Hashtag(**data)
        self.db.add(hashtag)
        await self.db.commit()
        await self.db.refresh(hashtag)
        return self._to_dict(hashtag)
    
    async def update(self, hashtag_id: int, data: dict) -> Optional[Dict]:
        query = update(Hashtag).where(Hashtag.id == hashtag_id).values(**data).returning(Hashtag)
        result = await self.db.execute(query)
        await self.db.commit()
        hashtag = result.scalar_one_or_none()
        return self._to_dict(hashtag) if hashtag else None
    
    async def delete(self, hashtag_id: int) -> bool:
        query = delete(Hashtag).where(Hashtag.id == hashtag_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, hashtag: Hashtag) -> Dict:
        if not hashtag:
            return None
        return {
            "id": hashtag.id,
            "name": hashtag.name,
            "usage_count": hashtag.usage_count,
            "created_at": hashtag.created_at.isoformat() if hashtag.created_at else None
        }
