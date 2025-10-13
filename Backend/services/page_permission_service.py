from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
import sys
sys.path.append('..')
from models.model import PagePermission
from typing import List, Optional, Dict


class PagePermissionService:
    """Service layer for PagePermission operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all page permissions with pagination"""
        query = select(PagePermission).offset(skip).limit(limit)
        result = await self.db.execute(query)
        permissions = result.scalars().all()
        return [self._to_dict(perm) for perm in permissions]
    
    async def get_by_id(self, permission_id: int) -> Optional[Dict]:
        """Get permission by ID"""
        query = select(PagePermission).where(PagePermission.id == permission_id)
        result = await self.db.execute(query)
        permission = result.scalar_one_or_none()
        return self._to_dict(permission) if permission else None
    
    async def get_user_pages(self, user_id: int) -> List[Dict]:
        """Get all pages a user has permission to access"""
        query = select(PagePermission).where(PagePermission.user_id == user_id)
        result = await self.db.execute(query)
        permissions = result.scalars().all()
        return [self._to_dict(perm) for perm in permissions]
    
    async def get_page_users(self, page_id: int) -> List[Dict]:
        """Get all users with permission to a specific page"""
        query = select(PagePermission).where(PagePermission.page_id == page_id)
        result = await self.db.execute(query)
        permissions = result.scalars().all()
        return [self._to_dict(perm) for perm in permissions]
    
    async def check_permission(self, user_id: int, page_id: int) -> Optional[Dict]:
        """Check if user has permission for a specific page"""
        query = select(PagePermission).where(
            and_(
                PagePermission.user_id == user_id,
                PagePermission.page_id == page_id
            )
        )
        result = await self.db.execute(query)
        permission = result.scalar_one_or_none()
        return self._to_dict(permission) if permission else None
    
    async def create(self, data: dict) -> Dict:
        """Create a new page permission"""
        permission = PagePermission(**data)
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return self._to_dict(permission)
    
    async def update(self, permission_id: int, data: dict) -> Optional[Dict]:
        """Update page permission"""
        query = (
            update(PagePermission)
            .where(PagePermission.id == permission_id)
            .values(**data)
            .returning(PagePermission)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        permission = result.scalar_one_or_none()
        return self._to_dict(permission) if permission else None
    
    async def delete(self, permission_id: int) -> bool:
        """Delete a page permission"""
        query = delete(PagePermission).where(PagePermission.id == permission_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, permission: PagePermission) -> Dict:
        """Convert SQLAlchemy PagePermission model to dictionary"""
        if not permission:
            return None
        return {
            "id": permission.id,
            "user_id": permission.user_id,
            "page_id": permission.page_id,
            "can_post": permission.can_post,
            "can_edit": permission.can_edit,
            "can_delete": permission.can_delete,
            "created_at": permission.created_at.isoformat() if permission.created_at else None,
            "updated_at": permission.updated_at.isoformat() if permission.updated_at else None
        }
