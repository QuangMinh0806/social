from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.post_controller import PostController
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


router = APIRouter(prefix="/api/posts", tags=["Posts"])


class PostCreate(BaseModel):
    user_id: int
    page_id: int
    template_id: Optional[int] = None
    title: Optional[str] = None
    content: str
    post_type: str
    status: str = "draft"
    scheduled_at: Optional[datetime] = None


class PostUpdate(BaseModel):
    template_id: Optional[int] = None
    title: Optional[str] = None
    content: Optional[str] = None
    post_type: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class ScheduleRequest(BaseModel):
    scheduled_at: str


@router.get("/")
async def get_all_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all posts with pagination"""
    controller = PostController(db)
    return await controller.get_all(skip, limit)


@router.get("/scheduled")
async def get_scheduled_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all scheduled posts"""
    controller = PostController(db)
    return await controller.get_scheduled(skip, limit)


@router.get("/status/{status}")
async def get_posts_by_status(
    status: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get posts by status"""
    controller = PostController(db)
    return await controller.get_by_status(status, skip, limit)


@router.get("/page/{page_id}")
async def get_posts_by_page(
    page_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get posts for a specific page"""
    controller = PostController(db)
    return await controller.get_by_page(page_id, skip, limit)


@router.get("/user/{user_id}")
async def get_posts_by_user(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get posts created by a specific user"""
    controller = PostController(db)
    return await controller.get_by_user(user_id, skip, limit)


@router.get("/{post_id}")
async def get_post_by_id(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get post by ID"""
    controller = PostController(db)
    return await controller.get_by_id(post_id)


@router.post("/")
async def create_post(
    post: PostCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new post"""
    controller = PostController(db)
    return await controller.create(post.dict())


@router.put("/{post_id}")
async def update_post(
    post_id: int,
    post: PostUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update post"""
    controller = PostController(db)
    return await controller.update(post_id, post.dict(exclude_unset=True))


@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete post"""
    controller = PostController(db)
    return await controller.delete(post_id)


@router.patch("/{post_id}/status")
async def update_post_status(
    post_id: int,
    status: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """Update post status"""
    controller = PostController(db)
    return await controller.update_status(post_id, status)


@router.post("/{post_id}/publish")
async def publish_post(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Publish a post immediately"""
    controller = PostController(db)
    return await controller.publish_post(post_id)


@router.post("/{post_id}/schedule")
async def schedule_post(
    post_id: int,
    schedule_data: ScheduleRequest,
    db: AsyncSession = Depends(get_db)
):
    """Schedule a post for later"""
    controller = PostController(db)
    return await controller.schedule_post(post_id, schedule_data.scheduled_at)
