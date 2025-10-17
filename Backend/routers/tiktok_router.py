from fastapi import APIRouter, Request
import requests
import os
from urllib.parse import urlencode

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



