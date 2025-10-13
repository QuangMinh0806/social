from sqlalchemy.ext.asyncio import AsyncSession
from services.page_service import PageService
from core.response import success_response, error_response
from core.exceptions import NotFoundException, BadRequestException
from datetime import datetime


class PageController:
    """Controller layer for Page operations"""
    
    def __init__(self, db: AsyncSession):
        self.service = PageService(db)
    
    async def get_all(self, skip: int, limit: int):
        """Get all pages with pagination"""
        try:
            pages = await self.service.get_all(skip, limit)
            return success_response(
                data=pages,
                message=f"Retrieved {len(pages)} pages successfully"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve pages",
                error=str(e)
            )
    
    async def get_by_id(self, page_id: int):
        """Get page by ID"""
        try:
            page = await self.service.get_by_id(page_id)
            if not page:
                raise NotFoundException(f"Page with ID {page_id} not found")
            return success_response(
                data=page,
                message="Page retrieved successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to retrieve page",
                error=str(e)
            )
    
    async def get_by_user(self, user_id: int, skip: int, limit: int):
        """Get all pages created by a user"""
        try:
            pages = await self.service.get_by_user(user_id, skip, limit)
            return success_response(
                data=pages,
                message=f"Retrieved {len(pages)} pages for user {user_id}"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve pages by user",
                error=str(e)
            )
    
    async def get_by_platform(self, platform_id: int, skip: int, limit: int):
        """Get all pages for a platform"""
        try:
            pages = await self.service.get_by_platform(platform_id, skip, limit)
            return success_response(
                data=pages,
                message=f"Retrieved {len(pages)} pages for platform {platform_id}"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve pages by platform",
                error=str(e)
            )
    
    async def create(self, data: dict):
        """Create a new page"""
        try:
            # Validation
            required_fields = ["platform_id", "page_id", "page_name", "created_by"]
            for field in required_fields:
                if field not in data:
                    raise BadRequestException(f"Missing required field: {field}")
            
            page = await self.service.create(data)
            return success_response(
                data=page,
                message="Page created successfully"
            )
        except BadRequestException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to create page",
                error=str(e)
            )
    
    async def update(self, page_id: int, data: dict):
        """Update page information"""
        try:
            # Check if page exists
            existing_page = await self.service.get_by_id(page_id)
            if not existing_page:
                raise NotFoundException(f"Page with ID {page_id} not found")
            
            page = await self.service.update(page_id, data)
            return success_response(
                data=page,
                message="Page updated successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to update page",
                error=str(e)
            )
    
    async def update_token(self, page_id: int, data: dict):
        """Update page access token"""
        try:
            # Validation
            required_fields = ["access_token", "token_expires_at"]
            for field in required_fields:
                if field not in data:
                    raise BadRequestException(f"Missing required field: {field}")
            
            # Parse datetime string
            expires_at = datetime.fromisoformat(data["token_expires_at"])
            
            page = await self.service.update_token(
                page_id,
                data["access_token"],
                expires_at
            )
            if not page:
                raise NotFoundException(f"Page with ID {page_id} not found")
            
            return success_response(
                data=page,
                message="Page token updated successfully"
            )
        except (BadRequestException, NotFoundException) as e:
            raise e
        except ValueError as e:
            raise BadRequestException(f"Invalid datetime format: {str(e)}")
        except Exception as e:
            return error_response(
                message="Failed to update page token",
                error=str(e)
            )
    
    async def sync_follower_count(self, page_id: int, data: dict):
        """Sync follower count for a page"""
        try:
            # Validation
            if "follower_count" not in data:
                raise BadRequestException("Missing required field: follower_count")
            
            page = await self.service.sync_follower_count(
                page_id,
                data["follower_count"]
            )
            if not page:
                raise NotFoundException(f"Page with ID {page_id} not found")
            
            return success_response(
                data=page,
                message="Follower count synced successfully"
            )
        except (BadRequestException, NotFoundException) as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to sync follower count",
                error=str(e)
            )
    
    async def delete(self, page_id: int):
        """Delete a page"""
        try:
            success = await self.service.delete(page_id)
            if not success:
                raise NotFoundException(f"Page with ID {page_id} not found")
            return success_response(
                message="Page deleted successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to delete page",
                error=str(e)
            )
