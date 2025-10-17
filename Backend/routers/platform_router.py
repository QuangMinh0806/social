from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.platform_controller import PlatformController

router = APIRouter(prefix="/platforms", tags=["Platforms"])


@router.get("/")
async def get_all_platforms(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all platforms with pagination
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100, max: 1000)
    """
    controller = PlatformController(db)
    return await controller.get_all(skip, limit)


@router.get("/active")
async def get_active_platforms(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all active platforms (is_active = True)
    """
    controller = PlatformController(db)
    return await controller.get_active_platforms()


@router.get("/{platform_id}")
async def get_platform_by_id(
    platform_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get platform information by ID
    
    - **platform_id**: The ID of the platform to retrieve
    """
    controller = PlatformController(db)
    return await controller.get_by_id(platform_id)


@router.post("/")
async def create_platform(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new platform
    
    Required fields:
    - **name**: Unique platform name (max 50 characters)
    
    Optional fields:
    - **icon_url**: URL to platform icon image
    - **is_active**: Whether the platform is active (default: True)
    """
    controller = PlatformController(db)
    return await controller.create(data)


@router.put("/{platform_id}")
async def update_platform(
    platform_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Update platform information
    
    - **platform_id**: The ID of the platform to update
    - **data**: Dictionary containing fields to update
    """
    controller = PlatformController(db)
    return await controller.update(platform_id, data)


@router.delete("/{platform_id}")
async def delete_platform(
    platform_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a platform
    
    - **platform_id**: The ID of the platform to delete
    """
    controller = PlatformController(db)
    return await controller.delete(platform_id)
