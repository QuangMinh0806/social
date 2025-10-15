from sqlalchemy.ext.asyncio import AsyncSession
# from services import facebook_page_service
import requests
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv
import os

load_dotenv()  

URL_BE = os.getenv("URL_BE")
FB_CLIENT_ID = "1130979465654370"
FB_CLIENT_SECRET = "dda15803ebe7785219a19f1a2823d777"

# FB_CLIENT_ID = "1130979465654370"
# FB_CLIENT_SECRET = "dda15803ebe7785219a19f1a2823d777"
# REDIRECT_URI = f"{URL_BE}/facebook-pages/callback"




REDIRECT_URI = "http://localhost:8000/facebook-pages/callback"


print("URL_BE:", REDIRECT_URI)






async def facebook_callback_controller(code: str, db: AsyncSession):
    
    token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
    params = {
        "client_id": FB_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": FB_CLIENT_SECRET,
        "code": code
    }

    response = requests.get(token_url, params=params)
    if response.status_code != 200:
        print(response)
        raise HTTPException(status_code=400, detail="Failed to get access token")

    data = response.json()
    access_token = data.get("access_token")

    # 2. Lấy thông tin page
    get_pages = "https://graph.facebook.com/me/accounts"
    page_params = {
        "access_token": access_token
    }
    pages = requests.get(get_pages, params=page_params).json()
    
    
    # return await facebook_page_service.facebook_callback_service(pages, db)
    
    print("Pages data:", pages)




