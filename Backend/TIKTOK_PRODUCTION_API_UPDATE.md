# 🚀 TikTok API Update: Sandbox → Production

## 📝 Tổng quan thay đổi

Đã cập nhật code từ **Sandbox API** sang **Production API** theo tài liệu chính thức của TikTok.

---

## 🔄 So sánh Sandbox vs Production

| Feature | Sandbox (Cũ) | Production (Mới) |
|---------|--------------|------------------|
| **Endpoint B1** | `/v2/post/publish/inbox/video/init/` | `/v2/post/publish/video/init/` |
| **Body B1** | `source_info` only | `post_info` + `source_info` |
| **post_info** | ❌ Không có | ✅ Required (title, privacy, etc.) |
| **Publish ID format** | `v_inbox_file~v2.xxx` | `v_pub_file~v2-1.xxx` |
| **Response error** | Simple | Structured với error.code |
| **Status response** | Basic | Detailed với cover_url, share_url |

---

## 📋 Chi tiết từng bước

### 🧩 Bước 1: Khởi tạo upload

**Endpoint:**
```
POST https://open.tiktokapis.com/v2/post/publish/video/init/
```

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json; charset=UTF-8
```

**Body (Mới):**
```json
{
  "post_info": {
    "title": "Video test upload từ máy 🎬",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_size": 30567100,
    "chunk_size": 30567100,
    "total_chunk_count": 1
  }
}
```

**Response:**
```json
{
  "data": {
    "publish_id": "v_pub_file~v2-1.123456789",
    "upload_url": "https://open-upload.tiktokapis.com/video/?upload_id=67890&upload_token=Xza123"
  },
  "error": {
    "code": "ok",
    "message": ""
  }
}
```

**Thay đổi:**
- ✅ Thêm `post_info` với title, privacy_level, disable_duet, disable_comment, disable_stitch
- ✅ Title bắt buộc (max 150 chars)
- ✅ Response có error.code để check ("ok" = success)

---

### 📤 Bước 2: Upload video binary

**Endpoint:**
```
PUT {upload_url}
```

**Headers:**
```
Content-Type: video/mp4
Content-Range: bytes 0-30567099/30567100
```

**Body:**
Binary video data

**Không thay đổi** - Vẫn giữ nguyên như cũ.

---

### ⏱️ Bước 3: Check status

**Endpoint:**
```
POST https://open.tiktokapis.com/v2/post/publish/status/fetch/
```

**Body:**
```json
{
  "publish_id": "v_pub_file~v2-1.123456789"
}
```

**Response (Mới - Chi tiết hơn):**
```json
{
  "data": {
    "status": "PUBLISHED",
    "video_id": "7346834923102834823",
    "cover_url": "https://p16-sign-va.tiktokcdn.com/obj/tos...jpg",
    "share_url": "https://www.tiktok.com/@youruser/video/7346834923102834823"
  },
  "error": {
    "code": "ok",
    "message": ""
  }
}
```

**Thay đổi:**
- ✅ Thêm `cover_url` - URL ảnh cover
- ✅ Thêm `share_url` - Link để share video
- ✅ Response có error.code để check

---

## 💻 Code Changes

### File: `services/tiktok_service.py`

#### 1. Updated `post_to_tiktok()`

**Trước:**
```python
print(f"🎬 TIKTOK VIDEO UPLOAD - SANDBOX MODE")
init_response = await _initialize_video_upload_sandbox(
    access_token=access_token,
    video_size=len(video_file)
)
```

**Sau:**
```python
print(f"🎬 TIKTOK VIDEO UPLOAD - PRODUCTION API")
init_response = await _initialize_video_upload(
    access_token=access_token,
    video_size=len(video_file),
    title=title,  # ✅ Now used
    privacy_level=privacy_level,
    disable_comment=disable_comment,
    disable_duet=disable_duet,
    disable_stitch=disable_stitch
)
```

#### 2. Renamed function

**Trước:**
```python
async def _initialize_video_upload_sandbox(
    access_token: str,
    video_size: int
)
```

**Sau:**
```python
async def _initialize_video_upload(
    access_token: str,
    video_size: int,
    title: str,
    privacy_level: str,
    disable_comment: bool,
    disable_duet: bool,
    disable_stitch: bool
)
```

#### 3. Updated endpoint

**Trước:**
```python
url = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"
```

**Sau:**
```python
url = "https://open.tiktokapis.com/v2/post/publish/video/init/"
```

#### 4. Updated payload

**Trước:**
```python
payload = {
    "source_info": {
        "source": "FILE_UPLOAD",
        "video_size": video_size,
        "chunk_size": video_size,
        "total_chunk_count": 1
    }
}
```

**Sau:**
```python
payload = {
    "post_info": {
        "title": title[:150],
        "privacy_level": privacy_level,
        "disable_duet": disable_duet,
        "disable_comment": disable_comment,
        "disable_stitch": disable_stitch
    },
    "source_info": {
        "source": "FILE_UPLOAD",
        "video_size": video_size,
        "chunk_size": video_size,
        "total_chunk_count": 1
    }
}
```

#### 5. Enhanced error handling

**Mới:**
```python
# Check error code in response
error_code = error.get("code", "")
if error_code != "ok" and error_code:
    error_msg = error.get("message", "Unknown error")
    return {
        "success": False,
        "error": error_msg,
        "error_code": error_code
    }
```

#### 6. Updated `check_publish_status()`

**Thêm fields mới:**
```python
return {
    "success": True,
    "status": status,
    "publish_id": publish_id,
    "video_id": video_id,
    "cover_url": cover_url,  # ✅ New
    "share_url": share_url   # ✅ New
}
```

---

## 📊 Logs mới

### Upload flow:

```
============================================================
🎬 TIKTOK VIDEO UPLOAD - PRODUCTION API
============================================================
📊 Video size: 4.58 MB
📝 Title: Video test upload từ máy 🎬
🔒 Privacy: PUBLIC_TO_EVERYONE

📍 STEP 1: Initialize Upload (with post_info)
   📤 POST https://open.tiktokapis.com/v2/post/publish/video/init/
   📦 Payload:
      post_info: {'title': '...', 'privacy_level': '...', ...}
      source_info: {'source': 'FILE_UPLOAD', ...}
   📥 Status: 200
   ✅ Upload URL: https://open-upload.tiktokapis.com/video/...
   ✅ Publish ID: v_pub_file~v2-1.123456789

📍 STEP 2: Upload Video Binary
   Video size: 4806060 bytes (4.58 MB)
   Headers: {
       'Content-Type': 'video/mp4',
       'Content-Range': 'bytes 0-4806059/4806060'
   }
   Status: 201
   ✅ Video uploaded successfully!

============================================================
✅ TIKTOK UPLOAD COMPLETE!
   Publish ID: v_pub_file~v2-1.123456789
============================================================
```

### Status check:

```
⏱️ Checking TikTok publish status...
   Publish ID: v_pub_file~v2-1.123456789
   📊 Status: PUBLISHED
   🎬 Video ID: 7346834923102834823
   🔗 Share URL: https://www.tiktok.com/@user/video/7346834923102834823
```

---

## ✅ Testing

### Test upload:

```bash
# 1. Upload video
POST /api/posts/
- Select TikTok platform
- Upload video file
- Post Now

# 2. Check logs
# Should see "PRODUCTION API" instead of "SANDBOX MODE"
# Should see post_info in payload

# 3. Check database
# Post status: "processing"
# platform_post_id: "v_pub_file~v2-1.xxx" (new format)

# 4. Check status sau 2-3 phút
# Call check_publish_status()
# Should see "PUBLISHED" with video_id và share_url
```

---

## 🔐 Privacy Levels

Production API hỗ trợ 3 mức privacy:

| Value | Description |
|-------|-------------|
| `PUBLIC_TO_EVERYONE` | Công khai cho mọi người |
| `MUTUAL_FOLLOW_FRIENDS` | Chỉ bạn bè (mutual follow) |
| `SELF_ONLY` | Chỉ mình tôi |

---

## ⚠️ Breaking Changes

### 1. Title bắt buộc

**Trước (Sandbox):** Title optional, không dùng trong init

**Sau (Production):** Title required, phải có trong post_info

**Fix:** Đảm bảo luôn pass `title` vào `post_to_tiktok()`

### 2. Publish ID format khác

**Trước:** `v_inbox_file~v2.xxx`

**Sau:** `v_pub_file~v2-1.xxx`

**Impact:** Nếu có code check format publish_id, cần update regex

### 3. Error response structure

**Trước:** Direct error message

**Sau:** Structured với `error.code` và `error.message`

**Fix:** Check `error.code != "ok"` để detect lỗi

---

## 📌 Notes

1. **Backward compatibility:** Code cũ (sandbox) sẽ không hoạt động với production endpoint
2. **Token:** Cần production access token (không phải sandbox token)
3. **App approval:** Production app cần được TikTok approve trước
4. **Testing:** Test kỹ trước khi deploy vì video sẽ publish thật lên TikTok

---

## 🎯 Next Steps

1. ✅ **Test upload** với production access token
2. ⏳ **Verify video** xuất hiện trên TikTok profile
3. 📊 **Monitor logs** để đảm bảo không có lỗi
4. 🔄 **Implement background job** để auto-check status và update database

---

**Updated Date:** October 17, 2025  
**API Version:** Production (v2)  
**Status:** ✅ Ready for production testing
