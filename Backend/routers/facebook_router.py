from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers import facebook_page_controller
from core.auth import get_current_user
from models.model import User
import requests
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
import os

load_dotenv()  

URL = os.getenv("URL_BE")
URL_FE = os.getenv("URL")
router = APIRouter(prefix="/facebook-pages", tags=["Facebook Pages"])

   


# FB_CLIENT_ID = "4238615406374117"
# FB_CLIENT_SECRET = "47d60fe20efd7ce023c35380683ba6ef"

FB_CLIENT_ID = "1130979465654370"
FB_CLIENT_SECRET = "dda15803ebe7785219a19f1a2823d777"

REDIRECT_URI = f"{URL}/facebook-pages/callback"

@router.get("/callback")
async def facebook_callback(
    code: Optional[str] = None, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if code is None:
        # Trường hợp Meta hoặc người khác vào link callback không có code
        return {"message": "Facebook callback endpoint - waiting for code"}
    
    await facebook_page_controller.facebook_callback_controller(code, db, current_user.id)

    return RedirectResponse(url=f"{URL_FE}/admin/facebook_page")


# ==================== POST TO FACEBOOK PAGE ====================
from pydantic import BaseModel
from typing import List

class FacebookPostRequest(BaseModel):
    page_id: int  # ID trong database
    message: str
    media_urls: List[str] = []
    media_type: str = "image"  # "image" or "video"


@router.post("/post")
async def post_to_facebook(
    request: FacebookPostRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Đăng bài lên Facebook Page
    
    Body:
    {
        "page_id": 1,  // ID của page trong database
        "message": "Nội dung bài đăng",
        "media_urls": ["http://localhost:8000/uploads/image/abc.jpg"],
        "media_type": "image"  // "image" or "video"
    }
    """
    try:
        result = await facebook_page_controller.facebook_post_controller(
            page_id=request.page_id,
            message=request.message,
            media_urls=request.media_urls,
            media_type=request.media_type,
            db=db
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  