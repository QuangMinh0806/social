"""
Threads API Service
Hỗ trợ đăng bài lên Threads thông qua Meta API

Threads Content Publishing API có 2 bước (giống Instagram):
1. Create Media Container (upload media và caption)
2. Publish Media Container (xuất bản lên Threads)

Documentation:
- https://developers.facebook.com/docs/threads/posts
- https://developers.facebook.com/docs/threads/reference/media
"""

import requests
from typing import List, Dict, Optional


async def post_to_threads(
    threads_user_id: str,
    access_token: str,
    text: str,
    media_files: List[bytes] = None,
    media_type: str = "image",
    media_url: str = None,
    media_urls: List[str] = None  # Danh sách URLs cho carousel
):
    """
    Đăng bài lên Threads
    
    Args:
        threads_user_id: ID của Threads User
        access_token: User Access Token (có quyền threads_basic, threads_content_publish)
        text: Nội dung text cho bài đăng
        media_files: List file data (bytes) - tùy chọn
        media_type: Loại media ('image', 'video', 'carousel')
        media_url: URL công khai của media (bắt buộc vì Threads không hỗ trợ upload trực tiếp)
        media_urls: Danh sách URLs cho carousel (nhiều ảnh)
    
    Returns:
        dict: Response từ Threads API
    
    Note:
        Threads API yêu cầu media phải có URL công khai (HTTPS)
        Không hỗ trợ upload file trực tiếp
        Cần upload lên server trước, sau đó truyền URL vào API
    """
    
    # Threads chỉ chấp nhận URL, không chấp nhận file upload trực tiếp
    if media_url and not media_url.startswith("https://"):
        return {
            "success": False,
            "error": {
                "message": "Threads API requires a public HTTPS URL for media. Please upload the file to a server first."
            }
        }
    
    # Nếu có nhiều URLs -> Carousel
    if media_urls and len(media_urls) > 1:
        return await post_carousel_to_threads(
            threads_user_id,
            access_token,
            text,
            media_urls
        )
    # Nếu chỉ 1 URL hoặc media_url -> Single image
    elif media_type == "image" and (media_url or (media_urls and len(media_urls) == 1)):
        image_url = media_url or media_urls[0]
        return await post_single_image_to_threads(
            threads_user_id,
            access_token,
            text,
            image_url
        )
    elif media_type == "video" and media_url:
        return await post_video_to_threads(
            threads_user_id,
            access_token,
            text,
            media_url
        )
    elif not media_url and not media_urls:
        # Text-only post
        return await post_text_to_threads(
            threads_user_id,
            access_token,
            text
        )
    else:
        return {
            "success": False,
            "error": {
                "message": f"Unsupported media type or configuration: {media_type}"
            }
        }


async def post_single_image_to_threads(
    threads_user_id: str,
    access_token: str,
    text: str,
    image_url: str
):
    """
    Đăng một ảnh lên Threads
    
    Step 1: Create Media Container
    POST https://graph.threads.net/v1.0/{threads-user-id}/threads
    
    Step 2: Publish Media Container
    POST https://graph.threads.net/v1.0/{threads-user-id}/threads_publish
    """
    
    # Step 1: Create container (Threads B1)
    create_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads"
    create_data = {
        "media_type": "IMAGE",
        "image_url": image_url,
        "text": text,
        "access_token": access_token
    }
    
    print(f"🔄 [Threads B1] Creating media container...")
    print(f"   🖼️ Image URL: {image_url}")
    create_response = requests.post(create_url, json=create_data)
    
    if create_response.status_code != 200:
        error_data = create_response.json()
        print(f"❌ [Threads B1] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "message": "Failed to create Threads media container",
            "step": "create_container"
        }
    
    container_id = create_response.json().get("id")
    print(f"✅ [Threads B1] Container created: {container_id}")
    
    # Step 2: Publish container (Threads B2)
    publish_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads_publish"
    publish_data = {
        "creation_id": container_id,
        "access_token": access_token
    }
    
    print(f"🔄 [Threads B2] Publishing container {container_id}...")
    publish_response = requests.post(publish_url, json=publish_data)
    
    if publish_response.status_code == 200:
        result = publish_response.json()
        media_id = result.get("id")
        print(f"✅ [Threads B2] Published successfully: {media_id}")
        
        # Step 3: Lấy permalink từ media ID
        permalink = None
        try:
            media_info_url = f"https://graph.threads.net/v1.0/{media_id}"
            media_info_params = {
                "fields": "permalink",
                "access_token": access_token
            }
            media_info_response = requests.get(media_info_url, params=media_info_params)
            if media_info_response.status_code == 200:
                permalink = media_info_response.json().get("permalink")
                print(f"🔗 [Threads] Permalink: {permalink}")
        except Exception as e:
            print(f"⚠️ [Threads] Could not fetch permalink: {e}")
        
        return {
            "success": True,
            "post_id": media_id,
            "container_id": container_id,
            "permalink": permalink,
            "message": "Posted to Threads successfully"
        }
    else:
        error_data = publish_response.json()
        print(f"❌ [Threads B2] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "container_id": container_id,
            "message": "Failed to publish Threads container",
            "step": "publish_container"
        }


async def post_video_to_threads(
    threads_user_id: str,
    access_token: str,
    text: str,
    video_url: str
):
    """
    Đăng video lên Threads
    
    Step 1: Create Video Container
    POST https://graph.threads.net/v1.0/{threads-user-id}/threads
    
    Step 2: Publish Video Container
    POST https://graph.threads.net/v1.0/{threads-user-id}/threads_publish
    """
    
    # Step 1: Create video container
    create_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads"
    create_data = {
        "media_type": "VIDEO",
        "video_url": video_url,
        "text": text,
        "access_token": access_token
    }
    
    print(f"🔄 [Threads B1] Creating video container...")
    print(f"   🎥 Video URL: {video_url}")
    create_response = requests.post(create_url, json=create_data)
    
    if create_response.status_code != 200:
        error_data = create_response.json()
        print(f"❌ [Threads B1] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "message": "Failed to create Threads video container",
            "step": "create_container"
        }
    
    container_id = create_response.json().get("id")
    print(f"✅ [Threads B1] Video container created: {container_id}")
    
    # Step 2: Publish container
    publish_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads_publish"
    publish_data = {
        "creation_id": container_id,
        "access_token": access_token
    }
    
    print(f"🔄 [Threads B2] Publishing video container {container_id}...")
    publish_response = requests.post(publish_url, json=publish_data)
    
    if publish_response.status_code == 200:
        result = publish_response.json()
        media_id = result.get("id")
        print(f"✅ [Threads B2] Video published successfully: {media_id}")
        return {
            "success": True,
            "post_id": media_id,
            "container_id": container_id,
            "message": "Posted video to Threads successfully"
        }
    else:
        error_data = publish_response.json()
        print(f"❌ [Threads B2] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "container_id": container_id,
            "message": "Failed to publish Threads video container",
            "step": "publish_container"
        }


async def post_text_to_threads(
    threads_user_id: str,
    access_token: str,
    text: str
):
    """
    Đăng text-only lên Threads
    
    Step 1: Create Text Container
    POST https://graph.threads.net/v1.0/{threads-user-id}/threads
    
    Step 2: Publish Text Container
    POST https://graph.threads.net/v1.0/{threads-user-id}/threads_publish
    """
    
    # Step 1: Create text container
    create_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads"
    create_data = {
        "media_type": "TEXT",
        "text": text,
        "access_token": access_token
    }
    
    print(f"🔄 [Threads B1] Creating text post...")
    create_response = requests.post(create_url, json=create_data)
    
    if create_response.status_code != 200:
        error_data = create_response.json()
        print(f"❌ [Threads B1] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "message": "Failed to create Threads text container",
            "step": "create_container"
        }
    
    container_id = create_response.json().get("id")
    print(f"✅ [Threads B1] Text container created: {container_id}")
    
    # Step 2: Publish container
    publish_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads_publish"
    publish_data = {
        "creation_id": container_id,
        "access_token": access_token
    }
    
    print(f"🔄 [Threads B2] Publishing text container {container_id}...")
    publish_response = requests.post(publish_url, json=publish_data)
    
    if publish_response.status_code == 200:
        result = publish_response.json()
        media_id = result.get("id")
        print(f"✅ [Threads B2] Text published successfully: {media_id}")
        return {
            "success": True,
            "post_id": media_id,
            "container_id": container_id,
            "message": "Posted text to Threads successfully"
        }
    else:
        error_data = publish_response.json()
        print(f"❌ [Threads B2] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "container_id": container_id,
            "message": "Failed to publish Threads text container",
            "step": "publish_container"
        }


async def post_carousel_to_threads(
    threads_user_id: str,
    access_token: str,
    text: str,
    image_urls: List[str]
):
    """
    Đăng carousel (nhiều ảnh) lên Threads
    
    Flow:
    1. Tạo item container cho từng ảnh (không cần text)
    2. Tạo carousel container chính (có text)
    3. Publish carousel container
    
    Args:
        threads_user_id: ID của Threads User
        access_token: Access token
        text: Caption cho carousel
        image_urls: Danh sách URLs của ảnh (2-10 ảnh)
    """
    
    print(f"🔄 [Threads Carousel] Creating carousel with {len(image_urls)} images...")
    
    # Step 1: Tạo item container cho từng ảnh
    item_ids = []
    for idx, image_url in enumerate(image_urls):
        print(f"   🖼️ [Item {idx+1}/{len(image_urls)}] Creating container for: {image_url}")
        
        item_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads"
        item_data = {
            "media_type": "IMAGE",
            "image_url": image_url,
            "is_carousel_item": True,
            "access_token": access_token
        }
        
        item_response = requests.post(item_url, json=item_data)
        
        if item_response.status_code != 200:
            error_data = item_response.json()
            print(f"   ❌ [Item {idx+1}] Failed: {error_data}")
            return {
                "success": False,
                "error": error_data,
                "message": f"Failed to create carousel item {idx+1}",
                "step": "create_item_container"
            }
        
        item_id = item_response.json().get("id")
        item_ids.append(item_id)
        print(f"   ✅ [Item {idx+1}] Container created: {item_id}")
    
    print(f"✅ [Threads Carousel] All {len(item_ids)} item containers created")
    
    # Step 2: Tạo carousel container chính
    print(f"🔄 [Threads Carousel B1] Creating main carousel container...")
    carousel_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads"
    carousel_data = {
        "media_type": "CAROUSEL",
        "text": text,
        "children": item_ids,  # Danh sách item IDs
        "access_token": access_token
    }
    
    carousel_response = requests.post(carousel_url, json=carousel_data)
    
    if carousel_response.status_code != 200:
        error_data = carousel_response.json()
        print(f"❌ [Threads Carousel B1] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "message": "Failed to create Threads carousel container",
            "step": "create_carousel_container"
        }
    
    carousel_id = carousel_response.json().get("id")
    print(f"✅ [Threads Carousel B1] Carousel container created: {carousel_id}")
    
    # Step 3: Publish carousel
    print(f"🔄 [Threads Carousel B2] Publishing carousel {carousel_id}...")
    publish_url = f"https://graph.threads.net/v1.0/{threads_user_id}/threads_publish"
    publish_data = {
        "creation_id": carousel_id,
        "access_token": access_token
    }
    
    publish_response = requests.post(publish_url, json=publish_data)
    
    if publish_response.status_code == 200:
        result = publish_response.json()
        media_id = result.get("id")
        print(f"✅ [Threads Carousel B2] Published successfully: {media_id}")
        print(f"   📸 Total images: {len(image_urls)}")
        
        # Lấy permalink từ media ID
        permalink = None
        try:
            media_info_url = f"https://graph.threads.net/v1.0/{media_id}"
            media_info_params = {
                "fields": "permalink",
                "access_token": access_token
            }
            media_info_response = requests.get(media_info_url, params=media_info_params)
            if media_info_response.status_code == 200:
                permalink = media_info_response.json().get("permalink")
                print(f"🔗 [Threads Carousel] Permalink: {permalink}")
        except Exception as e:
            print(f"⚠️ [Threads Carousel] Could not fetch permalink: {e}")
        
        return {
            "success": True,
            "post_id": media_id,
            "container_id": carousel_id,
            "item_ids": item_ids,
            "total_images": len(image_urls),
            "permalink": permalink,
            "message": f"Posted carousel with {len(image_urls)} images to Threads successfully"
        }
    else:
        error_data = publish_response.json()
        print(f"❌ [Threads Carousel B2] Failed: {error_data}")
        return {
            "success": False,
            "error": error_data,
            "container_id": carousel_id,
            "item_ids": item_ids,
            "message": "Failed to publish Threads carousel",
            "step": "publish_carousel"
        }
