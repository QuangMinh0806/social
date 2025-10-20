"""
Scheduler Service - Quản lý đăng bài theo lịch hẹn
Sử dụng APScheduler để kiểm tra và tự động đăng các post có trạng thái 'scheduled'
"""

import sys
sys.path.append('..')

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from typing import List
import asyncio
import logging

from models.model import Post
from services.post_service import PostService
from services.storage_service import storage_service
from core.config import settings
from utils.timezone_utils import now_utc, format_datetime_gmt7, utc_to_gmt7

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SchedulerService:
    """Service quản lý scheduler cho scheduled posts"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.engine = None
        self.async_session = None
        
    async def init_db(self):
        """Khởi tạo database connection cho scheduler"""
        try:
            self.engine = create_async_engine(
                settings.DATABASE_URL,
                echo=False,
                pool_pre_ping=True
            )
            self.async_session = sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            logger.info("✅ Scheduler database connection initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize scheduler database: {str(e)}")
            raise
    
    async def start(self):
        """Khởi động scheduler"""
        try:
            # Init database connection
            await self.init_db()
            
            # Add job: kiểm tra scheduled posts mỗi 1 phút
            self.scheduler.add_job(
                self.check_and_publish_scheduled_posts,
                trigger=IntervalTrigger(minutes=1),
                id='check_scheduled_posts',
                name='Check and publish scheduled posts',
                replace_existing=True
            )
            
            # Start scheduler
            self.scheduler.start()
            logger.info("🚀 Scheduler started successfully - checking every 1 minute")
            
        except Exception as e:
            logger.error(f"❌ Failed to start scheduler: {str(e)}")
            raise
    
    async def shutdown(self):
        """Tắt scheduler"""
        try:
            if self.scheduler.running:
                self.scheduler.shutdown(wait=True)
                logger.info("🛑 Scheduler stopped")
                
            if self.engine:
                await self.engine.dispose()
                logger.info("🛑 Scheduler database connection closed")
                
        except Exception as e:
            logger.error(f"❌ Error shutting down scheduler: {str(e)}")
    
    async def check_and_publish_scheduled_posts(self):
        """
        Kiểm tra và đăng các posts có:
        - status = 'scheduled'
        - scheduled_at <= now (UTC)
        """
        try:
            async with self.async_session() as session:
                # Query các scheduled posts đã đến thời gian đăng (UTC)
                now = now_utc()
                query = (
                    select(Post)
                    .where(Post.status == 'scheduled')
                    .where(Post.scheduled_at != None)
                    .where(Post.scheduled_at <= now)
                )
                
                result = await session.execute(query)
                scheduled_posts = result.scalars().all()
                
                if not scheduled_posts:
                    # Format thời gian theo GMT+7 để dễ đọc
                    logger.debug(f"⏰ [{format_datetime_gmt7(now)}] No scheduled posts to publish")
                    return
                
                logger.info(f"📤 Found {len(scheduled_posts)} scheduled post(s) ready to publish")
                
                # Đăng từng post
                for post in scheduled_posts:
                    try:
                        await self._publish_scheduled_post(session, post)
                    except Exception as e:
                        logger.error(f"❌ Error publishing post {post.id}: {str(e)}")
                        # Update status to failed
                        post.status = 'failed'
                        post.error_message = str(e)
                        post.retry_count = post.retry_count + 1 if post.retry_count else 1
                        await session.commit()
                        
        except Exception as e:
            logger.error(f"❌ Error in check_and_publish_scheduled_posts: {str(e)}")
    
    async def _publish_scheduled_post(self, session: AsyncSession, post: Post):
        """
        Đăng một scheduled post lên platform
        
        Args:
            session: Database session
            post: Post object cần đăng
        """
        try:
            # Format thời gian theo GMT+7
            scheduled_time_gmt7 = format_datetime_gmt7(post.scheduled_at)
            logger.info(f"📝 Publishing scheduled post {post.id} (scheduled at: {scheduled_time_gmt7})")
            
            # Update status sang 'publishing'
            post.status = 'publishing'
            await session.commit()
            
            # Load relationships (page, platform)
            await session.refresh(post, ['page', 'user'])
            if post.page:
                await session.refresh(post.page, ['platform'])
            
            # Sử dụng PostService để đăng bài
            post_service = PostService(session)
            
            # Parse metadata để lấy media info
            media_files = []
            media_urls = []
            media_type = 'image'
            
            if post.post_metadata:
                # Lấy media URLs (cho Instagram/Threads)
                media_urls = post.post_metadata.get('media_urls', [])
                media_type = post.post_metadata.get('media_type', 'image')
                
                # Load media files từ storage (cho Facebook/TikTok/YouTube)
                media_paths = post.post_metadata.get('media_paths', [])
                if media_paths:
                    try:
                        media_files = await storage_service.load_media_for_post(
                            post_id=post.id,
                            media_paths=media_paths
                        )
                        logger.info(f"📁 Loaded {len(media_files)} media file(s) from storage")
                    except Exception as e:
                        logger.error(f"❌ Error loading media files: {str(e)}")
            
            # Đăng lên platform
            await post_service._publish_to_platform(
                post=post,
                media_files=media_files,
                media_type=media_type,
                media_urls=media_urls
            )
            
            # Cleanup: Xóa media files sau khi đăng thành công
            if post.post_metadata and post.post_metadata.get('media_paths'):
                try:
                    await storage_service.delete_media_for_post(post.id)
                    logger.info(f"🗑️ Cleaned up media files for post {post.id}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not cleanup media files: {str(e)}")
            
            logger.info(f"✅ Successfully published scheduled post {post.id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to publish scheduled post {post.id}: {str(e)}")
            raise
    
    async def get_upcoming_scheduled_posts(self, limit: int = 10) -> List[dict]:
        """
        Lấy danh sách các scheduled posts sắp tới
        
        Args:
            limit: Số lượng posts cần lấy
            
        Returns:
            List các scheduled posts với thông tin cơ bản (thời gian GMT+7)
        """
        try:
            async with self.async_session() as session:
                now = now_utc()
                query = (
                    select(Post)
                    .where(Post.status == 'scheduled')
                    .where(Post.scheduled_at != None)
                    .where(Post.scheduled_at > now)
                    .order_by(Post.scheduled_at.asc())
                    .limit(limit)
                )
                
                result = await session.execute(query)
                posts = result.scalars().all()
                
                return [
                    {
                        'id': post.id,
                        'content': post.content[:100] + '...' if len(post.content) > 100 else post.content,
                        'scheduled_at': format_datetime_gmt7(post.scheduled_at, "%Y-%m-%d %H:%M:%S"),  # GMT+7
                        'scheduled_at_utc': post.scheduled_at.isoformat(),  # UTC cho client xử lý
                        'page_id': post.page_id,
                        'user_id': post.user_id,
                        'post_type': post.post_type.value if hasattr(post.post_type, 'value') else post.post_type
                    }
                    for post in posts
                ]
                
        except Exception as e:
            logger.error(f"❌ Error getting upcoming scheduled posts: {str(e)}")
            return []
    
    async def trigger_scheduled_post_now(self, post_id: int):
        """
        Trigger đăng một scheduled post ngay lập tức (không chờ scheduled_at)
        
        Args:
            post_id: ID của post cần đăng
            
        Returns:
            True nếu thành công, False nếu thất bại
        """
        try:
            async with self.async_session() as session:
                # Get post
                query = select(Post).where(Post.id == post_id)
                result = await session.execute(query)
                post = result.scalar_one_or_none()
                
                if not post:
                    logger.error(f"❌ Post {post_id} not found")
                    return False
                
                if post.status != 'scheduled':
                    logger.error(f"❌ Post {post_id} is not in scheduled status (current: {post.status})")
                    return False
                
                # Publish immediately
                await self._publish_scheduled_post(session, post)
                return True
                
        except Exception as e:
            logger.error(f"❌ Error triggering scheduled post {post_id}: {str(e)}")
            return False


# Global scheduler instance
scheduler_service = SchedulerService()


async def start_scheduler():
    """Helper function to start scheduler"""
    await scheduler_service.start()


async def stop_scheduler():
    """Helper function to stop scheduler"""
    await scheduler_service.shutdown()
