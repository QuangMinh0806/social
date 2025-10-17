"""
TikTok Content Posting API Service
Hỗ trợ đăng video lên TikTok thông qua TikTok for Developers API

TikTok API Flow (PRODUCTION):
1. POST /v2/post/publish/video/init/ - Initialize upload with post_info & source_info
2. PUT {upload_url} - Upload video binary with Content-Range
3. POST /v2/post/publish/status/fetch/ - Check status (PROCESSING -> PUBLISHED)

Documentation:
- https://developers.tiktok.com/doc/content-posting-api-get-started
- https://developers.tiktok.com/doc/content-posting-api-video-post
"""

import requests
from typing import Dict, Optional
import os


async def post_to_tiktok(
    access_token: str,
    video_file: bytes,
    title: str = "",
    description: str = "",
    privacy_level: str = "SELF_ONLY",  # ✅ Sandbox mode requires SELF_ONLY
    disable_comment: bool = False,
    disable_duet: bool = False,
    disable_stitch: bool = False
):
    """
    Đăng video lên TikTok (PRODUCTION API)
    
    Flow:
    1. POST /v2/post/publish/video/init/ - Initialize với post_info + source_info
    2. PUT {upload_url} - Upload video binary với Content-Range
    3. POST /v2/post/publish/status/fetch/ - Check status (PROCESSING → PUBLISHED)
    
    Args:
        access_token: TikTok User Access Token (from OAuth)
        video_file: Video file data (bytes)
        title: Tiêu đề video (max 150 characters)
        description: Mô tả video / caption (max 2200 characters) - optional
        privacy_level: PUBLIC_TO_EVERYONE | MUTUAL_FOLLOW_FRIENDS | SELF_ONLY
        disable_comment: Tắt bình luận (default: False)
        disable_duet: Tắt duet (default: False)
        disable_stitch: Tắt stitch (default: False)
    
    Returns:
        dict: {
            "success": True/False,
            "publish_id": "v_pub_file~v2-1.xxx",
            "message": "...",
            "video_id": "xxx" (if PUBLISHED immediately)
        }
    
    Note:
        - Video requirements:
          * Format: MP4
          * Resolution: Minimum 720p
          * Duration: 3 seconds to 10 minutes
          * Size: Max 4GB
    """
    
    print(f"\n{'='*60}")
    print(f"🎬 TIKTOK VIDEO UPLOAD - PRODUCTION API")
    print(f"{'='*60}")
    print(f"📊 Video size: {len(video_file)} bytes ({len(video_file) / 1024 / 1024:.2f} MB)")
    print(f"📝 Title: {title[:50]}{'...' if len(title) > 50 else ''}")
    print(f"🔒 Privacy: {privacy_level}")
    
    # Step 1: Initialize video upload với post_info
    print(f"\n📍 STEP 1: Initialize Upload (with post_info)")
    init_response = await _initialize_video_upload(
        access_token=access_token,
        video_size=len(video_file),
        title=title,
        privacy_level=privacy_level,
        disable_comment=disable_comment,
        disable_duet=disable_duet,
        disable_stitch=disable_stitch
    )
    
    if not init_response.get("success"):
        print(f"❌ Step 1 Failed: {init_response.get('message')}")
        return init_response
    
    upload_url = init_response.get("upload_url")
    publish_id = init_response.get("publish_id")
    
    print(f"✅ Step 1 Complete - Publish ID: {publish_id}")
    
    # Step 2: Upload video (B2)
    print(f"\n📍 STEP 2: Upload Video Binary")
    upload_response = await _upload_video(upload_url, video_file)
    
    if not upload_response.get("success"):
        print(f"❌ Step 2 Failed: {upload_response.get('message')}")
        return upload_response
    
    print(f"✅ Step 2 Complete - Video uploaded")
    
    # Return success với publish_id
    print(f"\n{'='*60}")
    print(f"✅ TIKTOK UPLOAD COMPLETE!")
    print(f"   Publish ID: {publish_id}")
    print(f"   Status: Video đang được TikTok xử lý...")
    print(f"{'='*60}\n")
    
    return {
        "success": True,
        "publish_id": publish_id,
        "message": "Video uploaded successfully. TikTok is processing the video.",
        "note": "Use check_publish_status(publish_id) to check if video is PUBLISHED"
    }


async def _initialize_video_upload(
    access_token: str,
    video_size: int,
    title: str,
    privacy_level: str,
    disable_comment: bool,
    disable_duet: bool,
    disable_stitch: bool
) -> Dict:
    """
    Khởi tạo video upload session (PRODUCTION API)
    
    POST https://open.tiktokapis.com/v2/post/publish/video/init/
    
    Args:
        access_token: TikTok access token
        video_size: Kích thước video (bytes)
        title: Tiêu đề video
        privacy_level: Mức độ riêng tư
        disable_comment: Tắt comment
        disable_duet: Tắt duet
        disable_stitch: Tắt stitch
    
    Returns:
        {
            "success": True/False,
            "upload_url": "https://...",
            "publish_id": "v_pub_file~v2-1.xxx"
        }
    """
    
    # PRODUCTION endpoint
    url = "https://open.tiktokapis.com/v2/post/publish/video/init/"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8"
    }
    
    # Body theo API mới: post_info + source_info
    payload = {
        "post_info": {
            "title": title[:150],  # Max 150 characters
            "privacy_level": privacy_level,
            "disable_duet": disable_duet,
            "disable_comment": disable_comment,
            "disable_stitch": disable_stitch
        },
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": video_size,
            "chunk_size": video_size,  # Upload toàn bộ trong 1 chunk
            "total_chunk_count": 1
        }
    }
    
    print(f"   📤 POST {url}")
    print(f"   📦 Payload:")
    print(f"      post_info: {payload['post_info']}")
    print(f"      source_info: {payload['source_info']}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"   📥 Status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            data = response_data.get("data", {})
            error = response_data.get("error", {})
            
            upload_url = data.get("upload_url")
            publish_id = data.get("publish_id")
            
            # Check error code
            error_code = error.get("code", "")
            if error_code != "ok" and error_code:
                error_msg = error.get("message", "Unknown error")
                print(f"   ❌ TikTok API Error: [{error_code}] {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "error_code": error_code,
                    "message": f"TikTok API error: {error_msg}"
                }
            
            if not upload_url or not publish_id:
                print(f"   ❌ Missing upload_url or publish_id")
                print(f"   Response: {response_data}")
                return {
                    "success": False,
                    "error": data,
                    "message": "Missing upload_url or publish_id in response"
                }
            
            print(f"   ✅ Upload URL: {upload_url[:80]}...")
            print(f"   ✅ Publish ID: {publish_id}")
            
            return {
                "success": True,
                "upload_url": upload_url,
                "publish_id": publish_id,
            }
        else:
            error_data = response.json() if response.text else {"status": response.status_code}
            error_msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            print(f"   ❌ Error: {error_msg}")
            return {
                "success": False,
                "error": error_data,
                "status_code": response.status_code,
                "message": f"TikTok API returned status {response.status_code}"
            }
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Request timeout",
            "message": "TikTok API request timed out after 30s"
        }
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Exception during TikTok init: {str(e)}"
        }


async def _upload_video(upload_url: str, video_file: bytes) -> Dict:
    """
    Upload video file lên TikTok (SANDBOX - B2)
    
    PUT {upload_url} với binary video data
    
    Note: TikTok yêu cầu Content-Range header để upload chunk
    """
    
    video_size = len(video_file)
    
    headers = {
        "Content-Type": "video/mp4",
        "Content-Length": str(video_size),
        "Content-Range": f"bytes 0-{video_size-1}/{video_size}"  # Required by TikTok
    }
    
    print(f"🎬 [TikTok B2] Uploading video to: {upload_url}")
    print(f"   Video size: {video_size} bytes ({video_size / 1024 / 1024:.2f} MB)")
    print(f"   Headers: {headers}")
    
    try:
        # Upload với binary data
        response = requests.put(upload_url, headers=headers, data=video_file, timeout=300)
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500] if response.text else 'Empty'}")
        
        if response.status_code in [200, 201]:
            print(f"   ✅ Video uploaded successfully!")
            return {
                "success": True,
                "message": "Video uploaded successfully"
            }
        else:
            print(f"   ❌ Upload failed: {response.text}")
            return {
                "success": False,
                "error": response.text or f"HTTP {response.status_code}",
                "status_code": response.status_code,
                "message": f"Failed to upload video to TikTok (Status: {response.status_code})"
            }
    except Exception as e:
        print(f"   ❌ Exception during upload: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Exception during video upload: {str(e)}"
        }


async def check_publish_status(access_token: str, publish_id: str) -> Dict:
    """
    Kiểm tra trạng thái video đã upload
    
    POST https://open.tiktokapis.com/v2/post/publish/status/fetch/
    
    Response example:
    {
      "data": {
        "status": "PUBLISHED",
        "video_id": "7346834923102834823",
        "cover_url": "https://...",
        "share_url": "https://www.tiktok.com/@user/video/7346834923102834823"
      },
      "error": {
        "code": "ok",
        "message": ""
      }
    }
    
    Args:
        access_token: TikTok User Access Token
        publish_id: ID nhận được khi initialize upload (v_pub_file~v2-1.xxx)
    
    Returns:
        {
            "success": True/False,
            "status": "PROCESSING" | "PUBLISHED" | "FAILED",
            "video_id": "xxx",
            "cover_url": "...",
            "share_url": "..."
        }
    """
    
    url = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8"
    }
    
    payload = {
        "publish_id": publish_id
    }
    
    print(f"\n⏱️ Checking TikTok publish status...")
    print(f"   Publish ID: {publish_id}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            response_data = response.json()
            data = response_data.get("data", {})
            error = response_data.get("error", {})
            
            status = data.get("status")  # PROCESSING, PUBLISHED, FAILED
            video_id = data.get("video_id")
            cover_url = data.get("cover_url")
            share_url = data.get("share_url")
            
            # Check error
            error_code = error.get("code", "")
            if error_code != "ok" and error_code:
                error_msg = error.get("message", "Unknown error")
                print(f"   ❌ Error: [{error_code}] {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "error_code": error_code,
                    "message": f"TikTok API error: {error_msg}"
                }
            
            print(f"   📊 Status: {status}")
            if video_id:
                print(f"   🎬 Video ID: {video_id}")
            if share_url:
                print(f"   🔗 Share URL: {share_url}")
            
            result = {
                "success": True,
                "status": status,
                "publish_id": publish_id,
                "video_id": video_id,
                "cover_url": cover_url,
                "share_url": share_url
            }
            
            # Add fail_reason if failed
            if status == "FAILED":
                fail_reason = data.get("fail_reason", "Unknown reason")
                result["fail_reason"] = fail_reason
                print(f"   ❌ Fail reason: {fail_reason}")
            
            return result
        else:
            error_data = response.json() if response.text else {}
            return {
                "success": False,
                "error": error_data,
                "message": f"Failed to check TikTok publish status (HTTP {response.status_code})"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Exception during status check: {str(e)}"
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
