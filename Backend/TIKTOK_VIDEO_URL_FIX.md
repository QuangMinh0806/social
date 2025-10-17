# 🐛 TikTok Video Upload Bug Fix

## Vấn đề

Khi upload video từ máy tính lên TikTok, gặp lỗi vì:

1. **Router xử lý `video_url` trước `files`**: Nếu có `video_url` param (dù là null), code sẽ dùng URL thay vì đọc file bytes
2. **TikTok service cần bytes**: TikTok API yêu cầu video data dạng bytes, không hỗ trợ URL
3. **Type mismatch**: `media_files[0]` có thể là `str` (URL) nhưng TikTok expect `bytes`

## Giải pháp

### 1. Thêm check và download video từ URL

**File:** `services/post_service.py`

**Trong `_publish_to_tiktok()`:**

```python
# Get video data (bytes hoặc download từ URL)
video_data = media_files[0]

# Nếu là string URL, download video
if isinstance(video_data, str):
    print(f"📥 Downloading video from URL for TikTok: {video_data}")
    
    if 'localhost' in video_data or '127.0.0.1' in video_data:
        # Read from disk (faster)
        from services.image_utils import get_absolute_path_from_url, normalize_url
        video_data = normalize_url(video_data)
        file_path = get_absolute_path_from_url(video_data)
        with open(file_path, 'rb') as f:
            video_data = f.read()
    else:
        # Download from external URL
        response = requests.get(video_data, timeout=60)
        video_data = response.content
```

**Tương tự cho `_publish_to_youtube()`** vì YouTube cũng cần bytes.

### 2. Thêm import

```python
import os  # Thêm vào đầu file
```

## Test

### Test Case 1: Upload video từ máy tính

```
1. Mở Frontend
2. Create Post → Select TikTok
3. Upload video file (.mp4)
4. Post Now
5. ✅ Check logs: Phải thấy "TIKTOK VIDEO UPLOAD"
```

### Test Case 2: Upload video từ URL (thư viện media)

```
1. Create Post → Select TikTok
2. Chọn video từ thư viện (video_url)
3. Post Now
4. ✅ Check logs: Phải thấy "Downloading video from URL"
```

## Logs Expected

### Case 1: Upload file từ máy

```
📥 [Router] Received parameters:
  - files: [<video.mp4>]
  - video_url: None

🎬 TIKTOK VIDEO UPLOAD - SANDBOX MODE
============================================================
📊 Video size: 4.66 MB

📍 STEP 1: Initialize Upload
✅ Step 1 Complete - Publish ID: 123456789

📍 STEP 2: Upload Video Binary
✅ Step 2 Complete - Video uploaded
```

### Case 2: Video từ URL

```
📥 [Router] Received parameters:
  - files: []
  - video_url: http://localhost:8000/uploads/video/xyz.mp4

📥 Downloading video from URL for TikTok: http://localhost:8000/...
   ✅ Reading from disk: E:\...\Backend\uploads\video\xyz.mp4

🎬 TIKTOK VIDEO UPLOAD - SANDBOX MODE
============================================================
📊 Video size: 4.66 MB
...
```

## Error Handling

Nếu download video fail:

```python
await self.update(post.id, {
    "status": "failed",
    "error_message": f"Failed to download video: {str(e)}",
})
```

Post status sẽ là `failed` và error message rõ ràng.

## Files Changed

- ✅ `services/post_service.py`:
  - Added import `os`
  - Updated `_publish_to_tiktok()` với URL download logic
  - Updated `_publish_to_youtube()` với URL download logic

## Next Steps

1. **Test với video upload từ máy**
2. **Test với video từ thư viện** (nếu có)
3. **Verify TikTok access token** (nếu chưa có, upload sẽ fail ở step 1)

---

**Fixed Date:** October 17, 2025  
**Status:** ✅ Ready to test
