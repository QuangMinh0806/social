import os
from fastapi.responses import RedirectResponse
from fastapi import APIRouter, Request, HTTPException
from services.youtube_service import YouTubeService

router = APIRouter(prefix="/youtube", tags=["YouTube"])

# Initialize services
youtube_service = YouTubeService()

@router.get("/connect")
def connect_with_youtube():
    """Kết nối với YouTube - Tạo URL để user đăng nhập"""
    return youtube_service.get_auth_url()

@router.get("/callback")
def youtube_callback(request: Request, code: str = None, state: str = None, error: str = None):
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
        
        # Lấy thông tin user
        user_info = youtube_service.get_user_info(access_token)
        
        # Lấy thông tin YouTube channels
        youtube_channels = youtube_service.get_youtube_channels(access_token, refresh_token)
        
        # Chuẩn bị dữ liệu page
        page_data = youtube_service.prepare_page_data(
            token_info=token_info,
            user_info=user_info,
            youtube_channels=youtube_channels,
            platform_id=3,  # YouTube platform ID
            created_by=1    # Tạm thời hardcode, frontend sẽ override
        )
        
        print("YouTube callback data prepared:", page_data)
            
        # Trả về dữ liệu cho frontend xử lý
        return {
            "success": True,
            "message": "YouTube authentication successful",
            "page_data": page_data,
            "token_info": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": token_info.get("expires_in", 3600)
            },
            "user_info": user_info,
            "youtube_channels": youtube_channels,
            "redirect_url": "http://localhost:3000/youtube/callback",
            "notes": {
                "platform_id": "Frontend needs to fetch YouTube platform ID from /api/platforms?name=YouTube",
                "created_by": "Frontend needs to set current user ID",
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
def get_youtube_profile(access_token: str):
    """Lấy thông tin profile YouTube của user"""
    if not access_token:
        raise HTTPException(status_code=400, detail="Thiếu access_token")
    
    return youtube_service.get_channel_profile(access_token)

@router.get("/videos")
def get_youtube_videos(access_token: str, max_results: int = 10):
    """Lấy danh sách video của channel"""
    if not access_token:
        raise HTTPException(status_code=400, detail="Thiếu access_token")
    
    return youtube_service.get_channel_videos(access_token, max_results)

@router.get("/test")
def test_youtube_router():
    """Test endpoint để kiểm tra YouTube router"""
    return {
        "message": "YouTube router đang hoạt động!",
        "endpoints": [
            "GET /youtube/connect - Kết nối với YouTube",
            "GET /youtube/callback - Callback sau khi đăng nhập",
            "GET /youtube/profile?access_token=xxx - Lấy thông tin channel",
            "GET /youtube/videos?access_token=xxx - Lấy danh sách video"
        ],
        "services": {
            "youtube_service": "✅ Loaded",
            "page_service": "✅ Loaded"
        },
        "config": {
            "client_id": youtube_service.client_id[:20] + "...",
            "redirect_uri": youtube_service.redirect_uri,
            "scopes": youtube_service.scopes
        }
    }