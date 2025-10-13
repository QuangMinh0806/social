from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models.model import PostAnalytics, Post
from typing import Optional, List
from datetime import datetime


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_post_id(self, post_id: int) -> Optional[dict]:
        """Get analytics for a specific post"""
        stmt = select(PostAnalytics).where(PostAnalytics.post_id == post_id)
        result = await self.db.execute(stmt)
        analytics = result.scalar_one_or_none()
        return self._to_dict(analytics) if analytics else None

    async def create(self, analytics_data: dict) -> dict:
        """Create new analytics record"""
        analytics = PostAnalytics(**analytics_data)
        self.db.add(analytics)
        await self.db.commit()
        await self.db.refresh(analytics)
        return self._to_dict(analytics)

    async def update_metrics(self, post_id: int, metrics: dict) -> Optional[dict]:
        """Update analytics metrics"""
        # Get the actual object, not dict
        stmt = select(PostAnalytics).where(PostAnalytics.post_id == post_id)
        result = await self.db.execute(stmt)
        analytics = result.scalar_one_or_none()
        
        if not analytics:
            # Create if doesn't exist
            metrics['post_id'] = post_id
            return await self.create(metrics)

        for key, value in metrics.items():
            if hasattr(analytics, key):
                setattr(analytics, key, value)

        analytics.synced_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(analytics)
        return self._to_dict(analytics)

    async def calculate_engagement_rate(self, post_id: int) -> Optional[float]:
        """Calculate engagement rate for a post"""
        # Get the actual object
        stmt = select(PostAnalytics).where(PostAnalytics.post_id == post_id)
        result = await self.db.execute(stmt)
        analytics = result.scalar_one_or_none()
        
        if not analytics or analytics.views_count == 0:
            return 0.0

        total_engagement = (
            analytics.likes_count + 
            analytics.comments_count + 
            analytics.shares_count
        )
        engagement_rate = (total_engagement / analytics.views_count) * 100
        
        # Update the rate
        analytics.engagement_rate = round(engagement_rate, 2)
        await self.db.commit()
        
        return engagement_rate

    async def get_dashboard_stats(self) -> dict:
        """Get dashboard statistics"""
        # Total posts
        total_posts_stmt = select(func.count(Post.id))
        total_posts_result = await self.db.execute(total_posts_stmt)
        total_posts = total_posts_result.scalar()

        # Total views
        total_views_stmt = select(func.sum(PostAnalytics.views_count))
        total_views_result = await self.db.execute(total_views_stmt)
        total_views = total_views_result.scalar() or 0

        # Total engagement
        total_likes_stmt = select(func.sum(PostAnalytics.likes_count))
        total_likes_result = await self.db.execute(total_likes_stmt)
        total_likes = total_likes_result.scalar() or 0

        total_comments_stmt = select(func.sum(PostAnalytics.comments_count))
        total_comments_result = await self.db.execute(total_comments_stmt)
        total_comments = total_comments_result.scalar() or 0

        total_shares_stmt = select(func.sum(PostAnalytics.shares_count))
        total_shares_result = await self.db.execute(total_shares_stmt)
        total_shares = total_shares_result.scalar() or 0

        # Average engagement rate
        avg_engagement_stmt = select(func.avg(PostAnalytics.engagement_rate))
        avg_engagement_result = await self.db.execute(avg_engagement_stmt)
        avg_engagement = avg_engagement_result.scalar() or 0.0

        return {
            "total_posts": total_posts,
            "total_views": total_views,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_shares": total_shares,
            "average_engagement_rate": round(float(avg_engagement), 2),
            "total_engagement": total_likes + total_comments + total_shares
        }

    async def get_top_posts(self, limit: int = 10) -> List[dict]:
        """Get top performing posts"""
        stmt = (
            select(PostAnalytics)
            .order_by(PostAnalytics.engagement_rate.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        posts = result.scalars().all()
        return [self._to_dict(p) for p in posts]
    
    def _to_dict(self, analytics: PostAnalytics) -> dict:
        """Convert PostAnalytics to dict"""
        if not analytics:
            return None
        return {
            "id": analytics.id,
            "post_id": analytics.post_id,
            "views_count": analytics.views_count,
            "likes_count": analytics.likes_count,
            "comments_count": analytics.comments_count,
            "shares_count": analytics.shares_count,
            "clicks_count": analytics.clicks_count,
            "engagement_rate": analytics.engagement_rate,
            "synced_at": analytics.synced_at.isoformat() if analytics.synced_at else None,
            "created_at": analytics.created_at.isoformat() if analytics.created_at else None,
            "updated_at": analytics.updated_at.isoformat() if analytics.updated_at else None,
        }
