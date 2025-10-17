from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.model import Page, Platform, PageStatus
import json
from datetime import datetime


async def facebook_callback_service(payload: dict, db: AsyncSession, user_id: int):
    """
    Lưu thông tin Facebook pages vào database
    Payload format từ Facebook Graph API:
    {
        'data': [
            {
                'access_token': '...',
                'category': '...',
                'category_list': [...],
                'name': '...',
                'id': '...',
                'tasks': [...]
            }
        ],
        'paging': {...}
    }
    """
    
    # Lấy platform_id của Facebook (giả sử Facebook có id = 1)
    # Nếu chưa có, tạo mới
    result = await db.execute(select(Platform).filter(Platform.name == "Facebook"))
    facebook_platform = result.scalar_one_or_none()
    
    if not facebook_platform:
        # Tạo platform Facebook nếu chưa có
        facebook_platform = Platform(
            name="Facebook",
            icon_url="https://cdn-icons-png.flaticon.com/512/174/174848.png",
            is_active=True
        )
        db.add(facebook_platform)
        await db.commit()
        await db.refresh(facebook_platform)
    
    platform_id = facebook_platform.id
    
    # Lấy danh sách pages từ payload
    pages_data = payload.get("data", [])
    saved_pages = []
    
    for page_data in pages_data:
        page_access_token = page_data.get("access_token")
        page_id = page_data.get("id")
        page_name = page_data.get("name")
        page_category = page_data.get("category", "")
        
        # Tạo page_url từ page_id
        page_url = f"https://www.facebook.com/{page_id}"
        
        # Kiểm tra xem page đã tồn tại chưa
        result = await db.execute(
            select(Page).filter(
                Page.platform_id == platform_id,
                Page.page_id == page_id
            )
        )
        existing_page = result.scalar_one_or_none()
        
        if existing_page:
            # Cập nhật page đã tồn tại
            existing_page.access_token = page_access_token
            existing_page.page_name = page_name
            existing_page.page_url = page_url
            existing_page.status = PageStatus.connected
            existing_page.last_sync_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(existing_page)
            saved_pages.append(existing_page)
            
        else:
            # Tạo page mới
            new_page = Page(
                platform_id=platform_id,
                page_id=page_id,
                page_name=page_name,
                page_url=page_url,
                avatar_url=None,  # Facebook Graph API không trả về avatar trong /me/accounts
                access_token=page_access_token,
                token_expires_at=None,  # Có thể tính toán từ expires_in nếu có
                status=PageStatus.connected,
                follower_count=0,  # Cần gọi API riêng để lấy
                created_by=user_id,
                connected_at=datetime.utcnow(),
                last_sync_at=datetime.utcnow()
            )
            
            db.add(new_page)
            await db.commit()
            await db.refresh(new_page)
            saved_pages.append(new_page)
    
    return {
        "success": True,
        "message": f"Đã lưu {len(saved_pages)} Facebook page(s)",
        "data": saved_pages
    }


async def get_all_pages_service(db: AsyncSession):
    """Lấy tất cả Facebook pages"""
    result = await db.execute(
        select(Page)
        .join(Platform)
        .filter(Platform.name == "Facebook")
    )
    return result.scalars().all()


async def post_to_facebook_page(
    page_id: str,
    access_token: str,
    message: str,
    media_files: list = None,
    media_type: str = "image"  # "image" or "video"
):
    """
    Đăng bài lên Facebook Page
    Upload media trực tiếp lên Facebook (không lưu server)
    
    Args:
        page_id: ID của Facebook Page
        access_token: Access token của page
        message: Nội dung bài đăng
        media_files: Danh sách file data (bytes) hoặc URLs của media
        media_type: Loại media ("image" hoặc "video")
    
    Returns:
        dict: Response từ Facebook API
    """
    import requests
    
    # Case 1: Đăng text only (không có media)
    if not media_files or len(media_files) == 0:
        return await post_text_only(page_id, access_token, message)
    
    # Case 2: Đăng với ảnh
    elif media_type == "image":
        if len(media_files) == 1:
            # Single image
            return await post_single_image(page_id, access_token, message, media_files[0])
        else:
            # Multiple images (carousel/album)
            return await post_multiple_images(page_id, access_token, message, media_files)
    
    # Case 3: Đăng với video
    elif media_type == "video":
        return await post_video(page_id, access_token, message, media_files[0])
    
    else:
        raise ValueError(f"Unsupported media type: {media_type}")


async def post_text_only(page_id: str, access_token: str, message: str):
    """
    Đăng bài chỉ có text lên Facebook Page
    
    API Endpoint: POST /v21.0/{page-id}/feed
    """
    import requests
    
    url = f"https://graph.facebook.com/v21.0/{page_id}/feed"
    
    data = {
        "message": message,
        "access_token": access_token
    }
    
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        result = response.json()
        return {
            "success": True,
            "post_id": result.get("id"),
            "message": "Đăng bài text thành công"
        }
    else:
        return {
            "success": False,
            "error": response.json(),
            "message": "Đăng bài text thất bại"
        }


async def post_single_image(page_id: str, access_token: str, message: str, image_data):
    """
    Đăng bài với 1 ảnh lên Facebook Page
    Upload ảnh trực tiếp từ file (không qua server)
    
    API Endpoint: POST /v21.0/{page-id}/photos
    
    Args:
        page_id: Facebook Page ID
        access_token: Page access token
        message: Nội dung bài đăng
        image_data: File data (bytes) hoặc URL của ảnh
    """
    import requests
    
    url = f"https://graph.facebook.com/v21.0/{page_id}/photos"
    
    # Nếu image_data là bytes (file upload), dùng files parameter
    if isinstance(image_data, bytes):
        files = {
            'source': ('image.jpg', image_data, 'image/jpeg')
        }
        data = {
            "message": message,
            "access_token": access_token,
            "published": "true"
        }
        response = requests.post(url, data=data, files=files)
    else:
        # Nếu là URL (fallback)
        data = {
            "url": image_data,
            "message": message,
            "access_token": access_token,
            "published": "true"
        }
        response = requests.post(url, data=data)
    
    if response.status_code == 200:
        result = response.json()
        return {
            "success": True,
            "post_id": result.get("id"),
            "post_url": result.get("post_id"),
            "message": "Đăng bài với ảnh thành công"
        }
    else:
        return {
            "success": False,
            "error": response.json(),
            "message": "Đăng bài với ảnh thất bại"
        }


async def post_multiple_images(page_id: str, access_token: str, message: str, images_data: list):
    """
    Đăng bài với nhiều ảnh (carousel/album) lên Facebook Page
    Upload ảnh trực tiếp từ file (không qua server)
    
    Steps:
    1. Upload từng ảnh lên FB (unpublished)
    2. Tạo post với các ảnh đã upload
    
    API Endpoint: 
    - POST /v21.0/{page-id}/photos (upload unpublished)
    - POST /v21.0/{page-id}/feed (create post with attached_media)
    
    Args:
        page_id: Facebook Page ID
        access_token: Page access token
        message: Nội dung bài đăng
        images_data: List of file data (bytes) hoặc URLs
    """
    import requests
    
    # Step 1: Upload các ảnh lên Facebook (unpublished)
    uploaded_media = []
    
    for idx, image_data in enumerate(images_data):
        upload_url = f"https://graph.facebook.com/v21.0/{page_id}/photos"
        
        # Nếu image_data là bytes (file upload)
        if isinstance(image_data, bytes):
            files = {
                'source': (f'image_{idx}.jpg', image_data, 'image/jpeg')
            }
            upload_data = {
                "access_token": access_token,
                "published": "false"  # Không publish ngay
            }
            upload_response = requests.post(upload_url, data=upload_data, files=files)
        else:
            # Nếu là URL (fallback)
            upload_data = {
                "url": image_data,
                "access_token": access_token,
                "published": "false"
            }
            upload_response = requests.post(upload_url, data=upload_data)
        
        if upload_response.status_code == 200:
            result = upload_response.json()
            uploaded_media.append({
                "media_fbid": result.get("id")
            })
        else:
            return {
                "success": False,
                "error": upload_response.json(),
                "message": f"Upload ảnh {idx + 1} thất bại"
            }
    
    # Step 2: Tạo post với các ảnh đã upload
    post_url = f"https://graph.facebook.com/v21.0/{page_id}/feed"
    post_data = {
        "message": message,
        "access_token": access_token,
        "attached_media": uploaded_media
    }
    
    post_response = requests.post(post_url, json=post_data)
    
    if post_response.status_code == 200:
        result = post_response.json()
        return {
            "success": True,
            "post_id": result.get("id"),
            "message": f"Đăng bài với {len(images_data)} ảnh thành công"
        }
    else:
        return {
            "success": False,
            "error": post_response.json(),
            "message": "Đăng bài với nhiều ảnh thất bại"
        }


async def post_video(page_id: str, access_token: str, message: str, video_data):
    """
    Đăng bài với video lên Facebook Page
    Upload video trực tiếp từ file (không qua server)
    
    API Endpoint: POST /v21.0/{page-id}/videos
    
    Args:
        page_id: Facebook Page ID
        access_token: Page access token
        message: Nội dung bài đăng
        video_data: File data (bytes) hoặc URL của video
    """
    import requests
    
    url = f"https://graph.facebook.com/v21.0/{page_id}/videos"
    
    # Nếu video_data là bytes (file upload)
    if isinstance(video_data, bytes):
        files = {
            'source': ('video.mp4', video_data, 'video/mp4')
        }
        data = {
            "description": message,
            "access_token": access_token,
            "published": "true"
        }
        response = requests.post(url, data=data, files=files)
    else:
        # Nếu là URL (fallback)
        data = {
            "file_url": video_data,
            "description": message,
            "access_token": access_token,
            "published": "true"
        }
        response = requests.post(url, data=data)
    
    if response.status_code == 200:
        result = response.json()
        return {
            "success": True,
            "video_id": result.get("id"),
            "message": "Đăng video thành công"
        }
    else:
        return {
            "success": False,
            "error": response.json(),
            "message": "Đăng video thất bại"
        }




