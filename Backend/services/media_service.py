from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
import sys
sys.path.append('..')
from models.model import MediaLibrary
from typing import List, Optional, Dict


class MediaService:
    """Service layer for MediaLibrary operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        query = select(MediaLibrary).offset(skip).limit(limit)
        result = await self.db.execute(query)
        media_files = result.scalars().all()
        return [self._to_dict(m) for m in media_files]
    
    async def get_by_id(self, media_id: int) -> Optional[Dict]:
        query = select(MediaLibrary).where(MediaLibrary.id == media_id)
        result = await self.db.execute(query)
        media = result.scalar_one_or_none()
        return self._to_dict(media) if media else None
    
    async def get_by_user(self, user_id: int, skip: int = 0, limit: int = 20) -> List[Dict]:
        query = select(MediaLibrary).where(MediaLibrary.user_id == user_id).offset(skip).limit(limit)
        result = await self.db.execute(query)
        media_files = result.scalars().all()
        return [self._to_dict(m) for m in media_files]
    
    async def get_by_type(self, file_type: str, skip: int = 0, limit: int = 20) -> List[Dict]:
        query = select(MediaLibrary).where(MediaLibrary.file_type == file_type).offset(skip).limit(limit)
        result = await self.db.execute(query)
        media_files = result.scalars().all()
        return [self._to_dict(m) for m in media_files]
    
    async def mark_as_processed(self, media_id: int) -> Optional[Dict]:
        return await self.update(media_id, {"is_processed": True})
    
    async def create(self, data: dict) -> Dict:
        media = MediaLibrary(**data)
        self.db.add(media)
        await self.db.commit()
        await self.db.refresh(media)
        return self._to_dict(media)
    
    async def update(self, media_id: int, data: dict) -> Optional[Dict]:
        query = update(MediaLibrary).where(MediaLibrary.id == media_id).values(**data).returning(MediaLibrary)
        result = await self.db.execute(query)
        await self.db.commit()
        media = result.scalar_one_or_none()
        return self._to_dict(media) if media else None
    
    async def delete(self, media_id: int) -> bool:
        query = delete(MediaLibrary).where(MediaLibrary.id == media_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, media: MediaLibrary) -> Dict:
        if not media:
            return None
        return {
            "id": media.id,
            "user_id": media.user_id,
            "file_name": media.file_name,
            "file_type": media.file_type.value if hasattr(media.file_type, 'value') else media.file_type,
            "file_url": media.file_url,
            "file_size": media.file_size,
            "thumbnail_url": media.thumbnail_url,
            "duration": media.duration,
            "width": media.width,
            "height": media.height,
            "mime_type": media.mime_type,
            "storage_path": media.storage_path,
            "is_processed": media.is_processed,
            "tags": media.tags,
            "created_at": media.created_at.isoformat() if media.created_at else None,
            "updated_at": media.updated_at.isoformat() if media.updated_at else None
        }
