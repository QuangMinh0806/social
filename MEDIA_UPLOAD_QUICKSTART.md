# 🚀 Quick Start - Media Upload Feature

## Khởi chạy nhanh trong 3 bước

### Bước 1: Khởi động Backend

```bash
# Di chuyển vào thư mục Backend
cd Backend

# Cài đặt dependencies (nếu chưa có)
pip install Pillow

# Khởi động server
python main.py
```

✅ Backend sẽ chạy tại: **http://localhost:8000**

### Bước 2: Khởi động Frontend

```bash
# Mở terminal mới, di chuyển vào thư mục Frontend
cd Frontend

# Cài đặt dependencies (nếu chưa có)
npm install

# Khởi động dev server
npm run dev
```

✅ Frontend sẽ chạy tại: **http://localhost:5173**

### Bước 3: Test Upload

#### Option 1: Sử dụng Web Interface
1. Mở browser: `http://localhost:5173`
2. Vào trang **Media Library**
3. Click nút **"Upload Media"**
4. Chọn file ảnh hoặc video
5. Click **"Upload"**

#### Option 2: Test với Script Python
```bash
# Trong thư mục Backend
python test_media_upload.py
```

#### Option 3: Test với cURL
```bash
# Upload single file
curl -X POST http://localhost:8000/api/media/upload \
  -F "file=@path/to/your/image.jpg" \
  -F "user_id=13"

# Check uploaded files
curl http://localhost:8000/api/media/
```

## 📁 File Types Supported

### ✅ Images
- JPEG, PNG, GIF, WebP
- Max size: 50MB
- Auto-generate thumbnails
- Auto-detect dimensions

### ✅ Videos
- MP4, MPEG, MOV, AVI
- Max size: 50MB

## 🔍 Kiểm tra kết quả

### 1. Trong Web Interface
- Vào **Media Library** page
- Xem file vừa upload trong grid/list view
- Click để preview
- Download hoặc delete

### 2. Trong File System
```bash
# Check uploaded files
ls Backend/uploads/image/
ls Backend/uploads/video/
```

### 3. Trong Database
```sql
SELECT * FROM media_library ORDER BY created_at DESC LIMIT 10;
```

## ⚠️ Troubleshooting

### Backend không khởi động được?
```bash
# Kiểm tra port 8000 có đang được sử dụng không
netstat -ano | findstr :8000   # Windows
lsof -i :8000                   # Mac/Linux

# Nếu port bận, kill process hoặc đổi port trong main.py
```

### Frontend không kết nối được Backend?
```bash
# Kiểm tra API URL trong Frontend/src/config/api.config.js
# Đảm bảo baseURL = 'http://localhost:8000'
```

### Upload bị lỗi?
1. Kiểm tra file size < 50MB
2. Kiểm tra file type có được hỗ trợ
3. Xem console log trong browser
4. Xem log trong terminal backend

### File không hiển thị?
1. Refresh trang
2. Clear browser cache
3. Kiểm tra file đã được lưu trong `Backend/uploads/`

## 📚 Tài liệu chi tiết

- **Full Guide**: [MEDIA_UPLOAD_GUIDE.md](./MEDIA_UPLOAD_GUIDE.md)
- **API Docs**: http://localhost:8000/docs (khi backend đang chạy)
- **Component Docs**: `Frontend/src/components/media/UploadModal.jsx`

## 🎯 Tính năng chính

- ✅ Drag & Drop upload
- ✅ Multiple files upload
- ✅ Upload progress tracking
- ✅ File preview before upload
- ✅ Grid/List view toggle
- ✅ Filter by type
- ✅ Search functionality
- ✅ Download files
- ✅ Delete files
- ✅ Auto-generate thumbnails for images
- ✅ Tags support

## 💡 Tips

- **Ctrl/Cmd + Click** để chọn multiple files
- **Drag & Drop** vào upload area để upload nhanh
- **Click vào statistics cards** để filter theo type
- **Grid/List toggle** để chuyển đổi view mode

## 🔐 Security Notes

- User ID hiện tại được fix = 13 (development only)
- Trong production sẽ dùng JWT authentication
- File validation ở cả frontend và backend
- Max file size limit: 50MB

---

**Happy Uploading! 🎉**
