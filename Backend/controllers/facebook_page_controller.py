from sqlalchemy.ext.asyncio import AsyncSession
from services.facebook_page_service import facebook_callback_service, post_to_facebook_page
import requests
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv
import os
from sqlalchemy import select
from models.model import Page, Platform

load_dotenv()  

FB_CLIENT_ID = os.getenv("FB_CLIENT_ID")
FB_CLIENT_SECRET = os.getenv("FB_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/facebook-pages/callback"


async def facebook_post_controller(
    page_id: int,
    message: str,
    media_urls: list,
    media_type: str,
    db: AsyncSession
):
    """
    Controller để đăng bài lên Facebook Page
    
    Args:
        page_id: ID của page trong database (không phải FB page_id)
        message: Nội dung bài đăng
        media_urls: Danh sách URL media
        media_type: "image" hoặc "video"
        db: Database session
    """
    # Lấy thông tin page từ database
    result = await db.execute(select(Page).filter(Page.id == page_id))
    page = result.scalar_one_or_none()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if not page.access_token:
        raise HTTPException(status_code=400, detail="Page không có access token")
    
    # Đăng bài lên Facebook
    result = await post_to_facebook_page(
        page_id=page.page_id,  # FB page ID
        access_token=page.access_token,
        message=message,
        media_urls=media_urls,
        media_type=media_type
    )
    
    return result


async def facebook_callback_controller(code: str, db: AsyncSession, user_id: int):
    """
    Controller xử lý callback từ Facebook OAuth
    1. Đổi code lấy access_token
    2. Lấy danh sách pages của user
    3. Lưu vào database
    """
    
    # 1. Đổi code lấy access_token
    token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
    params = {
        "client_id": FB_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": FB_CLIENT_SECRET,
        "code": code
    }

    response = requests.get(token_url, params=params)
    if response.status_code != 200:
        print("Token exchange error:", response.text)
        raise HTTPException(status_code=400, detail="Failed to get access token")

    data = response.json()
    
    print("Access token data:", data)
    access_token = data.get("access_token")

    # 2. Lấy thông tin pages
    get_pages_url = "https://graph.facebook.com/me/accounts"
    page_params = {
        "access_token": access_token,
        "fields": "id,name,access_token,instagram_business_account{id,username,profile_picture_url}"
    }
    pages_response = requests.get(get_pages_url, params=page_params)
    
    if pages_response.status_code != 200:
        print("Get pages error:", pages_response.text)
        raise HTTPException(status_code=400, detail="Failed to get pages")
    
    pages = pages_response.json()
    print("Pages data:", pages)
    
    # 3. Lưu vào database
    result = await facebook_callback_service(pages, db, user_id)
    
    return result




