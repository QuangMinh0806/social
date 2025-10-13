from sqlalchemy.ext.asyncio import AsyncSession
from services.post_service import PostService
from models.model import PostStatus
from datetime import datetime


class PostController:
    def __init__(self, db: AsyncSession):
        self.service = PostService(db)

    async def get_all(self, skip: int, limit: int):
        """Get all posts"""
        try:
            posts = await self.service.get_all(skip, limit)
            return {
                "success": True,
                "data": posts,
                "total": len(posts),
                "message": "Posts retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_by_id(self, post_id: int):
        """Get post by ID"""
        try:
            post = await self.service.get_by_id(post_id)
            if not post:
                return {
                    "success": False,
                    "data": None,
                    "message": "Post not found"
                }
            return {
                "success": True,
                "data": post,
                "message": "Post retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_by_status(self, status: str, skip: int, limit: int):
        """Get posts by status"""
        try:
            post_status = PostStatus[status]
            posts = await self.service.get_by_status(post_status, skip, limit)
            return {
                "success": True,
                "data": posts,
                "total": len(posts),
                "message": f"Posts with status {status} retrieved successfully"
            }
        except KeyError:
            return {
                "success": False,
                "data": None,
                "message": f"Invalid post status: {status}"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_by_page(self, page_id: int, skip: int, limit: int):
        """Get posts by page"""
        try:
            posts = await self.service.get_by_page(page_id, skip, limit)
            return {
                "success": True,
                "data": posts,
                "total": len(posts),
                "message": "Page posts retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_by_user(self, user_id: int, skip: int, limit: int):
        """Get posts by user"""
        try:
            posts = await self.service.get_by_user(user_id, skip, limit)
            return {
                "success": True,
                "data": posts,
                "total": len(posts),
                "message": "User posts retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_scheduled(self, skip: int, limit: int):
        """Get scheduled posts"""
        try:
            posts = await self.service.get_scheduled(skip, limit)
            return {
                "success": True,
                "data": posts,
                "total": len(posts),
                "message": "Scheduled posts retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def create(self, post_data: dict):
        """Create new post"""
        try:
            post = await self.service.create(post_data)
            return {
                "success": True,
                "data": post,
                "message": "Post created successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def update(self, post_id: int, post_data: dict):
        """Update post"""
        try:
            post = await self.service.update(post_id, post_data)
            if not post:
                return {
                    "success": False,
                    "data": None,
                    "message": "Post not found"
                }
            return {
                "success": True,
                "data": post,
                "message": "Post updated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def delete(self, post_id: int):
        """Delete post"""
        try:
            success = await self.service.delete(post_id)
            if not success:
                return {
                    "success": False,
                    "data": None,
                    "message": "Post not found"
                }
            return {
                "success": True,
                "data": None,
                "message": "Post deleted successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def update_status(self, post_id: int, status: str):
        """Update post status"""
        try:
            post_status = PostStatus[status]
            post = await self.service.update_status(post_id, post_status)
            if not post:
                return {
                    "success": False,
                    "data": None,
                    "message": "Post not found"
                }
            return {
                "success": True,
                "data": post,
                "message": "Post status updated successfully"
            }
        except KeyError:
            return {
                "success": False,
                "data": None,
                "message": f"Invalid post status: {status}"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def publish_post(self, post_id: int):
        """Publish a post"""
        try:
            post = await self.service.publish_post(post_id)
            if not post:
                return {
                    "success": False,
                    "data": None,
                    "message": "Post not found"
                }
            return {
                "success": True,
                "data": post,
                "message": "Post published successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def schedule_post(self, post_id: int, scheduled_at: str):
        """Schedule a post"""
        try:
            scheduled_datetime = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
            post = await self.service.schedule_post(post_id, scheduled_datetime)
            if not post:
                return {
                    "success": False,
                    "data": None,
                    "message": "Post not found"
                }
            return {
                "success": True,
                "data": post,
                "message": "Post scheduled successfully"
            }
        except ValueError as e:
            return {
                "success": False,
                "data": None,
                "message": f"Invalid datetime format: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }