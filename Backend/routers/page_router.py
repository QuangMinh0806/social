from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.page_controller import PageController
from core.auth import get_current_user
from models.model import User

router = APIRouter(prefix="/pages", tags=["Pages"])


@router.get("/")
async def get_all_pages(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all pages with pagination
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100, max: 1000)
    """
    controller = PageController(db)
    return await controller.get_all(skip, limit)


@router.get("/{page_id}")
async def get_page_by_id(
    page_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get page information by ID
    
    - **page_id**: The ID of the page to retrieve
    """
    controller = PageController(db)
    return await controller.get_by_id(page_id)


@router.get("/user/{user_id}")
async def get_pages_by_user(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all pages created by a specific user
    
    - **user_id**: The ID of the user
    - **skip**: Number of records to skip
    - **limit**: Maximum number of records to return
    """
    controller = PageController(db)
    return await controller.get_by_user(user_id, skip, limit)


@router.get("/platform/{platform_id}")
async def get_pages_by_platform(
    platform_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all pages for a specific platform
    
    - **platform_id**: The ID of the platform
    - **skip**: Number of records to skip
    - **limit**: Maximum number of records to return
    """
    controller = PageController(db)
    return await controller.get_by_platform(platform_id, skip, limit)


@router.post("/")
async def create_page(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new page
     
    Required fields:
    - **platform_id**: ID of the platform
    - **page_id**: Page ID from the platform
    - **page_name**: Name of the page
    - **created_by**: ID of the user creating the page
    
    Optional fields:
    - **page_url**: URL to the page
    - **avatar_url**: URL to page avatar
    - **access_token**: Access token for the page
    - **token_expires_at**: Token expiration datetime
    - **status**: Page status ('connected', 'disconnected', 'error')
    - **follower_count**: Number of followers
    
    Note: created_by will be automatically set to current user
    """
    # Add current user ID to data
    data['created_by'] = current_user.id
    controller = PageController(db)
    return await controller.create(data)


@router.put("/{page_id}")
async def update_page(
    page_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Update page information
    
    - **page_id**: The ID of the page to update
    - **data**: Dictionary containing fields to update
    """
    controller = PageController(db)
    return await controller.update(page_id, data)


@router.patch("/{page_id}/token")
async def update_page_token(
    page_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Update page access token and expiration
    
    Required fields:
    - **access_token**: New access token
    - **token_expires_at**: Token expiration datetime (ISO format)
    """
    controller = PageController(db)
    return await controller.update_token(page_id, data)


@router.patch("/{page_id}/sync-followers")
async def sync_follower_count(
    page_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Sync follower count for a page
    
    Required fields:
    - **follower_count**: Updated follower count
    """
    controller = PageController(db)
    return await controller.sync_follower_count(page_id, data)


@router.delete("/{page_id}")
async def delete_page(
    page_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a page
    
    - **page_id**: The ID of the page to delete
    """
    controller = PageController(db)
    return await controller.delete(page_id)
