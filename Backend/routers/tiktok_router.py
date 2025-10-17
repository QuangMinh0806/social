from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
import requests
import os
from urllib.parse import urlencode
from config.database import get_db
from services.page_service import PageService

router = APIRouter(prefix="/tiktok", tags=["TikTok"])

# CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY")
# CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET")
# REDIRECT_URI = os.getenv("TIKTOK_REDIRECT_URI")

CLIENT_KEY = "sbaw7q53fi2sp7s8lx"
CLIENT_SECRET = "iXXyqL5mJt1jBUiM2ouFGowv4w6D2ohq"

REDIRECT_URI = "https://8a7c47cd4eed.ngrok-free.app/tiktok/callback"

# 1️⃣ Route: Bắt đầu đăng nhập TikTok
@router.get("/login")
def login_tiktok():
    base_url = "https://www.tiktok.com/v2/auth/authorize/"
    params = {
        "client_key": CLIENT_KEY,
        "response_type": "code",
        "scope": "user.info.basic,video.upload,video.publish",
        "redirect_uri": REDIRECT_URI,
        "state": "test_state_123",
    }
    url = f"{base_url}?{urlencode(params)}"
    return {"auth_url": url}

# 2️⃣ Route: Callback TikTok redirect về sau khi user cho phép
@router.get("/callback")
async def tiktok_callback(
    request: Request,
    code: str = None,
    state: str = None,
    db: AsyncSession = Depends(get_db)
):
    if not code:
        return {"error": "Missing authorization code"}

    token_url = "https://open.tiktokapis.com/v2/oauth/token/"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "client_key": CLIENT_KEY,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    }

    # 3️⃣ Đổi code lấy access_token
    response = requests.post(token_url, data=data, headers=headers)
    token_info = response.json()
    
    print("🎯 TikTok Token Response:", token_info)

    # 4️⃣ Lưu thông tin vào database ngay khi có token
    if "access_token" in token_info:
        access_token = token_info["access_token"]
        open_id = token_info.get("open_id")
        refresh_token = token_info.get("refresh_token")
        expires_in = token_info.get("expires_in", 86400)
        
        if not open_id:
            print("❌ Missing open_id in token response")
            return {"error": "Missing open_id"}
        
        # Khởi tạo PageService
        page_service = PageService(db)
        
        # Lấy thông tin user để có display_name và avatar (optional, có thể bỏ nếu không cần)
        user_info = None
        try:
            user_url = "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name"
            user_headers = {"Authorization": f"Bearer {access_token}"}
            user_res = requests.get(user_url, headers=user_headers)
            user_data = user_res.json()
            if user_data.get("data") and user_data["data"].get("user"):
                user_info = user_data["data"]["user"]
                print("✅ Got TikTok user info:", user_info)
        except Exception as e:
            print(f"⚠️ Could not fetch user info: {str(e)}")
        
        # Lấy avatar URL và truncate nếu quá dài (database limit VARCHAR(255))
        avatar_url = None
        if user_info and user_info.get("avatar_url"):
            raw_url = user_info.get("avatar_url")
            # TikTok avatar URLs thường rất dài với query params
            # Truncate về 255 chars hoặc chỉ lấy base URL không có query params
            if len(raw_url) > 255:
                # Option 1: Truncate
                avatar_url = raw_url[:255]
                print(f"⚠️ Avatar URL truncated from {len(raw_url)} to 255 chars")
            else:
                avatar_url = raw_url
        
        # Tạo page data
        page_data = {
            "page_name": user_info.get("display_name", f"TikTok User {open_id[:8]}") if user_info else f"TikTok User {open_id[:8]}",
            "platform_id": 15,  # TikTok platform ID
            "page_id": open_id,
            "access_token": access_token,
            "avatar_url": avatar_url,
            "status": "connected",
            "created_by": 13  # TODO: Get from auth context
        }
        
        try:
            # Check if page already exists
            existing_pages = await page_service.get_all()
            
            # existing_pages trả về list of dicts, không phải objects
            existing_page = next(
                (p for p in existing_pages if p.get("page_id") == open_id),
                None
            )
            
            if existing_page:
                # Update existing page - Chỉ update token và status
                update_data = {
                    "access_token": access_token,
                    "status": "connected"
                }
                # Update name và avatar nếu có user_info mới
                if user_info:
                    update_data["page_name"] = page_data["page_name"]
                    if user_info.get("avatar_url"):
                        update_data["avatar_url"] = user_info["avatar_url"]
                
                page_id = existing_page.get("id")
                await page_service.update(page_id, update_data)
                print(f"✅ Updated TikTok page ID {page_id}: {page_data['page_name']}")
            else:
                # Create new page
                new_page = await page_service.create(page_data)
                page_id = new_page.id if hasattr(new_page, 'id') else new_page.get("id")
                print(f"✅ Created new TikTok page ID {page_id}: {page_data['page_name']}")
            
            # Redirect về trang quản lý pages
            return HTMLResponse(content="""
                <html>
                    <head>
                        <script>
                            alert('✅ Kết nối TikTok thành công!');
                            window.location.href = '/pages';
                        </script>
                    </head>
                    <body>
                        <p>Đang chuyển hướng...</p>
                    </body>
                </html>
            """)
            
        except Exception as e:
            print(f"❌ Error saving TikTok page: {str(e)}")
            import traceback
            traceback.print_exc()
            return HTMLResponse(content=f"""
                <html>
                    <head>
                        <script>
                            alert('❌ Lỗi khi lưu thông tin: {str(e)}');
                            window.location.href = '/pages';
                        </script>
                    </head>
                    <body>
                        <p>Đang chuyển hướng...</p>
                    </body>
                </html>
            """)

    print("❌ No access_token in response:", token_info)
    return {"error": "No access_token in response", "response": token_info}



