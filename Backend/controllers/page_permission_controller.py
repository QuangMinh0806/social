from sqlalchemy.ext.asyncio import AsyncSession
from services.page_permission_service import PagePermissionService
from core.response import success_response, error_response
from core.exceptions import NotFoundException, BadRequestException, ConflictException


class PagePermissionController:
    """Controller layer for PagePermission operations"""
    
    def __init__(self, db: AsyncSession):
        self.service = PagePermissionService(db)
    
    async def get_all(self, skip: int, limit: int):
        """Get all page permissions"""
        try:
            permissions = await self.service.get_all(skip, limit)
            return success_response(
                data=permissions,
                message=f"Retrieved {len(permissions)} permissions successfully"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve permissions",
                error=str(e)
            )
    
    async def get_by_id(self, permission_id: int):
        """Get permission by ID"""
        try:
            permission = await self.service.get_by_id(permission_id)
            if not permission:
                raise NotFoundException(f"Permission with ID {permission_id} not found")
            return success_response(
                data=permission,
                message="Permission retrieved successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to retrieve permission",
                error=str(e)
            )
    
    async def get_user_pages(self, user_id: int):
        """Get all pages user has access to"""
        try:
            permissions = await self.service.get_user_pages(user_id)
            return success_response(
                data=permissions,
                message=f"Retrieved {len(permissions)} page permissions for user"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve user pages",
                error=str(e)
            )
    
    async def check_permission(self, user_id: int, page_id: int):
        """Check if user has permission for page"""
        try:
            permission = await self.service.check_permission(user_id, page_id)
            if not permission:
                return success_response(
                    data=None,
                    message="User does not have permission for this page"
                )
            return success_response(
                data=permission,
                message="Permission found"
            )
        except Exception as e:
            return error_response(
                message="Failed to check permission",
                error=str(e)
            )
    
    async def create(self, data: dict):
        """Create new page permission"""
        try:
            # Validation
            required_fields = ["user_id", "page_id"]
            for field in required_fields:
                if field not in data:
                    raise BadRequestException(f"Missing required field: {field}")
            
            # Check if permission already exists
            existing = await self.service.check_permission(
                data["user_id"],
                data["page_id"]
            )
            if existing:
                raise ConflictException(
                    f"Permission already exists for user {data['user_id']} and page {data['page_id']}"
                )
            
            permission = await self.service.create(data)
            return success_response(
                data=permission,
                message="Permission created successfully"
            )
        except (BadRequestException, ConflictException) as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to create permission",
                error=str(e)
            )
    
    async def update(self, permission_id: int, data: dict):
        """Update page permission"""
        try:
            existing = await self.service.get_by_id(permission_id)
            if not existing:
                raise NotFoundException(f"Permission with ID {permission_id} not found")
            
            permission = await self.service.update(permission_id, data)
            return success_response(
                data=permission,
                message="Permission updated successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to update permission",
                error=str(e)
            )
    
    async def delete(self, permission_id: int):
        """Delete page permission"""
        try:
            success = await self.service.delete(permission_id)
            if not success:
                raise NotFoundException(f"Permission with ID {permission_id} not found")
            return success_response(
                message="Permission deleted successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to delete permission",
                error=str(e)
            )
