from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
import sys
sys.path.append('..')
from models.model import Post, PostAnalytics, Page, User, Template, Platform
from typing import List, Optional, Dict
from datetime import datetime
from services.facebook_page_service import post_to_facebook_page
from services.instagram_service import post_to_instagram
from services.tiktok_service import post_to_tiktok
from services.threads_service import post_to_threads


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
                - media_files: List[bytes] (optional) - File data để upload lên FB, TikTok, YouTube
                - media_urls: List[str] (optional) - URLs công khai cho Instagram
                - media_type: str (optional, 'image' or 'video')
                - scheduled_at: datetime (optional)
        """
        # Extract media info trước khi tạo post
        media_files = data.pop('media_files', [])
        media_urls = data.pop('media_urls', [])  # URLs cho Instagram
        media_type = data.pop('media_type', 'image')
        
        # Tạo post trong database
        post = Post(**data)
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        
        # Nếu status = 'published', đăng lên platform ngay
        if post.status.value == 'published' or post.status == 'published':
            await self._publish_to_platform(post, media_files, media_type, media_urls)
        
        return self._to_dict(post)
    
    async def _publish_to_platform(self, post: Post, media_files: List[bytes], media_type: str, media_urls: List[str] = []):
        """
        Đăng bài lên platform (Facebook, Instagram, TikTok, etc.)
        Upload file trực tiếp lên platform (không lưu server)
        
        Args:
            post: Post object
            media_files: Danh sách file data (bytes) để upload (cho FB, TikTok, YouTube)
            media_type: Loại media ('image' or 'video')
            media_urls: Danh sách URLs công khai (cho Instagram)
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
            
            # Routing đến service phù hợp với từng platform
            if platform_name.lower() == "facebook":
                await self._publish_to_facebook(post, page, media_files, media_type)
            
            elif platform_name.lower() == "instagram":
                await self._publish_to_instagram(post, page, media_urls, media_type)
            
            elif platform_name.lower() == "threads":
                await self._publish_to_threads(post, page, media_urls, media_type)
            
            elif platform_name.lower() == "tiktok":
                await self._publish_to_tiktok(post, page, media_files, media_type)
            
            elif platform_name.lower() == "youtube":
                await self._publish_to_youtube(post, page, media_files, media_type)
            
            else:
                raise Exception(f"Unsupported platform: {platform_name}")
                
        except Exception as e:
            # Log error và update post status
            error_msg = str(e)
            print(f"❌ Error publishing post {post.id} to {platform_name}: {error_msg}")
            
            await self.update(post.id, {
                "status": "failed",
                "error_message": error_msg,
                "retry_count": post.retry_count + 1
            })
            
            # Không raise exception để không block việc tạo post
            # Client vẫn nhận được post đã tạo, nhưng status = 'failed'
    
    async def _publish_to_facebook(self, post: Post, page: Page, media_files: List[bytes], media_type: str):
        """
        Đăng bài lên Facebook Page
        
        Args:
            post: Post object
            page: Page object với thông tin Facebook page
            media_files: Danh sách file data (bytes)
            media_type: Loại media ('image' or 'video')
        """
        try:
            result = await post_to_facebook_page(
                page_id=page.page_id,  # FB page ID
                access_token=page.access_token,
                message=post.content,
                media_files=media_files,
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
                
                print(f"✅ Post {post.id} đã đăng thành công lên Facebook Page '{page.page_name}': {fb_post_url}")
            else:
                # Đăng thất bại
                error_msg = result.get("error", {}).get("message", "Unknown error")
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": f"Facebook error: {error_msg}",
                    "retry_count": post.retry_count + 1
                })
                print(f"❌ Post {post.id} đăng lên Facebook Page '{page.page_name}' thất bại: {error_msg}")
        
        except Exception as e:
            error_msg = str(e)
            await self.update(post.id, {
                "status": "failed",
                "error_message": f"Facebook exception: {error_msg}",
                "retry_count": post.retry_count + 1
            })
            print(f"❌ Exception khi đăng post {post.id} lên Facebook: {error_msg}")
    
    async def _publish_to_instagram(self, post: Post, page: Page, media_urls: List[str], media_type: str):
        """
        Đăng bài lên Instagram
        
        Args:
            post: Post object
            page: Page object với thông tin Instagram account
            media_urls: Danh sách URLs công khai của media (HTTPS)
            media_type: Loại media ('image' or 'video')
        
        Note:
            Instagram API yêu cầu media URL công khai (HTTPS)
            Flow: B1 (Create Container) → B2 (Publish Container)
            Hỗ trợ:
            - Single image/video: 1 URL
            - Carousel: 2-10 URLs
        """
        try:
            # Check media URLs
            if not media_urls or len(media_urls) == 0:
                print(f"⚠️ Instagram posting cho post {post.id} cần media URL công khai")
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": "Instagram requires public media URL (HTTPS). Please provide valid URLs.",
                    "retry_count": post.retry_count + 1
                })
                return
            
            # Determine post type: single or carousel
            if len(media_urls) == 1:
                # Single image/video
                media_url = media_urls[0]
                print(f"📤 [Instagram] Posting single media: {media_url}")
                
                # Đăng lên Instagram qua 2 bước (B1 + B2)
                result = await post_to_instagram(
                    instagram_business_account_id=page.page_id,
                    access_token=page.access_token,
                    caption=post.content,
                    media_files=[],  # Không dùng files
                    media_type=media_type,
                    media_url=media_url
                )
            else:
                # Carousel (2-10 items)
                print(f"📤 [Instagram] Posting carousel with {len(media_urls)} items")
                
                result = await post_to_instagram(
                    instagram_business_account_id=page.page_id,
                    access_token=page.access_token,
                    caption=post.content,
                    media_files=[],
                    media_type="carousel",
                    media_url=media_urls  # Pass list of URLs for carousel
                )
            
            if result.get("success"):
                # Update post với thông tin từ Instagram
                ig_post_id = result.get("post_id")
                container_id = result.get("container_id")
                ig_post_url = result.get("permalink") or f"https://www.instagram.com/"
                item_count = result.get("item_count", 1)
                
                await self.update(post.id, {
                    "status": "published",
                    "published_at": datetime.utcnow(),
                    "platform_post_id": ig_post_id,
                    "platform_post_url": ig_post_url,
                    "error_message": None
                })
                
                if len(media_urls) == 1:
                    print(f"✅ Post {post.id} đã đăng thành công lên Instagram '{page.page_name}': {ig_post_url}")
                    print(f"   📦 Container ID: {container_id}")
                    print(f"   🖼️ Media URL: {media_urls[0]}")
                else:
                    print(f"✅ Post {post.id} đã đăng thành công lên Instagram '{page.page_name}': {ig_post_url}")
                    print(f"   📦 Carousel Container ID: {container_id}")
                    print(f"   🖼️ Carousel: {item_count} items")
                    for idx, url in enumerate(media_urls):
                        print(f"      [{idx+1}] {url}")
            else:
                # Đăng thất bại
                error_msg = result.get("error", {}).get("message", "Unknown error")
                step_failed = result.get("step", "unknown")
                
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": f"Instagram error at {step_failed}: {error_msg}",
                    "retry_count": post.retry_count + 1
                })
                
                if len(media_urls) == 1:
                    print(f"❌ Post {post.id} đăng lên Instagram '{page.page_name}' thất bại tại {step_failed}: {error_msg}")
                    print(f"   📦 Container ID: {result.get('container_id')}")
                    print(f"   🖼️ Media URL: {media_urls[0]}")
                else:
                    print(f"❌ Post {post.id} đăng carousel lên Instagram '{page.page_name}' thất bại tại {step_failed}: {error_msg}")
                    print(f"   🖼️ Total URLs: {len(media_urls)}")
            
        except Exception as e:
            error_msg = str(e)
            await self.update(post.id, {
                "status": "failed",
                "error_message": f"Instagram exception: {error_msg}",
                "retry_count": post.retry_count + 1
            })
            print(f"❌ Exception khi đăng post {post.id} lên Instagram: {error_msg}")
    
    async def _publish_to_threads(self, post: Post, page: Page, media_urls: List[str], media_type: str):
        """
        Đăng bài lên Threads
        
        Args:
            post: Post object
            page: Page object với thông tin Threads account
            media_urls: Danh sách URLs công khai của media (HTTPS)
            media_type: Loại media ('image' or 'video')
        
        Note:
            Threads API yêu cầu media URL công khai (HTTPS)
            Flow: B1 (Create Container) → B2 (Publish Container)
        """
        try:
            # Threads có thể đăng text-only, single image, hoặc carousel
            if media_urls and len(media_urls) > 0:
                if len(media_urls) == 1:
                    print(f"📤 [Threads] Posting single image: {media_urls[0]}")
                else:
                    print(f"📤 [Threads] Posting carousel with {len(media_urls)} images")
            else:
                print(f"📤 [Threads] Posting text-only")
            
            # Đăng lên Threads qua 2 bước (B1 + B2)
            # Nếu nhiều URLs -> tự động chuyển sang carousel
            result = await post_to_threads(
                threads_user_id=page.page_id,
                access_token=page.access_token,
                text=post.content,
                media_files=[],  # Không dùng files
                media_type=media_type,
                media_url=media_urls[0] if media_urls and len(media_urls) == 1 else None,
                media_urls=media_urls  # Truyền toàn bộ danh sách URLs
            )
            
            if result.get("success"):
                # Update post với thông tin từ Threads
                threads_post_id = result.get("post_id")
                container_id = result.get("container_id")
                threads_post_url = result.get("permalink") or f"https://www.threads.net/"
                
                await self.update(post.id, {
                    "status": "published",
                    "published_at": datetime.utcnow(),
                    "platform_post_id": threads_post_id,
                    "platform_post_url": threads_post_url,
                    "error_message": None
                })
                
                print(f"✅ Post {post.id} đã đăng thành công lên Threads '{page.page_name}': {threads_post_url}")
                print(f"   📦 Container ID: {container_id}")
                if media_urls:
                    if len(media_urls) == 1:
                        print(f"   🖼️ Media URL: {media_urls[0]}")
                    else:
                        print(f"   🖼️ Carousel: {len(media_urls)} images")
                        for idx, url in enumerate(media_urls):
                            print(f"      [{idx+1}] {url}")
            else:
                # Đăng thất bại
                error_msg = result.get("error", {}).get("message", "Unknown error")
                step_failed = result.get("step", "unknown")
                
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": f"Threads error at {step_failed}: {error_msg}",
                    "retry_count": post.retry_count + 1
                })
                print(f"❌ Post {post.id} đăng lên Threads '{page.page_name}' thất bại tại {step_failed}: {error_msg}")
                print(f"   📦 Container ID: {result.get('container_id')}")
                if media_urls:
                    print(f"   🖼️ Total URLs: {len(media_urls)}")
            
        except Exception as e:
            error_msg = str(e)
            await self.update(post.id, {
                "status": "failed",
                "error_message": f"Threads exception: {error_msg}",
                "retry_count": post.retry_count + 1
            })
            print(f"❌ Exception khi đăng post {post.id} lên Threads: {error_msg}")
    
    async def _publish_to_tiktok(self, post: Post, page: Page, media_files: List[bytes], media_type: str):
        """
        Đăng video lên TikTok
        
        Args:
            post: Post object
            page: Page object với thông tin TikTok account
            media_files: Danh sách file data (bytes)
            media_type: Loại media (TikTok chỉ hỗ trợ 'video')
        """
        try:
            # TikTok chỉ hỗ trợ video
            if media_type != "video" or not media_files or len(media_files) == 0:
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": "TikTok only supports video posts",
                    "retry_count": post.retry_count + 1
                })
                return
            
            # Đăng video lên TikTok
            result = await post_to_tiktok(
                access_token=page.access_token,
                video_file=media_files[0],
                title=post.title or "",
                description=post.content,
                privacy_level="PUBLIC_TO_EVERYONE"  # TODO: Make configurable
            )
            
            if result.get("success"):
                # TikTok trả về publish_id, cần check status sau
                publish_id = result.get("publish_id")
                
                await self.update(post.id, {
                    "status": "processing",  # Video đang được xử lý
                    "platform_post_id": publish_id,
                    "error_message": None,
                    "metadata": {
                        "tiktok_publish_id": publish_id,
                        "status": "PROCESSING"
                    }
                })
                
                print(f"🔄 Post {post.id} đang được upload lên TikTok '{page.page_name}' (publish_id: {publish_id})")
                
                # TODO: Implement background job để check status và update khi video đã PUBLISHED
                # Có thể dùng Celery hoặc APScheduler để poll status
                
            else:
                # Upload thất bại
                error_msg = result.get("error", {}).get("message", "Unknown error")
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": f"TikTok error: {error_msg}",
                    "retry_count": post.retry_count + 1
                })
                print(f"❌ Post {post.id} upload lên TikTok '{page.page_name}' thất bại: {error_msg}")
            
        except Exception as e:
            error_msg = str(e)
            await self.update(post.id, {
                "status": "failed",
                "error_message": f"TikTok exception: {error_msg}",
                "retry_count": post.retry_count + 1
            })
            print(f"❌ Exception khi đăng post {post.id} lên TikTok: {error_msg}")
    
    async def _publish_to_youtube(self, post: Post, page: Page, media_files: List[bytes], media_type: str):
        """
        Đăng video lên YouTube
        
        Args:
            post: Post object
            page: Page object với thông tin YouTube channel
            media_files: Danh sách file data (bytes)
            media_type: Loại media ('video')
        """
        try:
            import os
            import tempfile
            from services.youtube_service import YouTubeService
            
            # YouTube chỉ hỗ trợ video
            if media_type != "video" or not media_files or len(media_files) == 0:
                await self.update(post.id, {
                    "status": "failed",
                    "error_message": "YouTube only supports video posts",
                    "retry_count": post.retry_count + 1
                })
                return
            
            # YouTube API cần file path, không nhận bytes trực tiếp
            # Lưu video vào temp file
            temp_file = None
            try:
                # Tạo temp file
                temp_fd, temp_path = tempfile.mkstemp(suffix=".mp4")
                os.write(temp_fd, media_files[0])
                os.close(temp_fd)
                temp_file = temp_path
                
                # Upload lên YouTube
                youtube_service = YouTubeService()
                result = youtube_service.upload_video(
                    access_token=page.access_token,
                    file_path=temp_file,
                    title=post.title or f"Video - {datetime.utcnow().strftime('%Y-%m-%d')}",
                    description=post.content,
                    tags=None,  # TODO: Extract hashtags from content
                    category_id=22,  # 22 = People & Blogs
                    privacy_status="public"  # TODO: Make configurable
                )
                
                if result.get("success"):
                    # Update post với thông tin từ YouTube
                    video_id = result.get("video_id")
                    youtube_url = f"https://www.youtube.com/watch?v={video_id}"
                    
                    await self.update(post.id, {
                        "status": "published",
                        "published_at": datetime.utcnow(),
                        "platform_post_id": video_id,
                        "platform_post_url": youtube_url,
                        "error_message": None
                    })
                    
                    print(f"✅ Post {post.id} đã đăng thành công lên YouTube '{page.page_name}': {youtube_url}")
                else:
                    # Upload thất bại
                    error_msg = result.get("message", "Unknown error")
                    await self.update(post.id, {
                        "status": "failed",
                        "error_message": f"YouTube error: {error_msg}",
                        "retry_count": post.retry_count + 1
                    })
                    print(f"❌ Post {post.id} upload lên YouTube '{page.page_name}' thất bại: {error_msg}")
                
            finally:
                # Xóa temp file
                if temp_file and os.path.exists(temp_file):
                    os.remove(temp_file)
            
        except Exception as e:
            error_msg = str(e)
            await self.update(post.id, {
                "status": "failed",
                "error_message": f"YouTube exception: {error_msg}",
                "retry_count": post.retry_count + 1
            })
            print(f"❌ Exception khi đăng post {post.id} lên YouTube: {error_msg}")
    
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
