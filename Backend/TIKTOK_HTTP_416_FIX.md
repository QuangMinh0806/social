# 🐛 TikTok Upload Error: HTTP 416 - Fix

## Vấn đề gặp phải

### Lỗi 1: HTTP 416 "Range Not Satisfiable"
```
📍 STEP 2: Upload Video Binary
   Status: 416
   Response: null
   ❌ Upload failed: null
```

**Nguyên nhân:** TikTok upload endpoint yêu cầu **Content-Range** header để xác định chunk đang upload.

### Lỗi 2: 'str' object has no attribute 'get'
```
❌ Exception khi đăng post 122 lên TikTok: 'str' object has no attribute 'get'
```

**Nguyên nhân:** Code giả định `result["error"]` là dict, nhưng thực tế là string.

---

## Giải pháp

### Fix 1: Thêm Content-Range Header

**File:** `services/tiktok_service.py`

**Trong `_upload_video()`:**

```python
headers = {
    "Content-Type": "video/mp4",
    "Content-Length": str(video_size),
    "Content-Range": f"bytes 0-{video_size-1}/{video_size}"  # ✅ Required!
}
```

**Giải thích:**
- TikTok API yêu cầu Content-Range để biết đang upload chunk nào
- Format: `bytes <start>-<end>/<total>`
- Ví dụ: `bytes 0-4806059/4806060` (upload toàn bộ video trong 1 chunk)

### Fix 2: Xử lý error response đúng

**File:** `services/post_service.py`

**Trong `_publish_to_tiktok()`:**

```python
# Upload thất bại
error_data = result.get("error", "Unknown error")
if isinstance(error_data, dict):
    error_msg = error_data.get("message", str(error_data))
else:
    error_msg = str(error_data)  # ✅ Handle string error

# Include status code if available
status_code = result.get("status_code")
if status_code:
    error_msg = f"[{status_code}] {error_msg}"
```

**Giải thích:**
- Check type của `error_data` trước khi gọi `.get()`
- Nếu là string, convert thẳng
- Thêm HTTP status code vào error message để debug dễ

### Fix 3: Return status_code trong error response

**File:** `services/tiktok_service.py`

```python
return {
    "success": False,
    "error": response.text or f"HTTP {response.status_code}",
    "status_code": response.status_code,  # ✅ Include status code
    "message": f"Failed to upload video to TikTok (Status: {response.status_code})"
}
```

---

## Test lại

### Bước 1: Restart backend (nếu cần)
```bash
# Ctrl+C backend server
cd Backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Bước 2: Upload video lại
```
1. Frontend → Create Post
2. Select TikTok
3. Upload video
4. Post Now
```

### Bước 3: Check logs

**Expected logs (success):**

```
🎬 TIKTOK VIDEO UPLOAD - SANDBOX MODE
============================================================
📊 Video size: 4.58 MB

📍 STEP 1: Initialize Upload
   📥 Status: 200
✅ Step 1 Complete - Publish ID: v_inbox_file~v2.xxx

📍 STEP 2: Upload Video Binary
   Headers: {
       'Content-Type': 'video/mp4',
       'Content-Length': '4806060',
       'Content-Range': 'bytes 0-4806059/4806060'  ← NEW!
   }
   📥 Status: 200  ← Should be 200 now!
✅ Step 2 Complete - Video uploaded

============================================================
✅ TIKTOK UPLOAD COMPLETE!
============================================================
```

---

## Giải thích Content-Range

### Format
```
Content-Range: bytes <start>-<end>/<total>
```

### Ví dụ

**Upload toàn bộ (1 chunk):**
```
Video size: 4806060 bytes
Content-Range: bytes 0-4806059/4806060
```

**Upload nhiều chunks (example):**
```
Chunk 1: bytes 0-999999/4806060
Chunk 2: bytes 1000000-1999999/4806060
Chunk 3: bytes 2000000-4806059/4806060
```

### Tại sao cần?

TikTok API hỗ trợ:
- **Single chunk upload**: Upload toàn bộ trong 1 lần
- **Multi-chunk upload**: Chia nhỏ upload (cho video lớn)

Content-Range giúp server biết:
- Đang nhận chunk nào
- Còn bao nhiêu data
- Khi nào hoàn thành

---

## Troubleshooting

### Nếu vẫn lỗi 416

**Check:**
1. **Content-Length khớp với data?**
   ```python
   assert len(video_file) == int(headers["Content-Length"])
   ```

2. **Content-Range đúng format?**
   ```python
   # Đúng: bytes 0-4806059/4806060
   # Sai:  bytes 0-4806060/4806060  (end > size-1)
   ```

3. **Video size trong B1 khớp với B2?**
   ```python
   # B1 payload
   "video_size": 4806060
   
   # B2 upload
   len(video_file) == 4806060  # Must match!
   ```

### Nếu lỗi khác

**Check response:**
```python
print(f"Response headers: {response.headers}")
print(f"Response body: {response.text}")
print(f"Request headers: {response.request.headers}")
```

**Common errors:**
- **401**: Access token invalid/expired
- **400**: Bad request (check payload format)
- **413**: Video too large (max 4GB)
- **422**: Invalid video format (must be MP4)

---

## Files Changed

✅ `services/tiktok_service.py`:
- Added `Content-Range` header in `_upload_video()`
- Added `status_code` to error return

✅ `services/post_service.py`:
- Fixed error handling trong `_publish_to_tiktok()`
- Handle both dict and string errors
- Include status code in error message

---

## Next Steps

1. ✅ **Test upload lại** - Should work now với Content-Range header
2. ⏳ **Verify video status** - Check nếu status = PROCESSING
3. 📊 **Monitor logs** - Ensure no more 416 errors

---

**Fixed Date:** October 17, 2025  
**Status:** ✅ Ready to test  
**Key Change:** Added `Content-Range` header to TikTok upload
