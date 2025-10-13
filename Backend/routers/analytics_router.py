from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.analytics_controller import AnalyticsController
from pydantic import BaseModel
from typing import Optional


router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


class MetricsUpdate(BaseModel):
    views_count: Optional[int] = None
    likes_count: Optional[int] = None
    comments_count: Optional[int] = None
    shares_count: Optional[int] = None
    clicks_count: Optional[int] = None
    reach: Optional[int] = None
    impressions: Optional[int] = None


@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics"""
    controller = AnalyticsController(db)
    return await controller.get_dashboard_stats()


@router.get("/top-posts")
async def get_top_posts(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get top performing posts"""
    controller = AnalyticsController(db)
    return await controller.get_top_posts(limit)


@router.get("/posts/{post_id}")
async def get_post_analytics(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    controller = AnalyticsController(db)
    return await controller.get_by_post_id(post_id)


@router.put("/posts/{post_id}/metrics")
async def update_post_metrics(
    post_id: int,
    metrics: MetricsUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update metrics for a post"""
    controller = AnalyticsController(db)
    return await controller.update_metrics(post_id, metrics.dict(exclude_unset=True))


@router.post("/posts/{post_id}/engagement")
async def calculate_engagement_rate(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Calculate engagement rate for a post"""
    controller = AnalyticsController(db)
    return await controller.calculate_engagement(post_id)
