from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.user_controller import UserController

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/")
async def get_all_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    search: str = Query(None, description="Search term for username, email, or full_name"),
    role: str = Query(None, description="Filter by role"),
    status: str = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all users with pagination, search and filters
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100, max: 1000)
    - **search**: Search term for username, email, or full_name
    - **role**: Filter by role
    - **status**: Filter by status (active, inactive, suspended)
    """
    controller = UserController(db)
    return await controller.get_all(skip, limit, search, role, status)


@router.get("/{user_id}")
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get user information by ID
    
    - **user_id**: The ID of the user to retrieve
    """
    controller = UserController(db)
    return await controller.get_by_id(user_id)


@router.get("/email/{email}")
async def get_user_by_email(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get user information by email address
    
    - **email**: The email address of the user to retrieve
    """
    controller = UserController(db)
    return await controller.get_by_email(email)


@router.post("/")
async def create_user(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user
    
    Required fields:
    - **username**: Unique username (max 50 characters)
    - **email**: Unique email address (max 100 characters)
    - **password_hash**: Hashed password (max 255 characters)
    
    Optional fields:
    - **full_name**: Full name of the user
    - **avatar_url**: URL to user's avatar image
    - **role**: User role (default: 'editor')
    - **status**: User status ('active', 'inactive', 'suspended')
    """
    controller = UserController(db)
    return await controller.create(data)


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Update user information
    
    - **user_id**: The ID of the user to update
    - **data**: Dictionary containing fields to update
    """
    controller = UserController(db)
    return await controller.update(user_id, data)


@router.patch("/{user_id}/last-login")
async def update_last_login(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Update user's last login timestamp to current time
    
    - **user_id**: The ID of the user
    """
    controller = UserController(db)
    return await controller.update_last_login(user_id)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user
    
    - **user_id**: The ID of the user to delete
    """
    controller = UserController(db)
    return await controller.delete(user_id)
