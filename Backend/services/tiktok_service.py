"""
TikTok Content Posting API Service
Hỗ trợ đăng video lên TikTok thông qua TikTok for Developers API

TikTok API Flow:
1. Initialize Video Upload
2. Upload Video Chunks
3. Publish Video

Documentation:
- https://developers.tiktok.com/doc/content-posting-api-get-started
- https://developers.tiktok.com/doc/content-posting-api-video-post
"""

import requests
from typing import Dict, Optional


async def post_to_tiktok(
    access_token: str,
    video_file: bytes,
    title: str = "",
    description: str = "",
    privacy_level: str = "PUBLIC_TO_EVERYONE",
    disable_comment: bool = False,
    disable_duet: bool = False,
    disable_stitch: bool = False
):
    """
    Đăng video lên TikTok
    
    Args:
        access_token: TikTok User Access Token
        video_file: Video file data (bytes)
        title: Tiêu đề video (max 150 characters)
        description: Mô tả video / caption (max 2200 characters)
        privacy_level: Mức độ riêng tư (PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, SELF_ONLY)
        disable_comment: Tắt bình luận
        disable_duet: Tắt duet
        disable_stitch: Tắt stitch
    
    Returns:
        dict: Response từ TikTok API
    
    Note:
        - Video requirements:
          * Format: MP4
          * Resolution: Minimum 720p
          * Duration: 3 seconds to 10 minutes
          * Size: Max 4GB
    """
    
    # Step 1: Initialize video upload
    init_response = await _initialize_video_upload(
        access_token=access_token,
        title=title,
        description=description,
        privacy_level=privacy_level,
        disable_comment=disable_comment,
        disable_duet=disable_duet,
        disable_stitch=disable_stitch
    )
    
    if not init_response.get("success"):
        return init_response
    
    upload_url = init_response.get("upload_url")
    publish_id = init_response.get("publish_id")
    
    # Step 2: Upload video
    upload_response = await _upload_video(upload_url, video_file)
    
    if not upload_response.get("success"):
        return upload_response
    
    # Step 3: Publish video (hoặc check status)
    return {
        "success": True,
        "publish_id": publish_id,
        "message": "Video uploaded successfully. TikTok is processing the video.",
        "note": "Use publish_id to check status or confirm publish"
    }


async def _initialize_video_upload(
    access_token: str,
    title: str,
    description: str,
    privacy_level: str,
    disable_comment: bool,
    disable_duet: bool,
    disable_stitch: bool
) -> Dict:
    """
    Khởi tạo video upload session
    
    POST https://open.tiktokapis.com/v2/post/publish/video/init/
    """
    
    url = "https://open.tiktokapis.com/v2/post/publish/video/init/"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "post_info": {
            "title": title[:150],  # Max 150 characters
            "description": description[:2200],  # Max 2200 characters
            "privacy_level": privacy_level,
            "disable_comment": disable_comment,
            "disable_duet": disable_duet,
            "disable_stitch": disable_stitch
        },
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": 0,  # Will be updated when uploading
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json().get("data", {})
        return {
            "success": True,
            "upload_url": data.get("upload_url"),
            "publish_id": data.get("publish_id"),
        }
    else:
        return {
            "success": False,
            "error": response.json(),
            "message": "Failed to initialize TikTok video upload"
        }


async def _upload_video(upload_url: str, video_file: bytes) -> Dict:
    """
    Upload video file lên TikTok
    
    PUT {upload_url}
    """
    
    headers = {
        "Content-Type": "video/mp4",
        "Content-Length": str(len(video_file))
    }
    
    response = requests.put(upload_url, headers=headers, data=video_file)
    
    if response.status_code in [200, 201]:
        return {
            "success": True,
            "message": "Video uploaded successfully"
        }
    else:
        return {
            "success": False,
            "error": response.text,
            "message": "Failed to upload video to TikTok"
        }


async def check_publish_status(access_token: str, publish_id: str) -> Dict:
    """
    Kiểm tra trạng thái video đã upload
    
    POST https://open.tiktokapis.com/v2/post/publish/status/fetch/
    
    Args:
        access_token: TikTok User Access Token
        publish_id: ID nhận được khi initialize upload
    
    Returns:
        dict: Status information
    """
    
    url = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "publish_id": publish_id
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json().get("data", {})
        status = data.get("status")  # PROCESSING, PUBLISHED, FAILED
        
        return {
            "success": True,
            "status": status,
            "publish_id": data.get("publish_id"),
            "video_id": data.get("video_id"),  # Available when PUBLISHED
            "fail_reason": data.get("fail_reason") if status == "FAILED" else None
        }
    else:
        return {
            "success": False,
            "error": response.json(),
            "message": "Failed to check TikTok publish status"
        }


async def get_user_info(access_token: str) -> Optional[Dict]:
    """
    Lấy thông tin user TikTok
    
    GET https://open.tiktokapis.com/v2/user/info/
    """
    
    url = "https://open.tiktokapis.com/v2/user/info/"
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    params = {
        "fields": "open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count"
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json().get("data", {}).get("user")
    else:
        return None
