from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.page_permission_controller import PagePermissionController

router = APIRouter(prefix="/api/page-permissions", tags=["Page Permissions"])


@router.get("/")
async def get_all_permissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all page permissions with pagination"""
    controller = PagePermissionController(db)
    return await controller.get_all(skip, limit)


@router.get("/{permission_id}")
async def get_permission_by_id(
    permission_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get permission by ID"""
    controller = PagePermissionController(db)
    return await controller.get_by_id(permission_id)


@router.get("/user/{user_id}")
async def get_user_pages(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all pages that user has permission to access"""
    controller = PagePermissionController(db)
    return await controller.get_user_pages(user_id)


@router.get("/check/{user_id}/{page_id}")
async def check_permission(
    user_id: int,
    page_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Check if user has permission for specific page"""
    controller = PagePermissionController(db)
    return await controller.check_permission(user_id, page_id)


@router.post("/")
async def create_permission(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Create new page permission
    
    Required fields:
    - **user_id**: ID of the user
    - **page_id**: ID of the page
    
    Optional fields:
    - **can_post**: Can post (default: True)
    - **can_edit**: Can edit (default: True)
    - **can_delete**: Can delete (default: False)
    """
    controller = PagePermissionController(db)
    return await controller.create(data)


@router.put("/{permission_id}")
async def update_permission(
    permission_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Update page permission"""
    controller = PagePermissionController(db)
    return await controller.update(permission_id, data)


@router.delete("/{permission_id}")
async def delete_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete page permission"""
    controller = PagePermissionController(db)
    return await controller.delete(permission_id)
