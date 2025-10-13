from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.hashtag_controller import HashtagController
from pydantic import BaseModel
from typing import Optional


router = APIRouter(prefix="/api/hashtags", tags=["Hashtags"])


class HashtagCreate(BaseModel):
    name: str
    usage_count: int = 0


class HashtagUpdate(BaseModel):
    name: Optional[str] = None
    usage_count: Optional[int] = None


@router.get("/")
async def get_all_hashtags(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all hashtags with pagination"""
    controller = HashtagController(db)
    return await controller.get_all(skip, limit)


@router.get("/popular")
async def get_popular_hashtags(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get popular hashtags"""
    controller = HashtagController(db)
    return await controller.get_popular(limit)


@router.get("/search")
async def search_hashtags(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Search hashtags by name"""
    controller = HashtagController(db)
    return await controller.search(q, limit)


@router.get("/{hashtag_id}")
async def get_hashtag_by_id(
    hashtag_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get hashtag by ID"""
    controller = HashtagController(db)
    return await controller.get_by_id(hashtag_id)


@router.post("/")
async def create_hashtag(
    hashtag: HashtagCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new hashtag"""
    controller = HashtagController(db)
    return await controller.create(hashtag.dict())


@router.put("/{hashtag_id}")
async def update_hashtag(
    hashtag_id: int,
    hashtag: HashtagUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update hashtag"""
    controller = HashtagController(db)
    return await controller.update(hashtag_id, hashtag.dict(exclude_unset=True))


@router.delete("/{hashtag_id}")
async def delete_hashtag(
    hashtag_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete hashtag"""
    controller = HashtagController(db)
    return await controller.delete(hashtag_id)


@router.patch("/{hashtag_id}/increment-usage")
async def increment_hashtag_usage(
    hashtag_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Increment hashtag usage count"""
    controller = HashtagController(db)
    return await controller.increment_usage(hashtag_id)
