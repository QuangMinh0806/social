from sqlalchemy.ext.asyncio import AsyncSession
from services.youtube_service import YouTubeService
from fastapi import HTTPException
from sqlalchemy import select
from models.model import Page, Platform, PageStatus
import requests
import tempfile
import os

youtube_service = YouTubeService()

async def youtube_upload_controller(
    title: str,
    description: str,
    video_data=None,  # Có thể là URL hoặc file bytes
    tags: str = "",
    category_id: int = 22,
    privacy_status: str = "private",
    user_id: int = None,
    db: AsyncSession = None
):
    """
    Controller để upload video lên YouTube
    
    Args:
        title: Tiêu đề video
        description: Mô tả video
        video_data: URL video hoặc file bytes
        tags: Tags (comma-separated)
        category_id: YouTube category ID
        privacy_status: Trạng thái video (private/unlisted/public)
        user_id: ID của user (optional, default=1)
        db: Database session
    """
    
    # Tự động tìm YouTube page từ database
    if db:
        # Lấy platform YouTube (thử cả 'YouTube' và 'youtube')
        platform_result = await db.execute(
            select(Platform).filter(Platform.name.in_(['YouTube', 'youtube']))
        )
        youtube_platform = platform_result.scalar_one_or_none()
        
        if not youtube_platform:
            raise HTTPException(
                status_code=404, 
                detail="YouTube platform not found in database. Please add YouTube platform first."
            )
        
        # Tìm YouTube page của user
        if user_id is None:
            user_id = 1  # Default user
            
        page_result = await db.execute(
            select(Page).filter(
                Page.platform_id == youtube_platform.id,
                Page.created_by == user_id,
                Page.status == PageStatus.connected
            ).order_by(Page.created_at.desc())
        )
        page = page_result.scalar_one_or_none()
        
        if not page:
            raise HTTPException(
                status_code=404, 
                detail=f"No connected YouTube page found for user {user_id}. Please connect your YouTube account first via /youtube/connect"
            )
        
        if not page.access_token:
            raise HTTPException(
                status_code=400, 
                detail="YouTube page has no access token. Please reconnect your YouTube account."
            )
        
        access_token = page.access_token
        refresh_token = page.refresh_token  # Lấy refresh_token từ database
        
        print(f"Found YouTube page: {page.page_name} (ID: {page.id}) for user {user_id}")
        print(f"Access token available: {bool(access_token)}")
        print(f"Refresh token available: {bool(refresh_token)}")
        
        if not refresh_token:
            print("Warning: No refresh token found, may encounter token refresh issues")
            print("Consider reconnecting YouTube account to get refresh token")
        
    else:
        # Fallback: sử dụng token từ params (để test)
        if isinstance(video_data, dict) and 'access_token' in video_data:
            access_token = video_data.get('access_token')
            refresh_token = video_data.get('refresh_token')
            # Update video_data to actual URL
            video_data = video_data.get('url', video_data)
        else:
            raise HTTPException(status_code=400, detail="Database not available and no access_token provided")
    
    # Xử lý video data
    if isinstance(video_data, str) and video_data.startswith('http'):
        # Trường hợp URL
        temp_file_path = await download_video_from_url(video_data)
    elif isinstance(video_data, bytes):
        # Trường hợp file upload
        temp_file_path = await save_video_from_bytes(video_data)
    else:
        raise HTTPException(status_code=400, detail="Invalid video data")
    
    try:
        # Chuẩn bị tags
        tags_list = [t.strip() for t in tags.split(',')] if tags else []
        
        # Upload video lên YouTube
        result = await youtube_service.upload_video_async(
            access_token=access_token,
            refresh_token=refresh_token,
            file_path=temp_file_path,
            title=title,
            description=description,
            tags=tags_list,
            category_id=category_id,
            privacy_status=privacy_status
        )
        
        return result
        
    finally:
        # Cleanup file tạm
        try:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        except Exception as e:
            print(f"Warning: Could not delete temp file: {e}")


async def download_video_from_url(video_url: str) -> str:
    """
    Download video từ URL và lưu vào file tạm
    
    Returns:
        str: Đường dẫn file tạm
    """
    try:
        response = requests.get(video_url, stream=True)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Không tải được video từ URL")
        
        # Lưu tạm vào file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    tmp_file.write(chunk)
            return tmp_file.name
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")


async def save_video_from_bytes(video_bytes: bytes) -> str:
    """
    Lưu video bytes vào file tạm
    
    Returns:
        str: Đường dẫn file tạm
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
            tmp_file.write(video_bytes)
            return tmp_file.name
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save file error: {str(e)}")