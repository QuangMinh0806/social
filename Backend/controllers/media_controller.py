from sqlalchemy.ext.asyncio import AsyncSession
from services.media_service import MediaService
from models.model import MediaType


class MediaController:
    def __init__(self, db: AsyncSession):
        self.service = MediaService(db)

    async def get_all(self, skip: int, limit: int):
        """Get all media items"""
        try:
            media_items = await self.service.get_all(skip, limit)
            return {
                "success": True,
                "data": media_items,
                "message": "Media items retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_by_id(self, media_id: int):
        """Get media by ID"""
        try:
            media = await self.service.get_by_id(media_id)
            if not media:
                return {
                    "success": False,
                    "data": None,
                    "message": "Media not found"
                }
            return {
                "success": True,
                "data": media,
                "message": "Media retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_by_user(self, user_id: int, skip: int, limit: int):
        """Get media by user"""
        try:
            media_items = await self.service.get_by_user(user_id, skip, limit)
            return {
                "success": True,
                "data": media_items,
                "message": "User media retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_by_type(self, file_type: str, skip: int, limit: int):
        """Get media by type"""
        try:
            media_type = MediaType[file_type]
            media_items = await self.service.get_by_type(media_type, skip, limit)
            return {
                "success": True,
                "data": media_items,
                "message": f"Media of type {file_type} retrieved successfully"
            }
        except KeyError:
            return {
                "success": False,
                "data": None,
                "message": f"Invalid media type: {file_type}"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def create(self, media_data: dict):
        """Create new media"""
        try:
            media = await self.service.create(media_data)
            return {
                "success": True,
                "data": media,
                "message": "Media created successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def update(self, media_id: int, media_data: dict):
        """Update media"""
        try:
            media = await self.service.update(media_id, media_data)
            if not media:
                return {
                    "success": False,
                    "data": None,
                    "message": "Media not found"
                }
            return {
                "success": True,
                "data": media,
                "message": "Media updated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def delete(self, media_id: int):
        """Delete media"""
        try:
            success = await self.service.delete(media_id)
            if not success:
                return {
                    "success": False,
                    "data": None,
                    "message": "Media not found"
                }
            return {
                "success": True,
                "data": None,
                "message": "Media deleted successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def mark_as_processed(self, media_id: int):
        """Mark media as processed"""
        try:
            media = await self.service.mark_as_processed(media_id)
            if not media:
                return {
                    "success": False,
                    "data": None,
                    "message": "Media not found"
                }
            return {
                "success": True,
                "data": media,
                "message": "Media marked as processed"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }
