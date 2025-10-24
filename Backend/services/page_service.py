from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
import sys
sys.path.append('..')
from models.model import Page, Platform
from typing import List, Optional, Dict
from datetime import datetime


class PageService:
    """Service layer for Page operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get all pages with pagination"""
        query = select(Page).options(selectinload(Page.platform)).offset(skip).limit(limit)
        result = await self.db.execute(query)
        pages = result.scalars().all()
        return [self._to_dict(page) for page in pages]
    
    async def get_by_id(self, page_id: int) -> Optional[Dict]:
        """Get page by ID"""
        query = select(Page).options(selectinload(Page.platform)).where(Page.id == page_id)
        result = await self.db.execute(query)
        page = result.scalar_one_or_none()
        return self._to_dict(page) if page else None
    
    async def get_by_user(self, user_id: int, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get all pages created by a specific user"""
        query = (
            select(Page)
            .options(selectinload(Page.platform))
            .where(Page.created_by == user_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        pages = result.scalars().all()
        return [self._to_dict(page) for page in pages]
    
    async def get_by_platform(self, platform_id: int, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get all pages for a specific platform"""
        query = (
            select(Page)
            .options(selectinload(Page.platform))
            .where(Page.platform_id == platform_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        pages = result.scalars().all()
        return [self._to_dict(page) for page in pages]
    
    async def get_by_platform_and_page_id(self, platform_id: int, page_id: str) -> Optional[Dict]:
        """Get page by platform_id and page_id"""
        query = (
            select(Page)
            .options(selectinload(Page.platform))
            .where(Page.platform_id == platform_id, Page.page_id == page_id)
        )
        result = await self.db.execute(query)
        page = result.scalar_one_or_none()
        return self._to_dict(page) if page else None
    
    async def create(self, data: dict) -> Dict:
        """Create a new page"""
        print("Creating page with data:", data)
        
        try:
            # Check if page already exists
            if 'platform_id' in data and 'page_id' in data:
                existing_page = await self.get_by_platform_and_page_id(data['platform_id'], data['page_id'])
                if existing_page:
                    print(f"Page already exists with platform_id={data['platform_id']}, page_id={data['page_id']}")
                    # Update existing page instead of creating new one
                    return await self.update_tokens(existing_page['id'], data)
            
            # Convert string datetime to datetime object if needed
            if 'token_expires_at' in data and isinstance(data['token_expires_at'], str):
                from dateutil import parser
                try:
                    data['token_expires_at'] = parser.parse(data['token_expires_at'])
                except:
                    # If parsing fails, remove it
                    data.pop('token_expires_at', None)
            
            # Ensure refresh_token is handled properly
            if 'refresh_token' not in data:
                data['refresh_token'] = None
            
            print("Creating new page with processed data:", data)
            page = Page(**data)
            self.db.add(page)
            await self.db.commit()
            await self.db.refresh(page)
            print("Page created successfully with id:", page.id)
            return self._to_dict(page)
            
        except Exception as e:
            print(f"Error creating page: {str(e)}")
            await self.db.rollback()
            raise e
    
    async def update(self, page_id: int, data: dict) -> Optional[Dict]:
        """Update page information"""
        query = (
            update(Page)
            .where(Page.id == page_id)
            .values(**data)
            .returning(Page)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        page = result.scalar_one_or_none()
        return self._to_dict(page) if page else None
    
    async def update_token(self, page_id: int, access_token: str, expires_at: datetime, refresh_token: str = None) -> Optional[Dict]:
        """Update page access token, refresh token and expiration"""
        data = {
            "access_token": access_token,
            "token_expires_at": expires_at
        }
        if refresh_token is not None:
            data["refresh_token"] = refresh_token
        return await self.update(page_id, data)
    
    async def update_tokens(self, page_id: int, access_token: str, refresh_token: str, expires_at: datetime = None) -> Optional[Dict]:
        """Update both access token and refresh token"""
        data = {
            "access_token": access_token,
            "refresh_token": refresh_token
        }
        if expires_at:
            data["token_expires_at"] = expires_at
        return await self.update(page_id, data)
    
    async def sync_follower_count(self, page_id: int, follower_count: int) -> Optional[Dict]:
        """Sync follower count and update last sync time"""
        data = {
            "follower_count": follower_count,
            "last_sync_at": datetime.utcnow()
        }
        return await self.update(page_id, data)
    
    async def delete(self, page_id: int) -> bool:
        """Delete a page"""
        query = delete(Page).where(Page.id == page_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, page: Page) -> Dict:
        """Convert SQLAlchemy Page model to dictionary"""
        if not page:
            return None
        
        # Get platform data if relationship is loaded
        platform_data = None
        if hasattr(page, 'platform') and page.platform:
            platform_data = {
                "id": page.platform.id,
                "name": page.platform.name,
                "icon": getattr(page.platform, 'icon', None),
                "color": getattr(page.platform, 'color', None),
            }
        
        return {
            "id": page.id,
            "platform_id": page.platform_id,
            "platform": platform_data,
            "page_id": page.page_id,
            "page_name": page.page_name,
            "page_url": page.page_url,
            "avatar_url": page.avatar_url,
            "access_token": page.access_token,
            "refresh_token": getattr(page, 'refresh_token', None),  # Thêm refresh_token
            "token_expires_at": page.token_expires_at.isoformat() if page.token_expires_at else None,
            "status": page.status.value if hasattr(page.status, 'value') else page.status,
            "follower_count": page.follower_count,
            "created_by": page.created_by,
            "connected_at": page.connected_at.isoformat() if page.connected_at else None,
            "last_sync_at": page.last_sync_at.isoformat() if page.last_sync_at else None,
            "created_at": page.created_at.isoformat() if page.created_at else None,
            "updated_at": page.updated_at.isoformat() if page.updated_at else None
        }
