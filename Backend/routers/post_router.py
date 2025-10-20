from fastapi import APIRouter, Depends, Query, Body, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.post_controller import PostController
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from utils.timezone_utils import parse_datetime_from_frontend


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
    media_type: Optional[str] = "image"  # "image" or "video"


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
    user_id: int = Form(...),
    page_id: int = Form(...),
    content: str = Form(...),
    post_type: str = Form(...),
    status: str = Form("draft"),
    media_type: str = Form("image"),
    template_id: Optional[int] = Form(None),
    title: Optional[str] = Form(None),
    scheduled_at: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),  # Video URL từ thư viện
    media_urls: List[str] = Form(None),  # URLs cho Instagram (mỗi dòng 1 URL)
    image_frame_template_id: Optional[int] = Form(None),  # ID của frame cho ảnh
    video_frame_template_id: Optional[int] = Form(None),  # ID của frame cho video
    watermark_template_id: Optional[int] = Form(None),  # ID của watermark
    files: List[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):

    controller = PostController(db)
    
    # DEBUG: Log tất cả parameters
    print(f"📥 [Router] Received parameters:")
    print(f"  - user_id: {user_id}")
    print(f"  - page_id: {page_id}")
    print(f"  - post_type: {post_type}")
    print(f"  - media_type: {media_type}")
    print(f"  - media_urls (raw): {media_urls}")
    print(f"  - files: {files}")
    print(f"  - video_url: {video_url}")
    print(f"  - image_frame_template_id: {image_frame_template_id}")
    print(f"  - video_frame_template_id: {video_frame_template_id}")
    print(f"  - watermark_template_id: {watermark_template_id}")
    
    # Đọc file data từ uploads hoặc sử dụng video URL
    media_files = []
    media_url_list = []
    
    if video_url:
        # Nếu có video_url từ thư viện, dùng URL thay vì file
        media_files = [video_url]  # Facebook API hỗ trợ URL
    elif files:
        # Nếu có files upload, đọc file data
        for file in files:
            file_data = await file.read()
            media_files.append(file_data)
    
    # Nhận media_urls cho Instagram
    if media_urls:
        media_url_list = [url for url in media_urls if url and url.strip()]
        print(f"📤 [Router] Processed media_urls: {media_url_list}")
    
    # Tạo post data
    post_data = {
        "user_id": user_id,
        "page_id": page_id,
        "content": content,
        "post_type": post_type,
        "status": status,
        "media_type": media_type,
        "media_files": media_files,  # Truyền file data (cho FB, TikTok, YouTube)
        "media_urls": media_url_list,  # Truyền URLs (cho Instagram)
        "template_id": template_id,
        "title": title,
        "image_frame_template_id": image_frame_template_id,
        "video_frame_template_id": video_frame_template_id,
        "watermark_template_id": watermark_template_id,
    }
    
    # Parse scheduled_at từ Frontend (GMT+7) → UTC để lưu DB
    if scheduled_at:
        post_data["scheduled_at"] = parse_datetime_from_frontend(scheduled_at)
        print(f"⏰ Scheduled time (GMT+7 input): {scheduled_at}")
        print(f"⏰ Scheduled time (UTC stored): {post_data['scheduled_at']}")
    
    return await controller.create(post_data)


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


@router.get("/scheduler/upcoming")
async def get_upcoming_scheduled_posts(
    limit: int = Query(10, ge=1, le=100),
):
    """Get upcoming scheduled posts"""
    from services.scheduler_service import scheduler_service
    posts = await scheduler_service.get_upcoming_scheduled_posts(limit)
    return {
        "success": True,
        "message": f"Found {len(posts)} upcoming scheduled posts",
        "data": posts
    }


@router.post("/{post_id}/trigger-now")
async def trigger_scheduled_post_now(
    post_id: int,
):
    """Trigger a scheduled post to publish immediately (bypass scheduled_at)"""
    from services.scheduler_service import scheduler_service
    success = await scheduler_service.trigger_scheduled_post_now(post_id)
    
    if success:
        return {
            "success": True,
            "message": f"Post {post_id} triggered successfully"
        }
    else:
        return {
            "success": False,
            "message": f"Failed to trigger post {post_id}"
        }
