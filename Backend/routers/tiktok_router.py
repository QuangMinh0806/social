from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
import requests
import os
from urllib.parse import urlencode


router = APIRouter(prefix="/tiktok", tags=["TikTok"])


# CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY")
# CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET")
# REDIRECT_URI = os.getenv("TIKTOK_REDIRECT_URI")


CLIENT_KEY = "sbawwoqpv8dpsuqs2o"
CLIENT_SECRET = "eGW8sSoPatYnarw8mAKuyuTxyf7dxGxQ"

REDIRECT_URI = "https://ardis-nondistracting-cogitatively.ngrok-free.dev/tiktok/callback"


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

@router.get("/video/sample.mp4")
def proxy_video():
    # Link Cloudinary của bạn
    return RedirectResponse("https://res.cloudinary.com/dzemhw9vp/video/upload/v1760428523/%C3%94_%C4%82n_Quan_2025-04-21_10-50-37_ddqxbe.mp4")

# 2️⃣ Route: Callback TikTok redirect về sau khi user cho phép
@router.get("/callback")
def tiktok_callback(request: Request, code: str = None, state: str = None):
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


    # 4️⃣ Nếu cần, bạn có thể lấy thêm thông tin user TikTok
    if "access_token" in token_info.get("data", {}):
        access_token = token_info["data"]["access_token"]
        user_url = "https://open.tiktokapis.com/v2/user/info/"
        user_headers = {"Authorization": f"Bearer {access_token}"}
        user_res = requests.get(user_url, headers=user_headers)
        token_info["user_info"] = user_res.json()


    print(token_info)
    return token_info






#{"access_token":"act.AH4039voQ0zxqyFtlzrdXrl50thmtMc1yUFJh74stiv3fU8K2Yx3p4CvQ3Ra!6509.va","expires_in":86400,"open_id":"-000hLNeFCu7aluBmIBS1XngRBeXaEt0mpSu","refresh_expires_in":31536000,"refresh_token":"rft.u07d8U2HDSPFraiKU6aGTarnjs00GSZ9aRkyDQuovlCQgyj9DpB5OA65G6Mi!6526.va","scope":"user.info.basic,video.upload,video.publish","token_type":"Bearer"}

