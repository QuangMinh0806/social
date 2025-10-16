"""
Instagram Graph API Service
Hỗ trợ đăng bài lên Instagram Business Account thông qua Facebook Graph API

Instagram Content Publishing API có 2 bước:
1. Create Media Container (upload media và caption)
2. Publish Media Container (xuất bản lên Instagram)

Documentation:
- https://developers.facebook.com/docs/instagram-api/guides/content-publishing
- https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
"""

import requests
from typing import List, Dict, Optional


async def post_to_instagram(
    instagram_business_account_id: str,
    access_token: str,
    caption: str,
    media_files: List[bytes] = None,
    media_type: str = "image",
    media_url: str = None
):
    """
    Đăng bài lên Instagram Business Account
    
    Args:
        instagram_business_account_id: ID của Instagram Business Account
        access_token: Page Access Token (có quyền instagram_basic, instagram_content_publish)
        caption: Caption cho bài đăng
        media_files: List file data (bytes) - tùy chọn
        media_type: Loại media ('image', 'video', 'carousel')
        media_url: URL công khai của media (string cho single, list cho carousel)
    
    Returns:
        dict: Response từ Instagram API
    
    Note:
        Instagram API yêu cầu media phải có URL công khai (HTTPS)
        Không hỗ trợ upload file trực tiếp như Facebook
        Cần upload lên server trước, sau đó truyền URL vào API
    """
    
    # Instagram chỉ chấp nhận URL, không chấp nhận file upload trực tiếp
    if not media_url:
        return {
            "success": False,
            "error": {
                "message": "Instagram API requires a public HTTPS URL for media. Please upload the file to a server first."
            }
        }
    
    # Handle carousel (media_url is a list)
    if isinstance(media_url, list):
        return await post_carousel_to_instagram(
            instagram_business_account_id,
            access_token,
            caption,
            media_url
        )
    
    if media_type == "image":
        return await post_single_image_to_instagram(
            instagram_business_account_id,
            access_token,
            caption,
            media_url
        )
    elif media_type == "video":
        return await post_video_to_instagram(
            instagram_business_account_id,
            access_token,
            caption,
            media_url
        )
    elif media_type == "carousel":
        return await post_carousel_to_instagram(
            instagram_business_account_id,
            access_token,
            caption,
            media_url  # Expect this to be a list of URLs
        )
    else:
        return {
            "success": False,
            "error": {
                "message": f"Unsupported media type: {media_type}"
            }
        }


async def post_single_image_to_instagram(
    instagram_business_account_id: str,
    access_token: str,
    caption: str,
    image_url: str
):
    """
    Đăng một ảnh lên Instagram
    
    Step 1: Create IG Container
    POST https://graph.facebook.com/v21.0/{ig-user-id}/media
    
    Step 2: Publish IG Container
    POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish
    """
    
    # Step 1: Create container (Đăng IG B1)
    create_url = f"https://graph.facebook.com/v21.0/{instagram_business_account_id}/media"
    create_data = {
        "caption": caption,
        "image_url": image_url,
        "access_token": access_token
    }
    
    print(f"🔄 [Instagram B1] Creating media container...")
    create_response = requests.post(create_url, json=create_data)
    
    if create_response.status_code != 200:
        error_data = create_response.json()
        print(f"❌ [Instagram B1] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "message": "Failed to create Instagram media container",
            "step": "create_container"
        }
    
    container_id = create_response.json().get("id")
    print(f"✅ [Instagram B1] Container created: {container_id}")
    
    # Step 2: Publish container (Đăng IG B2)
    publish_url = f"https://graph.facebook.com/v21.0/{instagram_business_account_id}/media_publish"
    publish_data = {
        "creation_id": container_id,
        "access_token": access_token
    }
    
    print(f"🔄 [Instagram B2] Publishing container {container_id}...")
    publish_response = requests.post(publish_url, json=publish_data)
    
    if publish_response.status_code == 200:
        result = publish_response.json()
        media_id = result.get("id")
        print(f"✅ [Instagram B2] Published successfully: {media_id}")
        
        # Step 3: Lấy permalink từ media ID
        permalink = None
        try:
            media_info_url = f"https://graph.facebook.com/v21.0/{media_id}"
            media_info_params = {
                "fields": "permalink",
                "access_token": access_token
            }
            media_info_response = requests.get(media_info_url, params=media_info_params)
            if media_info_response.status_code == 200:
                permalink = media_info_response.json().get("permalink")
                print(f"🔗 [Instagram] Permalink: {permalink}")
        except Exception as e:
            print(f"⚠️ [Instagram] Could not fetch permalink: {e}")
        
        return {
            "success": True,
            "post_id": media_id,
            "container_id": container_id,
            "permalink": permalink,
            "message": "Posted to Instagram successfully"
        }
    else:
        error_data = publish_response.json()
        print(f"❌ [Instagram B2] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "message": "Failed to publish Instagram media",
            "step": "publish_container",
            "container_id": container_id
        }


async def post_video_to_instagram(
    instagram_business_account_id: str,
    access_token: str,
    caption: str,
    video_url: str
):
    """
    Đăng video lên Instagram
    
    Note: Video phải đáp ứng các yêu cầu:
    - Format: MP4 hoặc MOV
    - Aspect ratio: Between 4:5 and 16:9
    - Duration: 3-60 seconds (Feed), up to 15 minutes (IGTV)
    - Size: Max 100MB (Feed), Max 650MB (IGTV)
    """
    
    # Step 1: Create video container
    create_url = f"https://graph.facebook.com/v21.0/{instagram_business_account_id}/media"
    create_params = {
        "media_type": "VIDEO",
        "video_url": video_url,
        "caption": caption,
        "access_token": access_token
    }
    
    create_response = requests.post(create_url, params=create_params)
    
    if create_response.status_code != 200:
        return {
            "success": False,
            "error": create_response.json(),
            "message": "Failed to create Instagram video container"
        }
    
    container_id = create_response.json().get("id")
    
    # Step 2: Check status (video processing takes time)
    # TODO: Implement polling to check status
    # GET https://graph.facebook.com/v21.0/{ig-container-id}?fields=status_code
    
    # Step 3: Publish when ready (status_code = FINISHED)
    publish_url = f"https://graph.facebook.com/v21.0/{instagram_business_account_id}/media_publish"
    publish_params = {
        "creation_id": container_id,
        "access_token": access_token
    }
    
    publish_response = requests.post(publish_url, params=publish_params)
    
    if publish_response.status_code == 200:
        result = publish_response.json()
        return {
            "success": True,
            "post_id": result.get("id"),
            "container_id": container_id,
            "message": "Posted video to Instagram successfully"
        }
    else:
        return {
            "success": False,
            "error": publish_response.json(),
            "message": "Failed to publish Instagram video"
        }


async def get_instagram_business_account(page_id: str, access_token: str) -> Optional[str]:
    """
    Lấy Instagram Business Account ID từ Facebook Page
    
    Args:
        page_id: Facebook Page ID
        access_token: Page Access Token
    
    Returns:
        str: Instagram Business Account ID hoặc None
    """
    url = f"https://graph.facebook.com/v21.0/{page_id}"
    params = {
        "fields": "instagram_business_account",
        "access_token": access_token
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        ig_account = data.get("instagram_business_account", {})
        return ig_account.get("id")
    else:
        return None


async def post_carousel_to_instagram(
    instagram_business_account_id: str,
    access_token: str,
    caption: str,
    media_urls: List[str]
):
    """
    Đăng carousel (nhiều ảnh/video) lên Instagram
    
    Instagram Carousel có thể chứa 2-10 items (ảnh hoặc video)
    
    Flow:
    1. Tạo container cho từng item (không có caption)
    2. Tạo carousel container với list item containers và caption
    3. Publish carousel container
    
    Args:
        instagram_business_account_id: ID của Instagram Business Account
        access_token: Page Access Token
        caption: Caption cho carousel
        media_urls: List URLs của ảnh/video (2-10 items)
    
    Returns:
        dict: Response từ Instagram API
    
    Documentation:
        https://developers.facebook.com/docs/instagram-api/guides/content-publishing#carousel-posts
    """
    
    if not media_urls or len(media_urls) < 2:
        return {
            "success": False,
            "error": {
                "message": "Carousel requires at least 2 media items"
            },
            "step": "validation"
        }
    
    if len(media_urls) > 10:
        return {
            "success": False,
            "error": {
                "message": "Carousel supports maximum 10 media items"
            },
            "step": "validation"
        }
    
    try:
        # Step 1: Create container cho từng item
        item_container_ids = []
        
        for idx, media_url in enumerate(media_urls):
            print(f"🔄 [Instagram Carousel] Creating item container {idx + 1}/{len(media_urls)}")
            
            # Detect media type từ URL (image or video)
            is_video = media_url.lower().endswith(('.mp4', '.mov', '.avi'))
            
            create_url = f"https://graph.facebook.com/v21.0/{instagram_business_account_id}/media"
            
            if is_video:
                create_data = {
                    "media_type": "VIDEO",
                    "video_url": media_url,
                    "is_carousel_item": True,
                    "access_token": access_token
                }
            else:
                create_data = {
                    "image_url": media_url,
                    "is_carousel_item": True,
                    "access_token": access_token
                }
            
            create_response = requests.post(create_url, json=create_data)
            
            if create_response.status_code != 200:
                error_data = create_response.json()
                print(f"❌ [Instagram Carousel] Failed to create item {idx + 1}: {error_data}")
                return {
                    "success": False,
                    "error": error_data,
                    "message": f"Failed to create carousel item {idx + 1}",
                    "step": "create_item_container",
                    "item_index": idx
                }
            
            container_id = create_response.json().get("id")
            item_container_ids.append(container_id)
            print(f"✅ [Instagram Carousel] Item container {idx + 1} created: {container_id}")
        
        # Step 2: Create carousel container
        print(f"🔄 [Instagram Carousel] Creating carousel container with {len(item_container_ids)} items")
        
        carousel_url = f"https://graph.facebook.com/v21.0/{instagram_business_account_id}/media"
        carousel_data = {
            "media_type": "CAROUSEL",
            "caption": caption,
            "children": ",".join(item_container_ids),  # Comma-separated list
            "access_token": access_token
        }
        
        carousel_response = requests.post(carousel_url, json=carousel_data)
        
        if carousel_response.status_code != 200:
            error_data = carousel_response.json()
            print(f"❌ [Instagram Carousel] Failed to create carousel container: {error_data}")
            return {
                "success": False,
                "error": error_data,
                "message": "Failed to create carousel container",
                "step": "create_carousel_container",
                "item_containers": item_container_ids
            }
        
        carousel_container_id = carousel_response.json().get("id")
        print(f"✅ [Instagram Carousel] Carousel container created: {carousel_container_id}")
        
        # Step 3: Publish carousel
        print(f"🔄 [Instagram Carousel] Publishing carousel {carousel_container_id}")
        
        publish_url = f"https://graph.facebook.com/v21.0/{instagram_business_account_id}/media_publish"
        publish_data = {
            "creation_id": carousel_container_id,
            "access_token": access_token
        }
        
        publish_response = requests.post(publish_url, json=publish_data)
        
        if publish_response.status_code == 200:
            result = publish_response.json()
            media_id = result.get("id")
            print(f"✅ [Instagram Carousel] Published successfully: {media_id}")
            
            # Get permalink
            permalink = None
            try:
                media_info_url = f"https://graph.facebook.com/v21.0/{media_id}"
                media_info_params = {
                    "fields": "permalink",
                    "access_token": access_token
                }
                media_info_response = requests.get(media_info_url, params=media_info_params)
                if media_info_response.status_code == 200:
                    permalink = media_info_response.json().get("permalink")
                    print(f"🔗 [Instagram Carousel] Permalink: {permalink}")
            except Exception as e:
                print(f"⚠️ [Instagram Carousel] Could not fetch permalink: {e}")
            
            return {
                "success": True,
                "post_id": media_id,
                "container_id": carousel_container_id,
                "item_containers": item_container_ids,
                "item_count": len(item_container_ids),
                "permalink": permalink,
                "message": f"Posted carousel with {len(item_container_ids)} items to Instagram successfully"
            }
        else:
            error_data = publish_response.json()
            print(f"❌ [Instagram Carousel] Failed to publish: {error_data}")
            return {
                "success": False,
                "error": error_data,
                "message": "Failed to publish Instagram carousel",
                "step": "publish_carousel",
                "container_id": carousel_container_id,
                "item_containers": item_container_ids
            }
    
    except Exception as e:
        print(f"❌ [Instagram Carousel] Exception: {str(e)}")
        return {
            "success": False,
            "error": {
                "message": str(e)
            },
            "step": "exception"
        }

