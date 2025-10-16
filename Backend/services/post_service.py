from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
import sys
sys.path.append('..')
from models.model import Post, PostAnalytics, Page, User, Template, Platform
from typing import List, Optional, Dict
from datetime import datetime
from services.facebook_page_service import post_to_facebook_page


class PostService:
    """Service layer for Post operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        query = (
            select(Post)
            .options(
                selectinload(Post.page).selectinload(Page.platform),
                selectinload(Post.user),
                selectinload(Post.template)
            )
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        posts = result.scalars().all()
        return [self._to_dict(p) for p in posts]
    
    async def get_by_id(self, post_id: int) -> Optional[Dict]:
        query = (
            select(Post)
            .options(
                selectinload(Post.page).selectinload(Page.platform),
                selectinload(Post.user),
                selectinload(Post.template)
            )
            .where(Post.id == post_id)
        )
        result = await self.db.execute(query)
        post = result.scalar_one_or_none()
        return self._to_dict(post) if post else None
    
    async def get_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[Dict]:
        query = (
            select(Post)
            .options(
                selectinload(Post.page).selectinload(Page.platform),
                selectinload(Post.user),
                selectinload(Post.template)
            )
            .where(Post.status == status)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        posts = result.scalars().all()
        return [self._to_dict(p) for p in posts]
    
    async def get_by_page(self, page_id: int, skip: int = 0, limit: int = 100) -> List[Dict]:
        query = (
            select(Post)
            .options(
                selectinload(Post.page).selectinload(Page.platform),
                selectinload(Post.user),
                selectinload(Post.template)
            )
            .where(Post.page_id == page_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        posts = result.scalars().all()
        return [self._to_dict(p) for p in posts]
    
    async def get_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict]:
        query = (
            select(Post)
            .options(
                selectinload(Post.page).selectinload(Page.platform),
                selectinload(Post.user),
                selectinload(Post.template)
            )
            .where(Post.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        posts = result.scalars().all()
        return [self._to_dict(p) for p in posts]
    
    async def get_scheduled_posts(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        query = (
            select(Post)
            .options(
                selectinload(Post.page).selectinload(Page.platform),
                selectinload(Post.user),
                selectinload(Post.template)
            )
            .where(Post.status == 'scheduled')
            .where(Post.scheduled_at != None)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        posts = result.scalars().all()
        return [self._to_dict(p) for p in posts]
    
    async def get_posts_with_analytics(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get posts with their analytics data"""
        query = (
            select(Post)
            .options(selectinload(Post.analytics))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        posts = result.scalars().all()
        
        posts_with_analytics = []
        for post in posts:
            post_dict = self._to_dict(post)
            if post.analytics:
                post_dict["analytics"] = {
                    "views_count": post.analytics.views_count,
                    "likes_count": post.analytics.likes_count,
                    "comments_count": post.analytics.comments_count,
                    "shares_count": post.analytics.shares_count,
                    "engagement_rate": float(post.analytics.engagement_rate) if post.analytics.engagement_rate else 0.0
                }
            posts_with_analytics.append(post_dict)
        
        return posts_with_analytics
    
    async def create(self, data: dict) -> Dict:
        """
        Tạo post mới và tự động đăng lên platform nếu status = 'published'
        
        Args:
            data: Dictionary chứa thông tin post
                - content: str
                - page_id: int
                - user_id: int
                - status: str ('draft', 'published', 'scheduled')
                - media_files: List[bytes] (optional) - File data để upload lên FB
                - media_type: str (optional, 'image' or 'video')
                - scheduled_at: datetime (optional)
        """
        # Extract media info trước khi tạo post
        media_files = data.pop('media_files', [])
        media_type = data.pop('media_type', 'image')
        
        # Tạo post trong database
        post = Post(**data)
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        
        # Nếu status = 'published', đăng lên platform ngay
        if post.status.value == 'published' or post.status == 'published':
            await self._publish_to_platform(post, media_files, media_type)
        
        return self._to_dict(post)
    
    async def _publish_to_platform(self, post: Post, media_files: List[bytes], media_type: str):
        """
        Đăng bài lên platform (Facebook, Instagram, etc.)
        Upload file trực tiếp lên platform (không lưu server)
        
        Args:
            post: Post object
            media_files: Danh sách file data (bytes) để upload
            media_type: Loại media ('image' or 'video')
        """
        try:
            # Lấy thông tin page và platform
            query = (
                select(Page)
                .options(selectinload(Page.platform))
                .where(Page.id == post.page_id)
            )
            result = await self.db.execute(query)
            page = result.scalar_one_or_none()
            
            if not page:
                raise Exception(f"Page with id {post.page_id} not found")
            
            if not page.access_token:
                raise Exception(f"Page {page.page_name} không có access token")
            
            # Xác định platform và gọi service tương ứng
            platform_name = page.platform.name if page.platform else "Unknown"
            
            if platform_name == "Facebook":
                # Đăng lên Facebook (upload file trực tiếp)
                result = await post_to_facebook_page(
                    page_id=page.page_id,  # FB page ID
                    access_token=page.access_token,
                    message=post.content,
                    media_files=media_files,  # File data thay vì URLs
                    media_type=media_type
                )
                
                if result.get("success"):
                    # Update post với thông tin từ Facebook
                    fb_post_id = result.get("post_id") or result.get("video_id")
                    fb_post_url = f"https://www.facebook.com/{fb_post_id}"
                    
                    await self.update(post.id, {
                        "status": "published",
                        "published_at": datetime.utcnow(),
                        "platform_post_id": fb_post_id,
                        "platform_post_url": fb_post_url,
                        "error_message": None
                    })
                    
                    print(f"✅ Post {post.id} đã đăng thành công lên Facebook: {fb_post_url}")
                else:
                    # Đăng thất bại
                    error_msg = result.get("error", {}).get("message", "Unknown error")
                    await self.update(post.id, {
                        "status": "failed",
                        "error_message": f"Facebook error: {error_msg}",
                        "retry_count": post.retry_count + 1
                    })
                    print(f"❌ Post {post.id} đăng lên Facebook thất bại: {error_msg}")
            
            elif platform_name == "Instagram":
                # TODO: Implement Instagram posting
                print(f"⏳ Instagram posting chưa được implement cho post {post.id}")
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": "Instagram posting not implemented yet"
                })
            
            elif platform_name == "TikTok":
                # TODO: Implement TikTok posting
                print(f"⏳ TikTok posting chưa được implement cho post {post.id}")
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": "TikTok posting not implemented yet"
                })
            
            else:
                raise Exception(f"Unsupported platform: {platform_name}")
                
        except Exception as e:
            # Log error và update post status
            error_msg = str(e)
            print(f"❌ Error publishing post {post.id}: {error_msg}")
            
            await self.update(post.id, {
                "status": "failed",
                "error_message": error_msg,
                "retry_count": post.retry_count + 1
            })
            
            # Không raise exception để không block việc tạo post
            # Client vẫn nhận được post đã tạo, nhưng status = 'failed'
    
    async def update(self, post_id: int, data: dict) -> Optional[Dict]:
        query = update(Post).where(Post.id == post_id).values(**data).returning(Post)
        result = await self.db.execute(query)
        await self.db.commit()
        post = result.scalar_one_or_none()
        return self._to_dict(post) if post else None
    
    async def update_status(self, post_id: int, status: str) -> Optional[Dict]:
        return await self.update(post_id, {"status": status})
    
    async def publish_post(self, post_id: int, platform_post_id: str, platform_post_url: str) -> Optional[Dict]:
        data = {
            "status": "published",
            "published_at": datetime.utcnow(),
            "platform_post_id": platform_post_id,
            "platform_post_url": platform_post_url
        }
        return await self.update(post_id, data)
    
    async def schedule_post(self, post_id: int, scheduled_at: datetime) -> Optional[Dict]:
        data = {
            "status": "scheduled",
            "scheduled_at": scheduled_at
        }
        return await self.update(post_id, data)
    
    async def delete(self, post_id: int) -> bool:
        query = delete(Post).where(Post.id == post_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _to_dict(self, post: Post) -> Dict:
        if not post:
            return None
        
        result = {
            "id": post.id,
            "user_id": post.user_id,
            "page_id": post.page_id,
            "template_id": post.template_id,
            "title": post.title,
            "content": post.content,
            "post_type": post.post_type.value if hasattr(post.post_type, 'value') else post.post_type,
            "status": post.status.value if hasattr(post.status, 'value') else post.status,
            "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "platform_post_id": post.platform_post_id,
            "platform_post_url": post.platform_post_url,
            "error_message": post.error_message,
            "retry_count": post.retry_count,
            "metadata": post.post_metadata if hasattr(post, 'post_metadata') else post.metadata if hasattr(post, 'metadata') else None,
            "created_at": post.created_at.isoformat() if post.created_at else None,
            "updated_at": post.updated_at.isoformat() if post.updated_at else None
        }
        
        # Add page info if available
        if hasattr(post, 'page') and post.page:
            result["page"] = {
                "id": post.page.id,
                "page_name": post.page.page_name,
                "page_url": post.page.page_url,
                "avatar_url": post.page.avatar_url,
                "platform": None
            }
            # Add platform info if available
            if hasattr(post.page, 'platform') and post.page.platform:
                result["page"]["platform"] = {
                    "id": post.page.platform.id,
                    "name": post.page.platform.name,
                    "icon_url": post.page.platform.icon_url
                }
        
        return result
