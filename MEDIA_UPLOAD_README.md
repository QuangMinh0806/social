# Media Upload Implementation

## Cài đặt Dependencies

Để sử dụng chức năng upload media, bạn cần cài đặt các package sau:

```bash
cd Backend
pip install python-multipart Pillow
```

Hoặc cài đặt toàn bộ dependencies từ requirements.txt:

```bash
pip install -r requirements.txt
```

## Cấu trúc Upload

### Backend (FastAPI)

1. **Endpoint Upload Single File**: `POST /api/media/upload`
   - Upload 1 file (ảnh hoặc video)
   - Tự động xác định loại file
   - Tự động lấy dimensions cho ảnh
   - Validate file size (max 50MB)
   - Lưu file vào thư mục `uploads/{file_type}/`

2. **Endpoint Upload Multiple Files**: `POST /api/media/upload/multiple`
   - Upload nhiều file cùng lúc
   - Xử lý từng file độc lập
   - Trả về kết quả và lỗi cho từng file

### Frontend (React)

1. **UploadModal Component**
   - Drag & Drop files
   - Preview ảnh trước khi upload
   - Progress bar cho mỗi file
   - Validation client-side
   - Upload từng file tuần tự
   - Hiển thị trạng thái success/error

## Supported File Types

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Videos
- MP4 (.mp4)
- MPEG (.mpeg, .mpg)
- QuickTime (.mov)
- AVI (.avi)

## File Size Limit
- Maximum: 50MB per file

## Thư mục Upload

Files được lưu trong cấu trúc:
```
Backend/
  uploads/
    image/
      {uuid}.jpg
      {uuid}.png
    video/
      {uuid}.mp4
      {uuid}.mov
```

## API Endpoints

### Upload Single File
```http
POST /api/media/upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- user_id: Integer (required)
- tags: String (optional)
```

### Upload Multiple Files
```http
POST /api/media/upload/multiple
Content-Type: multipart/form-data

Body:
- files: Array<File> (required)
- user_id: Integer (required)
- tags: String (optional)
```

### Access Uploaded Files
```http
GET /uploads/{file_type}/{filename}
```

## Features

✅ Drag & Drop support
✅ Multiple file upload
✅ File type validation
✅ File size validation
✅ Image dimensions detection
✅ Thumbnail generation for images
✅ Progress tracking
✅ Error handling per file
✅ Preview before upload
✅ Remove files before upload

## Usage Example

```javascript
// Frontend - Upload single file
const formData = new FormData();
formData.append('file', file);
formData.append('user_id', '1');
formData.append('tags', 'product, summer');

await mediaService.upload(formData);
```

## Database Schema

Media được lưu với các thông tin:
- `file_name`: Tên file gốc
- `file_type`: image/video/gif
- `file_url`: URL để truy cập file
- `file_size`: Kích thước file (bytes)
- `thumbnail_url`: URL thumbnail (cho ảnh)
- `width`, `height`: Kích thước ảnh
- `mime_type`: MIME type của file
- `storage_path`: Đường dẫn lưu trữ server
- `is_processed`: Trạng thái xử lý
- `tags`: Tags cho file

## Testing

1. Start Backend:
```bash
cd Backend
python main.py
```

2. Start Frontend:
```bash
cd Frontend
npm run dev
```

3. Navigate to Media Library page
4. Click "Upload Media" button
5. Drag & drop or select files
6. Click "Upload" button

## Notes

- File URLs được serve thông qua FastAPI StaticFiles
- Thumbnails được tạo tự động cho images
- Video duration detection có thể được thêm với thư viện `moviepy`
- Hiện tại user_id được hard-code, cần integrate với authentication system
