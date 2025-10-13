# 🚀 Quick Start - Hướng dẫn nhanh

## Cho người mới pull code về máy

### Windows (PowerShell)

```powershell
# 1. Cài dependencies
pip install -r requirements.txt

# 2. Tạo database (PostgreSQL phải đã chạy)
python init_db.py

# 3. Chạy server
python main.py
```

### Linux/Mac (Terminal)

```bash
# 1. Cài dependencies
pip3 install -r requirements.txt

# 2. Tạo database (PostgreSQL phải đã chạy)
python3 init_db.py

# 3. Chạy server
python3 main.py
```

## ✨ Hoặc sử dụng script tự động

### Windows
```powershell
.\setup_database.ps1
```

### Linux/Mac
```bash
chmod +x setup_database.sh
./setup_database.sh
```

## 📝 Lưu ý quan trọng

1. **PostgreSQL phải đã cài và chạy**
   - Windows: Services → PostgreSQL
   - Linux: `sudo systemctl start postgresql`
   - Mac: `brew services start postgresql`

2. **Cập nhật connection string** trong `config/database.py`:
   ```python
   DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/social_v1"
   ```

3. **Tự động tạo bảng**: 
   - Chạy `python init_db.py` - Tạo bảng thủ công
   - Hoặc chạy `python main.py` - Tự động tạo khi start server

## 🎯 Truy cập API

Sau khi chạy server:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📚 Tài liệu đầy đủ

Xem file `SETUP.md` để biết chi tiết về:
- Cấu hình môi trường
- Migration database
- Testing
- Troubleshooting
- Security best practices
