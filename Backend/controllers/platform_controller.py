from sqlalchemy.ext.asyncio import AsyncSession
from services.platform_service import PlatformService
from core.response import success_response, error_response
from core.exceptions import NotFoundException, BadRequestException, ConflictException


class PlatformController:
    """Controller layer for Platform operations"""
    
    def __init__(self, db: AsyncSession):
        self.service = PlatformService(db)
    
    async def get_all(self, skip: int, limit: int):
        """Get all platforms with pagination"""
        try:
            platforms = await self.service.get_all(skip, limit)
            return success_response(
                data=platforms,
                message=f"Retrieved {len(platforms)} platforms successfully"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve platforms",
                error=str(e)
            )
    
    async def get_active_platforms(self):
        """Get all active platforms"""
        try:
            platforms = await self.service.get_active_platforms()
            return success_response(
                data=platforms,
                message=f"Retrieved {len(platforms)} active platforms successfully"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve active platforms",
                error=str(e)
            )
    
    async def get_by_id(self, platform_id: int):
        """Get platform by ID"""
        try:
            platform = await self.service.get_by_id(platform_id)
            if not platform:
                raise NotFoundException(f"Platform with ID {platform_id} not found")
            return success_response(
                data=platform,
                message="Platform retrieved successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to retrieve platform",
                error=str(e)
            )
    
    async def create(self, data: dict):
        """Create a new platform"""
        try:
            # Validation
            if "name" not in data:
                raise BadRequestException("Missing required field: name")
            
            # Check if platform name already exists
            existing_platform = await self.service.get_by_name(data["name"])
            if existing_platform:
                raise ConflictException(f"Platform with name '{data['name']}' already exists")
            
            platform = await self.service.create(data)
            return success_response(
                data=platform,
                message="Platform created successfully"
            )
        except (BadRequestException, ConflictException) as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to create platform",
                error=str(e)
            )
    
    async def update(self, platform_id: int, data: dict):
        """Update platform information"""
        try:
            # Check if platform exists
            existing_platform = await self.service.get_by_id(platform_id)
            if not existing_platform:
                raise NotFoundException(f"Platform with ID {platform_id} not found")
            
            # If updating name, check for conflicts
            if "name" in data and data["name"] != existing_platform["name"]:
                conflict_platform = await self.service.get_by_name(data["name"])
                if conflict_platform:
                    raise ConflictException(f"Platform with name '{data['name']}' already exists")
            
            platform = await self.service.update(platform_id, data)
            return success_response(
                data=platform,
                message="Platform updated successfully"
            )
        except (NotFoundException, ConflictException) as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to update platform",
                error=str(e)
            )
    
    async def delete(self, platform_id: int):
        """Delete a platform"""
        try:
            success = await self.service.delete(platform_id)
            if not success:
                raise NotFoundException(f"Platform with ID {platform_id} not found")
            return success_response(
                message="Platform deleted successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to delete platform",
                error=str(e)
            )
