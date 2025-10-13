from sqlalchemy.ext.asyncio import AsyncSession
from services.hashtag_service import HashtagService


class HashtagController:
    def __init__(self, db: AsyncSession):
        self.service = HashtagService(db)

    async def get_all(self, skip: int, limit: int):
        """Get all hashtags"""
        try:
            hashtags = await self.service.get_all(skip, limit)
            return {
                "success": True,
                "data": hashtags,
                "message": "Hashtags retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_by_id(self, hashtag_id: int):
        """Get hashtag by ID"""
        try:
            hashtag = await self.service.get_by_id(hashtag_id)
            if not hashtag:
                return {
                    "success": False,
                    "data": None,
                    "message": "Hashtag not found"
                }
            return {
                "success": True,
                "data": hashtag,
                "message": "Hashtag retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_popular(self, limit: int):
        """Get popular hashtags"""
        try:
            hashtags = await self.service.get_popular(limit)
            return {
                "success": True,
                "data": hashtags,
                "message": "Popular hashtags retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def search(self, query: str, limit: int):
        """Search hashtags"""
        try:
            hashtags = await self.service.search(query, limit)
            return {
                "success": True,
                "data": hashtags,
                "message": "Search results retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def create(self, hashtag_data: dict):
        """Create new hashtag"""
        try:
            hashtag = await self.service.create(hashtag_data)
            return {
                "success": True,
                "data": hashtag,
                "message": "Hashtag created successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def update(self, hashtag_id: int, hashtag_data: dict):
        """Update hashtag"""
        try:
            hashtag = await self.service.update(hashtag_id, hashtag_data)
            if not hashtag:
                return {
                    "success": False,
                    "data": None,
                    "message": "Hashtag not found"
                }
            return {
                "success": True,
                "data": hashtag,
                "message": "Hashtag updated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def delete(self, hashtag_id: int):
        """Delete hashtag"""
        try:
            success = await self.service.delete(hashtag_id)
            if not success:
                return {
                    "success": False,
                    "data": None,
                    "message": "Hashtag not found"
                }
            return {
                "success": True,
                "data": None,
                "message": "Hashtag deleted successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def increment_usage(self, hashtag_id: int):
        """Increment hashtag usage count"""
        try:
            hashtag = await self.service.increment_usage(hashtag_id)
            if not hashtag:
                return {
                    "success": False,
                    "data": None,
                    "message": "Hashtag not found"
                }
            return {
                "success": True,
                "data": hashtag,
                "message": "Hashtag usage incremented"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }