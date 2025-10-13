# 🚀 Hướng dẫn Setup Backend

## 📋 Yêu cầu hệ thống

- Python 3.8+
- PostgreSQL 12+
- pip hoặc conda

## 🔧 Cài đặt

### 1. Clone repository và di chuyển vào thư mục Backend

```bash
cd Backend
```

### 2. Tạo môi trường ảo Python (khuyến nghị)

```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Cài đặt các dependencies

```bash
pip install -r requirements.txt
```

### 4. Cấu hình Database

Tạo database PostgreSQL:

```sql
CREATE DATABASE social_v1;
```

Cập nhật connection string trong `config/database.py` hoặc set biến môi trường:

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql+asyncpg://postgres:your_password@localhost:5432/social_v1"

# Linux/Mac
export DATABASE_URL="postgresql+asyncpg://postgres:your_password@localhost:5432/social_v1"
```

### 5. Khởi tạo Database (Tạo bảng)

**Cách 1: Chạy script init_db.py (Khuyến nghị)**

```bash
python init_db.py
```

Script này sẽ:
- Tự động tạo tất cả các bảng từ models
- Hiển thị danh sách các bảng đã tạo
- Báo lỗi nếu có vấn đề

**Cách 2: Tự động tạo khi chạy server**

Khi bạn chạy `python main.py`, các bảng sẽ tự động được tạo nếu chưa tồn tại.

### 6. Seed dữ liệu mẫu (Optional)

```bash
# Tạo user test
python create_test_user.py

# Seed employees
python seed_employees.py
```

## 🎯 Chạy ứng dụng

### Development mode (with auto-reload)

```bash
python main.py
```

Hoặc sử dụng uvicorn trực tiếp:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 API Documentation

Sau khi chạy server, truy cập:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🗄️ Database Schema

Các bảng được tạo tự động:

1. **users** - Quản lý người dùng
2. **platforms** - Các nền tảng mạng xã hội (Facebook, Instagram, etc.)
3. **pages** - Các trang/page đã kết nối
4. **page_permissions** - Phân quyền người dùng cho từng page
5. **templates** - Mẫu nội dung (caption, hashtag, watermark, frame)
6. **watermarks** - Quản lý watermark
7. **media_library** - Thư viện media (ảnh, video)
8. **hashtags** - Quản lý hashtag
9. **posts** - Bài đăng
10. **post_media** - Media của bài đăng
11. **post_hashtags** - Hashtag của bài đăng
12. **post_analytics** - Thống kê bài đăng

## 🧪 Testing

```bash
# Test tạo user
python create_test_user.py

# Test employee API
python test_employee_api.py

# Test media upload
python test_media_upload.py

# Test template API
python test_template_api.py
```

## ⚠️ Troubleshooting

### Lỗi không kết nối được database

1. Kiểm tra PostgreSQL đã chạy chưa
2. Xác nhận connection string đúng
3. Kiểm tra firewall/port 5432

### Lỗi "Table already exists"

Nếu bạn muốn xóa và tạo lại tất cả bảng:

```python
# Thêm vào init_db.py trước create_all
await conn.run_sync(Base.metadata.drop_all)  # Xóa tất cả bảng
await conn.run_sync(Base.metadata.create_all)  # Tạo lại
```

### Lỗi import module

Đảm bảo bạn đang ở trong virtual environment và đã cài đặt requirements.txt

## 📝 Lưu ý

- **Tự động tạo bảng**: Khi pull code về máy mới, chỉ cần cài đặt dependencies và chạy `python init_db.py` hoặc `python main.py` - các bảng sẽ tự động được tạo
- **Migration**: Nếu có thay đổi schema, cần chạy lại init_db.py hoặc sử dụng Alembic để migration
- **Environment Variables**: Nên sử dụng file `.env` để quản lý biến môi trường trong production

## 🔐 Security

Trong production:
- Đổi secret key trong `core/config.py`
- Sử dụng HTTPS
- Set `echo=False` trong database.py
- Giới hạn CORS origins
- Sử dụng environment variables cho sensitive data

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Logs khi chạy server
2. Database connection
3. Python version compatibility
