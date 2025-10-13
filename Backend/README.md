# Social Media Auto Posting API

Hệ thống quản lý đăng bài tự động lên mạng xã hội với FastAPI và PostgreSQL.

## 🏗️ Kiến trúc

- **Framework**: Python FastAPI
- **ORM**: SQLAlchemy (async)
- **Database**: PostgreSQL
- **Cấu trúc**: Router → Controller → Service → Model

## 📁 Cấu trúc thư mục

```
Backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── config/
│   └── database.py        # Database configuration
├── models/
│   └── model.py           # SQLAlchemy models
├── core/
│   ├── config.py          # Application settings
│   ├── response.py        # Response helpers
│   └── exceptions.py      # Custom exceptions
├── routers/               # API endpoints
│   ├── user_router.py
│   ├── platform_router.py
│   ├── page_router.py
│   ├── page_permission_router.py
│   ├── template_router.py
│   └── watermark_router.py
├── controllers/           # Business logic controllers
│   ├── user_controller.py
│   ├── platform_controller.py
│   ├── page_controller.py
│   ├── page_permission_controller.py
│   ├── template_controller.py
│   └── watermark_controller.py
└── services/             # Database operations
    ├── user_service.py
    ├── platform_service.py
    ├── page_service.py
    ├── page_permission_service.py
    ├── template_service.py
    ├── watermark_service.py
    ├── media_service.py
    ├── hashtag_service.py
    ├── post_service.py
    └── post_analytics_service.py
```

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 2. Cấu hình Database

Tạo file `.env` trong thư mục Backend:

```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/social_media_db
DEBUG=True
```

### 3. Tạo database

```sql
CREATE DATABASE social_media_db;
```

### 4. Chạy migrations (tạo tables)

```python
# Trong Python shell hoặc tạo file init_db.py
import asyncio
from config.database import init_db

async def main():
    await init_db()

if __name__ == "__main__":
    asyncio.run(main())
```

## 🏃 Chạy ứng dụng

### Development mode

```bash
cd Backend
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

## 🔌 API Endpoints

### Users
- `GET /api/users/` - Get all users
- `GET /api/users/{user_id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email
- `POST /api/users/` - Create new user
- `PUT /api/users/{user_id}` - Update user
- `PATCH /api/users/{user_id}/last-login` - Update last login
- `DELETE /api/users/{user_id}` - Delete user

### Platforms
- `GET /api/platforms/` - Get all platforms
- `GET /api/platforms/active` - Get active platforms
- `GET /api/platforms/{platform_id}` - Get platform by ID
- `POST /api/platforms/` - Create new platform
- `PUT /api/platforms/{platform_id}` - Update platform
- `DELETE /api/platforms/{platform_id}` - Delete platform

### Pages
- `GET /api/pages/` - Get all pages
- `GET /api/pages/{page_id}` - Get page by ID
- `GET /api/pages/user/{user_id}` - Get pages by user
- `GET /api/pages/platform/{platform_id}` - Get pages by platform
- `POST /api/pages/` - Create new page
- `PUT /api/pages/{page_id}` - Update page
- `PATCH /api/pages/{page_id}/token` - Update page token
- `PATCH /api/pages/{page_id}/sync-followers` - Sync follower count
- `DELETE /api/pages/{page_id}` - Delete page

### Page Permissions
- `GET /api/page-permissions/` - Get all permissions
- `GET /api/page-permissions/{permission_id}` - Get permission by ID
- `GET /api/page-permissions/user/{user_id}` - Get user's pages
- `GET /api/page-permissions/check/{user_id}/{page_id}` - Check permission
- `POST /api/page-permissions/` - Create permission
- `PUT /api/page-permissions/{permission_id}` - Update permission
- `DELETE /api/page-permissions/{permission_id}` - Delete permission

### Templates
- `GET /api/templates/` - Get all templates
- `GET /api/templates/public` - Get public templates
- `GET /api/templates/category/{category}` - Get templates by category
- `GET /api/templates/{template_id}` - Get template by ID
- `POST /api/templates/` - Create template
- `PUT /api/templates/{template_id}` - Update template
- `PATCH /api/templates/{template_id}/increment-usage` - Increment usage
- `DELETE /api/templates/{template_id}` - Delete template

### Watermarks
- `GET /api/watermarks/` - Get all watermarks
- `GET /api/watermarks/default` - Get default watermark
- `GET /api/watermarks/{watermark_id}` - Get watermark by ID
- `POST /api/watermarks/` - Create watermark
- `PUT /api/watermarks/{watermark_id}` - Update watermark
- `DELETE /api/watermarks/{watermark_id}` - Delete watermark

## 📝 Response Format

Tất cả API responses đều theo chuẩn:

### Success Response
```json
{
    "success": true,
    "data": { ... },
    "message": "Success message",
    "error": null
}
```

### Error Response
```json
{
    "success": false,
    "data": null,
    "message": "Error message",
    "error": "Detailed error information"
}
```

## 🗄️ Database Models

### Module 1: Users & Platforms
- **users**: Quản lý người dùng
- **platforms**: Các nền tảng mạng xã hội

### Module 2: Pages Management
- **pages**: Quản lý các page/fanpage
- **page_permissions**: Phân quyền user trên page

### Module 3: Templates & Watermarks
- **templates**: Mẫu nội dung bài đăng
- **watermarks**: Watermark cho media

### Module 4: Posts Management
- **media_library**: Thư viện media files
- **hashtags**: Quản lý hashtags
- **posts**: Bài đăng chính
- **post_media**: Liên kết post với media
- **post_hashtags**: Liên kết post với hashtags
- **post_analytics**: Thống kê bài đăng

## 🛠️ Development

### Tạo service mới

```python
# services/example_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.model import YourModel

class ExampleService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self):
        query = select(YourModel)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    def _to_dict(self, model):
        # Convert model to dictionary
        pass
```

### Tạo controller mới

```python
# controllers/example_controller.py
from sqlalchemy.ext.asyncio import AsyncSession
from services.example_service import ExampleService
from core.response import success_response, error_response

class ExampleController:
    def __init__(self, db: AsyncSession):
        self.service = ExampleService(db)
    
    async def get_all(self):
        try:
            data = await self.service.get_all()
            return success_response(data=data)
        except Exception as e:
            return error_response(message="Error", error=str(e))
```

### Tạo router mới

```python
# routers/example_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.example_controller import ExampleController

router = APIRouter(prefix="/api/examples", tags=["Examples"])

@router.get("/")
async def get_all(db: AsyncSession = Depends(get_db)):
    controller = ExampleController(db)
    return await controller.get_all()
```

## 📦 TODO - Các module cần hoàn thiện

- [ ] Media Router, Controller (đã có Service)
- [ ] Hashtag Router, Controller (đã có Service)
- [ ] Post Router, Controller (đã có Service)
- [ ] Post Media Router, Controller, Service
- [ ] Post Hashtag Router, Controller, Service
- [ ] Post Analytics Router, Controller (đã có Service)
- [ ] Authentication & Authorization
- [ ] File upload handling
- [ ] Background tasks for scheduled posts
- [ ] Social media API integration

## 🔒 Security

- Implement JWT authentication
- Add rate limiting
- Validate input data
- Sanitize user inputs
- Use environment variables for sensitive data

## 📄 License

MIT License

## 👥 Contributors

Your Name - Initial work
```
