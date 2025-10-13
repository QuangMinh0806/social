# Hướng Dẫn Upload Media

## Cấu Hình Backend

### 1. Các thay đổi đã thực hiện:

#### Media Router (`Backend/routers/media_router.py`)
- ✅ Thêm endpoint `/api/media/upload` - Upload single file
- ✅ Thêm endpoint `/api/media/upload/multiple` - Upload multiple files
- ✅ Hỗ trợ upload ảnh: JPEG, PNG, GIF, WebP
- ✅ Hỗ trợ upload video: MP4, MPEG, MOV, AVI
- ✅ Giới hạn kích thước file: 50MB
- ✅ Tự động tạo thumbnail cho ảnh
- ✅ Lấy dimensions (width × height) cho ảnh
- ✅ Fixed user_id = 13 (tạm thời)
- ✅ Xử lý tags đúng cách (NULL thay vì string 'null')
- ✅ Convert file_type sang MediaType enum

#### Main.py (`Backend/main.py`)
- ✅ Mount static files để serve uploads từ `/uploads`
- ✅ Cấu hình CORS cho phép upload

### 2. Cài đặt Dependencies

Thêm Pillow vào `requirements.txt`:
```bash
cd Backend
pip install Pillow
```

### 3. Khởi động Backend

```bash
cd Backend
python main.py
```

Backend sẽ chạy tại: `http://localhost:8000`

## Cấu Hình Frontend

### 1. Component UploadModal

File: `Frontend/src/components/media/UploadModal.jsx`
- ✅ UI drag & drop
- ✅ Preview file trước khi upload
- ✅ Progress bar hiển thị tiến trình upload
- ✅ Hỗ trợ multiple files
- ✅ Validation file type và size
- ✅ Tags input

### 2. Media Service

File: `Frontend/src/services/media.service.js`
- ✅ Method `upload(file, userId, tags)` - Single upload
- ✅ Method `uploadMultiple(files, userId, tags)` - Bulk upload

### 3. Media Library Page

File: `Frontend/src/pages/media/MediaLibraryPage.jsx`
- ✅ Nút "Upload Media" mở modal upload
- ✅ Tự động refresh danh sách sau khi upload
- ✅ Grid/List view
- ✅ Filter by type
- ✅ Search functionality

## Cách Sử Dụng

### Upload Single File

1. Click nút **"Upload Media"** trong Media Library
2. Kéo thả file hoặc click để chọn file
3. Thêm tags (optional)
4. Click **"Upload"**
5. Chờ progress bar hoàn thành
6. File sẽ tự động xuất hiện trong danh sách

### Upload Multiple Files

1. Click nút **"Upload Media"**
2. Chọn multiple files (Ctrl/Cmd + Click)
3. Tất cả files sẽ hiển thị preview
4. Thêm tags cho tất cả files (optional)
5. Click **"Upload All"**
6. Theo dõi progress của từng file
7. Tất cả files sẽ được upload song song

## File Types Hỗ Trợ

### Hình Ảnh
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ GIF (.gif)
- ✅ WebP (.webp)

### Video
- ✅ MP4 (.mp4)
- ✅ MPEG (.mpeg, .mpg)
- ✅ MOV (.mov)
- ✅ AVI (.avi)

### Giới Hạn
- **Kích thước tối đa**: 50MB per file
- **Số lượng**: Không giới hạn (upload multiple)

## Cấu Trúc Thư Mục Upload

```
Backend/
  uploads/
    image/          # Ảnh được lưu ở đây
      uuid-1.jpg
      uuid-2.png
    video/          # Video được lưu ở đây
      uuid-3.mp4
      uuid-4.mov
    gif/            # GIF được lưu ở đây
      uuid-5.gif
```

## API Endpoints

### Upload Single File
```http
POST /api/media/upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- user_id: Integer (default: 13)
- tags: String (optional)

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "file_name": "example.jpg",
    "file_type": "image",
    "file_url": "/uploads/image/uuid.jpg",
    "file_size": 123456,
    "width": 1920,
    "height": 1080,
    ...
  },
  "message": "Media created successfully"
}
```

### Upload Multiple Files
```http
POST /api/media/upload/multiple
Content-Type: multipart/form-data

Body:
- files: File[] (required)
- user_id: Integer (default: 13)
- tags: String (optional)

Response:
{
  "success": true,
  "uploaded": 5,
  "failed": 0,
  "data": [...],
  "errors": []
}
```

## Troubleshooting

### Lỗi: "File type not allowed"
- Kiểm tra file extension
- Đảm bảo file thuộc danh sách hỗ trợ

### Lỗi: "File size exceeds maximum"
- Giảm kích thước file xuống dưới 50MB
- Hoặc tăng `MAX_FILE_SIZE` trong `media_router.py`

### Lỗi: "Could not save file"
- Kiểm tra quyền write trong thư mục `Backend/uploads/`
- Tạo thư mục manually: `mkdir -p Backend/uploads/{image,video,gif}`

### Upload không thành công
- Kiểm tra Backend đang chạy tại `http://localhost:8000`
- Kiểm tra CORS configuration trong `main.py`
- Xem console log trong browser để biết chi tiết lỗi

### File không hiển thị sau upload
- Clear browser cache
- Refresh trang Media Library
- Kiểm tra file đã được lưu trong database: `SELECT * FROM media_library;`

## Tính Năng Nâng Cao (Tương Lai)

- [ ] Video thumbnail generation (sử dụng ffmpeg)
- [ ] Image compression/optimization
- [ ] Cloud storage integration (S3, Cloudinary)
- [ ] Batch processing
- [ ] Upload progress với WebSocket
- [ ] Resume upload khi bị disconnect
- [ ] Virus scanning
- [ ] Watermark automatic

## Testing

### Test Upload với cURL

```bash
# Single file
curl -X POST http://localhost:8000/api/media/upload \
  -F "file=@/path/to/image.jpg" \
  -F "user_id=13" \
  -F "tags=test,upload"

# Multiple files
curl -X POST http://localhost:8000/api/media/upload/multiple \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg" \
  -F "user_id=13"
```

### Test với Postman

1. Method: POST
2. URL: `http://localhost:8000/api/media/upload`
3. Body > form-data:
   - Key: `file`, Type: File, Value: [Select file]
   - Key: `user_id`, Type: Text, Value: `13`
   - Key: `tags`, Type: Text, Value: `test,demo`

## Notes

- User ID hiện tại được fix cứng = 13 cho development
- Trong production, user_id sẽ được lấy từ JWT token authentication
- Tags được lưu dạng JSON trong database
- Thumbnail cho video sẽ được implement sau (cần ffmpeg)
