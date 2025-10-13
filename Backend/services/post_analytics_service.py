from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
import sys
sys.path.append('..')
from models.model import PostAnalytics
from typing import List, Optional, Dict
from datetime import datetime


class PostAnalyticsService:
    """Service layer for PostAnalytics operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_post(self, post_id: int) -> Optional[Dict]:
        query = select(PostAnalytics).where(PostAnalytics.post_id == post_id)
        result = await self.db.execute(query)
        analytics = result.scalar_one_or_none()
        return self._to_dict(analytics) if analytics else None
    
    async def get_top_performing_posts(self, limit: int = 10, metric: str = "engagement_rate") -> List[Dict]:
        """Get top performing posts by specific metric"""
        if metric == "engagement_rate":
            query = select(PostAnalytics).order_by(PostAnalytics.engagement_rate.desc()).limit(limit)
        elif metric == "likes":
            query = select(PostAnalytics).order_by(PostAnalytics.likes_count.desc()).limit(limit)
        elif metric == "views":
            query = select(PostAnalytics).order_by(PostAnalytics.views_count.desc()).limit(limit)
        else:
            query = select(PostAnalytics).order_by(PostAnalytics.engagement_rate.desc()).limit(limit)
        
        result = await self.db.execute(query)
        analytics_list = result.scalars().all()
        return [self._to_dict(a) for a in analytics_list]
    
    async def calculate_engagement_rate(self, post_id: int) -> float:
        """Calculate engagement rate: (likes + comments + shares) / views * 100"""
        analytics = await self.get_by_post(post_id)
        if not analytics or analytics["views_count"] == 0:
            return 0.0
        
        engagement = analytics["likes_count"] + analytics["comments_count"] + analytics["shares_count"]
        rate = (engagement / analytics["views_count"]) * 100
        
        # Update the engagement rate in database
        await self.update(post_id, {"engagement_rate": round(rate, 2)})
        return round(rate, 2)
    
    async def create(self, data: dict) -> Dict:
        analytics = PostAnalytics(**data)
        self.db.add(analytics)
        await self.db.commit()
        await self.db.refresh(analytics)
        return self._to_dict(analytics)
    
    async def update(self, post_id: int, data: dict) -> Optional[Dict]:
        query = (
            update(PostAnalytics)
            .where(PostAnalytics.post_id == post_id)
            .values(**data)
            .returning(PostAnalytics)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        analytics = result.scalar_one_or_none()
        return self._to_dict(analytics) if analytics else None
    
    async def update_metrics(self, post_id: int, metrics: dict) -> Optional[Dict]:
        """Update analytics metrics and sync time"""
        metrics["synced_at"] = datetime.utcnow()
        return await self.update(post_id, metrics)
    
    async def delete(self, post_id: int) -> bool:
        query = delete(PostAnalytics).where(PostAnalytics.post_id == post_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, analytics: PostAnalytics) -> Dict:
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
            "engagement_rate": float(analytics.engagement_rate) if analytics.engagement_rate else 0.0,
            "reach": analytics.reach,
            "impressions": analytics.impressions,
            "synced_at": analytics.synced_at.isoformat() if analytics.synced_at else None,
            "created_at": analytics.created_at.isoformat() if analytics.created_at else None,
            "updated_at": analytics.updated_at.isoformat() if analytics.updated_at else None
        }
