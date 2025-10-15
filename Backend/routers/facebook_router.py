from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers import facebook_page_controller
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
async def facebook_callback(code: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    if code is None:
        # Trường hợp Meta hoặc người khác vào link callback không có code
        return {"message": "Facebook callback endpoint - waiting for code"}
    
    await facebook_page_controller.facebook_callback_controller(code, db)

    return RedirectResponse(url=f"{URL_FE}/admin/facebook_page")  