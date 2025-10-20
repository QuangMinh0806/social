import os
import tempfile
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse
from fastapi import APIRouter, Body, File, Form, Request, HTTPException, UploadFile, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from core.auth import get_current_user
from models.model import User
import requests
from services.youtube_service import YouTubeService
from pydantic import BaseModel
from typing import List, Optional
load_dotenv()
router = APIRouter(prefix="/youtube", tags=["YouTube"])

# Initialize services
youtube_service = YouTubeService()
URL_FE = os.getenv("URL_FE")
# ==================== REQUEST MODELS ====================
class YouTubeUploadRequest(BaseModel):
    video_url: str  # URL video để upload
    title: str
    description: str = ""
    tags: str = ""  # Comma-separated tags
    category_id: int = 22
    privacy_status: str = "private"  # private/unlisted/public

@router.get("/connect")
def connect_with_youtube():
    """Kết nối với YouTube - Tạo URL để user đăng nhập"""
    return youtube_service.get_auth_url()

@router.get("/callback")
async def youtube_callback(
    request: Request, 
    code: str = None, 
    state: str = None, 
    error: str = None, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Callback URL sau khi user đăng nhập YouTube
    Backend xử lý và trả về dữ liệu cho frontend xử lý
    """
    try:
        # Kiểm tra có lỗi từ Google không
        if error:
            return {
                "success": False,
                "error": error,
                "message": "YouTube authentication error"
            }
        
        # Kiểm tra có authorization code không
        if not code:
            return {
                "success": False,
                "error": "missing_code",
                "message": "Authorization code not provided"
            }
        
        # Kiểm tra state (CSRF protection)
        if state != "youtube_auth_state_123":
            return {
                "success": False,
                "error": "invalid_state",
                "message": "Invalid state parameter"
            }
        
        # Đổi code lấy token
        token_info = youtube_service.exchange_code_for_token(code)
        access_token = token_info.get("access_token")
        refresh_token = token_info.get("refresh_token")
        expires_in = token_info.get("expires_in", 3600)
        
        # Lấy thông tin user
        user_info = youtube_service.get_user_info(access_token)
        
        # Lấy thông tin YouTube channels
        youtube_channels = youtube_service.get_youtube_channels(access_token, refresh_token)
        
        # Chuẩn bị dữ liệu page với refresh token
        page_data = youtube_service.prepare_page_data(
            token_info=token_info,
            user_info=user_info,
            youtube_channels=youtube_channels,
            platform_id=3,  # YouTube platform ID
            created_by=current_user.id
        )
        
        print("YouTube callback data prepared:", page_data)
        
        # Tự động lưu vào database (giống Facebook pattern)
        try:
            from services.page_service import PageService
            page_service = PageService(db)
            
            # Kiểm tra xem page đã tồn tại chưa (tránh duplicate)
            existing_pages = await page_service.get_by_platform(platform_id=3)
            channel_id = page_data.get('page_id')
            
            existing_page = None
            for page in existing_pages:
                if page['page_id'] == channel_id:
                    existing_page = page
                    break
            
            if existing_page:
                print(f"Page already exists with ID {existing_page['id']}, updating tokens...")
                # Update existing page với tokens mới
                updated_page = await page_service.update_tokens(
                    page_id=existing_page['id'],
                    access_token=page_data['access_token'],
                    refresh_token=page_data['refresh_token'],
                    expires_at=page_data.get('token_expires_at')
                )
                print("Page updated successfully:", updated_page)
                created_page = updated_page
            else:
                print("Creating new page with data:", page_data)
                created_page = await page_service.create(page_data)
                print("Page created successfully:", created_page)
            
        except Exception as e:
            print(f"Error creating/updating page: {e}")
            import traceback
            traceback.print_exc()
            # Vẫn trả về data để frontend xử lý manual nếu cần
            created_page = None
            
        # Trả về dữ liệu cho frontend xử lý với đầy đủ token info
        return {
            "success": True,
            "message": "YouTube authentication successful",
            "page_data": page_data,
            "token_info": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": expires_in,
                "token_type": token_info.get("token_type", "Bearer"),
                "scope": token_info.get("scope", "")
            },
            "user_info": user_info,
            "youtube_channels": youtube_channels,
            "redirect_url": f"{URL_FE}/youtube/callback",
            "notes": {
                "platform_id": "Frontend needs to fetch YouTube platform ID from /api/platforms?name=YouTube",
                "created_by": "Frontend needs to set current user ID",
                "refresh_token": "Store refresh_token securely for token renewal",
                "next_step": "Use page_data to create/update page via POST /api/pages/"
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "server_error",
            "message": f"Server error: {str(e)}"
        }

@router.get("/profile")
def get_youtube_profile(access_token: str, refresh_token: str = None):
    """Lấy thông tin profile YouTube của user"""
    if not access_token:
        raise HTTPException(status_code=400, detail="Thiếu access_token")
    
    return youtube_service.get_channel_profile(access_token, refresh_token)

@router.get("/videos")
def get_youtube_videos(access_token: str, max_results: int = 10, refresh_token: str = None):
    """Lấy danh sách video của channel"""
    if not access_token:
        raise HTTPException(status_code=400, detail="Thiếu access_token")
    
    return youtube_service.get_channel_videos(access_token, max_results, refresh_token)

@router.post("/upload")
async def upload_video_to_youtube(
    request: YouTubeUploadRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Upload video lên YouTube - Tự động lấy page từ database
    
    Body:
    {
        "video_url": "http://example.com/video.mp4",
        "title": "Video title",
        "description": "Video description", 
        "tags": "tag1,tag2,tag3",
        "category_id": 22,
        "privacy_status": "private"
    }
    """
    try:
        from controllers.youtube_controller import youtube_upload_controller
        
        result = await youtube_upload_controller(
            title=request.title,
            description=request.description,
            video_data=request.video_url,  # URL video
            tags=request.tags,
            category_id=request.category_id,
            privacy_status=request.privacy_status,
            user_id=request.user_id,
            db=db
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-file")
async def upload_video_file_to_youtube(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    category_id: int = Form(22),
    privacy_status: str = Form("private"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload video file trực tiếp lên YouTube - Tự động lấy page từ database
    """
    try:
        from controllers.youtube_controller import youtube_upload_controller
        
        # Kiểm tra file có phải video không
        if not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File phải là video")
        
        # Đọc file content
        video_bytes = await file.read()
        
        result = await youtube_upload_controller(
            title=title,
            description=description,
            video_data=video_bytes,  # File bytes
            tags=tags,
            category_id=category_id,
            privacy_status=privacy_status,
            user_id=current_user.id,
            db=db
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-simple")
async def upload_video_simple(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload video đơn giản - Tự động lấy access_token từ database
    
    Body:
    {
        "video_url": "http://example.com/video.mp4",  // Required
        "title": "Video title",  // Required
        "description": "Video description",  // Optional
        "tags": "tag1,tag2",  // Optional
        "category_id": 22,  // Optional
        "privacy_status": "private"  // Optional
    }
    """
    try:
        from controllers.youtube_controller import youtube_upload_controller
        
        # Validate required fields
        video_url = payload.get("video_url")
        title = payload.get("title")
        
        if not video_url:
            raise HTTPException(status_code=400, detail="video_url is required")
        if not title:
            raise HTTPException(status_code=400, detail="title is required")
        
        # Upload với database lookup
        result = await youtube_upload_controller(
            title=title,
            description=payload.get("description", ""),
            video_data=video_url,
            tags=payload.get("tags", ""),
            category_id=payload.get("category_id", 22),
            privacy_status=payload.get("privacy_status", "private"),
            user_id=current_user.id,
            db=db
        )
        
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-manual")
async def upload_video_manual(
    payload: dict = Body(...)
):
    """
    Upload video với tokens thủ công (backup method cho test)
    
    Body:
    {
        "video_url": "http://example.com/video.mp4",  // Required
        "access_token": "your_access_token",  // Required
        "refresh_token": "your_refresh_token",  // Optional
        "title": "Video title",  // Required
        "description": "Video description",  // Optional
        "tags": "tag1,tag2",  // Optional
        "category_id": 22,  // Optional
        "privacy_status": "private"  // Optional
    }
    """
    try:
        from controllers.youtube_controller import youtube_upload_controller
        
        # Validate required fields
        video_url = payload.get("video_url")
        access_token = payload.get("access_token")
        title = payload.get("title")
        
        if not video_url:
            raise HTTPException(status_code=400, detail="video_url is required")
        if not access_token:
            raise HTTPException(status_code=400, detail="access_token is required")
        if not title:
            raise HTTPException(status_code=400, detail="title is required")
        
        # Upload với tokens trực tiếp (không dùng database)
        result = await youtube_upload_controller(
            title=title,
            description=payload.get("description", ""),
            video_data={
                'url': video_url,
                'access_token': access_token,
                'refresh_token': payload.get('refresh_token')
            },
            tags=payload.get("tags", ""),
            category_id=payload.get("category_id", 22),
            privacy_status=payload.get("privacy_status", "private"),
            user_id=None,
            db=None  # Không dùng database
        )
        
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/test")
    
@router.post("/refresh-token")
def refresh_youtube_token(payload: dict = Body(...)):
    """
    Refresh YouTube access token using refresh token
    """
    try:
        refresh_token = payload.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Thiếu refresh_token")
        
        # Gọi service để refresh token
        token_info = youtube_service.refresh_access_token(refresh_token)
        
        return {
            "success": True,
            "message": "Token refreshed successfully",
            "token_info": {
                "access_token": token_info.get("access_token"),
                "expires_in": token_info.get("expires_in", 3600),
                "token_type": token_info.get("token_type", "Bearer")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh token error: {str(e)}")

@router.post("/validate-token")
def validate_youtube_token(payload: dict = Body(...)):
    """
    Validate YouTube access token and return token info
    """
    try:
        access_token = payload.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Thiếu access_token")
        
        # Gọi service để validate token
        token_info = youtube_service.validate_access_token(access_token)
        
        return {
            "success": True,
            "message": "Token validation completed",
            "token_info": token_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token validation error: {str(e)}")

@router.post("/revoke-token")
def revoke_youtube_token(payload: dict = Body(...)):
    """
    Revoke YouTube access token
    """
    try:
        access_token = payload.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Thiếu access_token")
        
        # Gọi service để revoke token
        result = youtube_service.revoke_access_token(access_token)
        
        return {
            "success": True,
            "message": "Token revoked successfully",
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token revocation error: {str(e)}")

@router.post("/token-expiry")
def check_token_expiry(payload: dict = Body(...)):
    """
    Check YouTube access token expiry information
    """
    try:
        access_token = payload.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Thiếu access_token")
        
        # Gọi service để check token expiry
        expiry_info = youtube_service.get_token_expiry_info(access_token)
        
        return {
            "success": True,
            "message": "Token expiry check completed",
            "expiry_info": expiry_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token expiry check error: {str(e)}")

@router.post("/auto-refresh")
def auto_refresh_token(payload: dict = Body(...)):
    """
    Automatically refresh token if needed
    """
    try:
        access_token = payload.get("access_token")
        refresh_token = payload.get("refresh_token")
        threshold_minutes = payload.get("threshold_minutes", 5)
        
        if not access_token or not refresh_token:
            raise HTTPException(status_code=400, detail="Thiếu access_token hoặc refresh_token")
        
        # Gọi service để auto refresh
        result = youtube_service.auto_refresh_token_if_needed(
            access_token, 
            refresh_token, 
            threshold_minutes
        )
        
        return {
            "success": True,
            "message": "Auto refresh check completed",
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto refresh error: {str(e)}")

@router.get("/test")
def test_youtube_router():
    """Test endpoint để kiểm tra YouTube router"""
    return {
        "message": "YouTube router đang hoạt động!",
        "endpoints": [
            "GET /youtube/connect - Kết nối với YouTube",
            "GET /youtube/callback - Callback sau khi đăng nhập",
            "GET /youtube/profile?access_token=xxx&refresh_token=xxx - Lấy thông tin channel",
            "GET /youtube/videos?access_token=xxx&refresh_token=xxx - Lấy danh sách video",
            "POST /youtube/upload - Upload video (auto lấy page từ DB)",
            "POST /youtube/upload-file - Upload video file (auto lấy page từ DB)",
            "POST /youtube/upload-simple - Upload video simple (auto lấy access_token từ DB)",
            "POST /youtube/upload-manual - Upload video manual (nhập tokens thủ công)",
            "POST /youtube/refresh-token - Refresh access token",
            "POST /youtube/validate-token - Validate access token",
            "POST /youtube/revoke-token - Revoke access token",
            "POST /youtube/token-expiry - Check token expiry info",
            "POST /youtube/auto-refresh - Auto refresh token if needed"
        ],
        "services": {
            "youtube_service": "✅ Loaded"
        },
        "config": {
            "client_id": youtube_service.client_id[:20] + "..." if youtube_service.client_id else "Not set",
            "redirect_uri": youtube_service.redirect_uri,
            "scopes": youtube_service.scopes
        }
    }
   