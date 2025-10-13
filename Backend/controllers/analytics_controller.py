from sqlalchemy.ext.asyncio import AsyncSession
from services.analytics_service import AnalyticsService


class AnalyticsController:
    def __init__(self, db: AsyncSession):
        self.service = AnalyticsService(db)

    async def get_by_post_id(self, post_id: int):
        """Get analytics for a post"""
        try:
            analytics = await self.service.get_by_post_id(post_id)
            if not analytics:
                return {
                    "success": False,
                    "data": None,
                    "message": "Analytics not found for this post"
                }
            return {
                "success": True,
                "data": analytics,
                "message": "Analytics retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def update_metrics(self, post_id: int, metrics: dict):
        """Update analytics metrics"""
        try:
            analytics = await self.service.update_metrics(post_id, metrics)
            if not analytics:
                return {
                    "success": False,
                    "data": None,
                    "message": "Failed to update metrics"
                }
            return {
                "success": True,
                "data": analytics,
                "message": "Metrics updated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def calculate_engagement(self, post_id: int):
        """Calculate engagement rate"""
        try:
            rate = await self.service.calculate_engagement_rate(post_id)
            return {
                "success": True,
                "data": {"engagement_rate": rate},
                "message": "Engagement rate calculated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_dashboard_stats(self):
        """Get dashboard statistics"""
        try:
            stats = await self.service.get_dashboard_stats()
            return {
                "success": True,
                "data": stats,
                "message": "Dashboard statistics retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }

    async def get_top_posts(self, limit: int):
        """Get top performing posts"""
        try:
            analytics_list = await self.service.get_top_posts(limit)
            return {
                "success": True,
                "data": analytics_list,
                "message": "Top posts retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }