# Quản lý Nhân viên - Hướng dẫn Sử dụng

## Mô tả
Module quản lý nhân viên cho phép quản trị viên quản lý thông tin nhân viên trong hệ thống, bao gồm:
- Xem danh sách nhân viên với thống kê tổng quan
- Thêm nhân viên mới
- Chỉnh sửa thông tin nhân viên
- Xem chi tiết nhân viên
- Xóa nhân viên
- Tìm kiếm và lọc nhân viên theo vai trò và trạng thái

## Cấu trúc Files

### Frontend
```
Frontend/src/pages/employees/
├── EmployeeListPage.jsx     # Trang danh sách nhân viên chính
├── EmployeeModal.jsx         # Modal thêm/sửa nhân viên
└── EmployeeDetailModal.jsx   # Modal xem chi tiết nhân viên
```

### Backend
```
Backend/
├── models/model.py                    # Model User
├── services/user_service.py           # Service layer
├── controllers/user_controller.py     # Controller layer
└── routers/user_router.py             # API endpoints
```

## API Endpoints

### 1. Lấy danh sách nhân viên (GET)
```
GET /api/users?skip=0&limit=100&search=&role=&status=
```

**Query Parameters:**
- `skip` (int): Số bản ghi bỏ qua (mặc định: 0)
- `limit` (int): Số bản ghi tối đa (mặc định: 100, max: 1000)
- `search` (string): Tìm kiếm theo username, email hoặc full_name
- `role` (string): Lọc theo vai trò
- `status` (string): Lọc theo trạng thái (active, inactive, suspended)

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 8 users successfully",
  "data": [
    {
      "id": 1,
      "username": "superadmin",
      "email": "superadmin@techcorp.com",
      "full_name": "Super Admin",
      "avatar_url": null,
      "role": "Super Admin",
      "status": "active",
      "last_login": "2024-01-07T07:00:00",
      "created_at": "2024-01-01T07:00:00",
      "updated_at": "2024-01-01T07:00:00"
    }
  ]
}
```

### 2. Lấy thông tin nhân viên theo ID (GET)
```
GET /api/users/{user_id}
```

### 3. Thêm nhân viên mới (POST)
```
POST /api/users
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password_hash": "hashed_password_here",
  "full_name": "New User Name",
  "avatar_url": "https://example.com/avatar.jpg",
  "role": "editor",
  "status": "active"
}
```

**Required Fields:**
- username (string, max 50 characters, unique)
- email (string, max 100 characters, unique)
- password_hash (string, max 255 characters)

**Optional Fields:**
- full_name (string, max 100 characters)
- avatar_url (string, max 255 characters)
- role (string, default: 'editor')
- status (enum: active/inactive/suspended, default: 'active')

### 4. Cập nhật thông tin nhân viên (PUT)
```
PUT /api/users/{user_id}
```

**Request Body:** (Chỉ gửi các field cần cập nhật)
```json
{
  "full_name": "Updated Name",
  "role": "Admin",
  "status": "active"
}
```

### 5. Xóa nhân viên (DELETE)
```
DELETE /api/users/{user_id}
```

## Chức năng Frontend

### 1. Thống kê Dashboard
- **Tổng nhân viên**: Hiển thị tổng số nhân viên trong hệ thống
- **Đang hoạt động**: Số lượng nhân viên có trạng thái "active"
- **Mới trong tháng**: Số nhân viên được tạo trong tháng hiện tại

### 2. Tìm kiếm
- Tìm kiếm theo username, email hoặc họ tên
- Real-time search khi gõ vào ô tìm kiếm

### 3. Lọc dữ liệu
**Lọc theo vai trò:**
- Super Admin
- Admin
- Content Editor
- Social Media Specialist
- Video Producer
- Editor

**Lọc theo trạng thái:**
- Hoạt động (active)
- Ngưng hoạt động (inactive)
- Tạm khóa (suspended)

### 4. Thêm nhân viên mới
1. Click nút "Thêm nhân viên"
2. Điền thông tin vào form:
   - Tên đăng nhập (bắt buộc, tối thiểu 3 ký tự)
   - Email (bắt buộc, định dạng email hợp lệ)
   - Mật khẩu (bắt buộc, tối thiểu 6 ký tự)
   - Họ và tên (bắt buộc)
   - Vai trò (bắt buộc, mặc định: Editor)
   - Trạng thái (bắt buộc, mặc định: Hoạt động)
   - URL Avatar (tùy chọn)
3. Click "Thêm mới"

### 5. Chỉnh sửa nhân viên
1. Click icon chỉnh sửa (✏️) ở cột thao tác
2. Cập nhật thông tin trong form
3. **Lưu ý**: Username không thể thay đổi khi chỉnh sửa
4. Mật khẩu: Để trống nếu không muốn đổi
5. Click "Cập nhật"

### 6. Xem chi tiết nhân viên
1. Click icon xem (👁️) ở cột thao tác
2. Xem đầy đủ thông tin:
   - Thông tin cơ bản
   - Vai trò và quyền hạn
   - Thời gian tạo và cập nhật
   - Thời gian đăng nhập lần cuối
   - Mã nhân viên (ID hệ thống)

### 7. Xóa nhân viên
1. Click icon xóa (🗑️) ở cột thao tác
2. Xác nhận xóa trong popup
3. Nhân viên sẽ bị xóa khỏi hệ thống

## Roles (Vai trò)

### Super Admin
- Quyền cao nhất trong hệ thống
- Có thể quản lý tất cả

### Admin
- Quản lý hệ thống
- Quản lý nhân viên và nội dung

### Content Editor
- Chỉnh sửa và tạo nội dung
- Quản lý bài viết và template

### Social Media Specialist
- Chuyên gia mạng xã hội
- Quản lý pages và posts

### Video Producer
- Sản xuất video
- Quản lý media video

### Editor
- Vai trò mặc định
- Quyền cơ bản

## Status (Trạng thái)

### Active (Hoạt động)
- Nhân viên đang hoạt động bình thường
- Có thể đăng nhập và sử dụng hệ thống

### Inactive (Ngưng hoạt động)
- Nhân viên tạm thời không hoạt động
- Không thể đăng nhập

### Suspended (Tạm khóa)
- Tài khoản bị khóa
- Không thể đăng nhập và thao tác

## Validation Rules

### Frontend Validation:
1. **Username**:
   - Bắt buộc
   - Tối thiểu 3 ký tự
   - Không thể thay đổi khi chỉnh sửa

2. **Email**:
   - Bắt buộc
   - Định dạng email hợp lệ

3. **Password**:
   - Bắt buộc khi tạo mới
   - Tối thiểu 6 ký tự
   - Không bắt buộc khi chỉnh sửa (để trống = không đổi)

4. **Full Name**:
   - Bắt buộc

### Backend Validation:
1. Username và Email phải unique (duy nhất)
2. Kiểm tra conflict khi tạo mới hoặc cập nhật
3. Validate format và length theo model

## Xử lý lỗi

### Frontend:
- Hiển thị toast notification cho các thao tác
- Success: Toast màu xanh
- Error: Toast màu đỏ
- Validation errors hiển thị ngay dưới field

### Backend:
- 400 Bad Request: Dữ liệu không hợp lệ
- 404 Not Found: Không tìm thấy nhân viên
- 409 Conflict: Username/Email đã tồn tại
- 500 Server Error: Lỗi server

## Testing

### Test thêm nhân viên mới:
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password_hash": "hashed_password",
    "full_name": "Test User",
    "role": "editor",
    "status": "active"
  }'
```

### Test tìm kiếm:
```bash
curl "http://localhost:8000/api/users?search=admin"
```

### Test lọc:
```bash
curl "http://localhost:8000/api/users?role=Admin&status=active"
```

## Responsive Design

Giao diện được thiết kế responsive:
- Desktop: Hiển thị đầy đủ
- Tablet: Grid tự động điều chỉnh
- Mobile: Stack vertically, scroll horizontal cho table

## Performance

### Frontend:
- Lazy loading cho danh sách lớn
- Debounce search để giảm API calls
- Cache dữ liệu đã load

### Backend:
- Pagination để giảm tải
- Index trên username, email để tăng tốc độ tìm kiếm
- Async/await cho non-blocking I/O

## Bảo mật

1. **Authentication**: Token-based authentication
2. **Authorization**: Kiểm tra quyền theo role
3. **Password**: Phải hash trước khi lưu vào DB
4. **SQL Injection**: Sử dụng SQLAlchemy ORM
5. **XSS**: React tự động escape output

## Troubleshooting

### Lỗi không load được danh sách:
- Kiểm tra Backend đang chạy
- Kiểm tra API_BASE_URL trong config
- Kiểm tra CORS settings

### Lỗi không thêm được nhân viên:
- Kiểm tra validation errors
- Kiểm tra username/email đã tồn tại chưa
- Kiểm tra password đã hash chưa

### Lỗi không hiển thị avatar:
- Kiểm tra URL avatar có hợp lệ không
- Kiểm tra CORS cho image domain

## Future Enhancements

1. Bulk import/export employees
2. Advanced permissions system
3. Activity logging
4. Email notifications
5. Password reset functionality
6. Two-factor authentication
7. Profile picture upload
8. Department management
9. Team assignments
10. Performance reviews
