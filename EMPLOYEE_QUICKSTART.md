# 🎯 Hướng Dẫn Nhanh - Quản Lý Nhân Viên

## 📋 Tính năng đã hoàn thành

✅ **Giao diện đẹp giống y hệt trong ảnh mẫu**
- Dashboard với 3 thống kê chính (Tổng nhân viên, Đang hoạt động, Mới trong tháng)
- Table hiển thị danh sách nhân viên với đầy đủ thông tin
- Design responsive, màu sắc và icon đẹp mắt

✅ **Chức năng CRUD đầy đủ**
- ✏️ **Thêm nhân viên mới** (Modal với validation)
- 📝 **Sửa thông tin nhân viên** (Modal chỉnh sửa)
- 👁️ **Xem chi tiết nhân viên** (Modal chi tiết)
- 🗑️ **Xóa nhân viên** (Có confirm)

✅ **Tìm kiếm & Lọc mạnh mẽ**
- 🔍 Tìm kiếm theo username, email, họ tên
- 🎭 Lọc theo vai trò (Super Admin, Admin, Content Editor, etc.)
- 📊 Lọc theo trạng thái (Hoạt động, Ngưng hoạt động, Tạm khóa)
- 🎯 Kết hợp tìm kiếm + lọc cùng lúc

✅ **API Backend hoàn chỉnh**
- GET /api/users - Lấy danh sách (có search, filter, pagination)
- GET /api/users/{id} - Lấy chi tiết
- POST /api/users - Tạo mới
- PUT /api/users/{id} - Cập nhật
- DELETE /api/users/{id} - Xóa

## 🚀 Cách Sử Dụng

### 1️⃣ Chạy Backend
```bash
cd Backend
python main.py
```
Backend sẽ chạy ở: http://localhost:8000

### 2️⃣ Seed dữ liệu mẫu (nếu cần)
```bash
cd Backend
python seed_employees.py
```
Sẽ tạo 8 nhân viên mẫu với đầy đủ thông tin.

### 3️⃣ Chạy Frontend
```bash
cd Frontend
npm run dev
```
Frontend sẽ chạy ở: http://localhost:5173

### 4️⃣ Truy cập trang Quản lý nhân viên
Vào menu bên trái → Click "**Nhân viên**" hoặc truy cập: http://localhost:5173/employees

## 📝 Hướng Dẫn Sử Dụng Các Chức Năng

### ➕ Thêm nhân viên mới
1. Click nút **"Thêm nhân viên"** (màu tím)
2. Điền form:
   - **Tên đăng nhập** *(bắt buộc, min 3 ký tự)*
   - **Email** *(bắt buộc, format email)*
   - **Mật khẩu** *(bắt buộc, min 6 ký tự)*
   - **Họ và tên** *(bắt buộc)*
   - **Vai trò** (chọn từ dropdown)
   - **Trạng thái** (mặc định: Hoạt động)
   - **URL Avatar** (tùy chọn)
3. Click **"Thêm mới"**
4. Thông báo toast xuất hiện nếu thành công/thất bại

### ✏️ Sửa nhân viên
1. Click icon **✏️** ở cột "Thao tác"
2. Form mở ra với dữ liệu hiện tại
3. Chỉnh sửa thông tin (Username không thể đổi)
4. Mật khẩu để trống = không đổi
5. Click **"Cập nhật"**

### 👁️ Xem chi tiết
1. Click icon **👁️** ở cột "Thao tác"
2. Popup hiện thông tin đầy đủ:
   - Avatar lớn
   - Thông tin cá nhân
   - Vai trò và quyền hạn
   - Thời gian tạo, cập nhật, đăng nhập cuối

### 🗑️ Xóa nhân viên
1. Click icon **🗑️** ở cột "Thao tác"
2. Confirm popup xuất hiện
3. Click "OK" để xóa

### 🔍 Tìm kiếm
- Gõ vào ô **"Tìm kiếm nhân viên..."**
- Tìm theo: username, email, hoặc họ tên
- Kết quả lọc real-time

### 🎯 Lọc dữ liệu
**Lọc theo vai trò:**
- Tất cả vai trò
- Super Admin
- Admin
- Content Editor
- Social Media Specialist
- Video Producer
- Editor

**Lọc theo trạng thái:**
- Tất cả trạng thái
- Hoạt động
- Ngưng hoạt động
- Tạm khóa

**Lọc kết hợp:** Có thể dùng tìm kiếm + lọc vai trò + lọc trạng thái cùng lúc!

## 🎨 Các Màu Badge

| Vai trò | Màu |
|---------|-----|
| Super Admin | 🔴 Đỏ |
| Admin | 🔵 Xanh dương |
| Content Editor | 🟣 Tím |
| Social Media Specialist | 🟢 Xanh lá |
| Video Producer | 🟡 Vàng |
| Editor | ⚫ Xám |

| Trạng thái | Màu |
|-----------|-----|
| Hoạt động | 🟢 Xanh lá |
| Ngưng hoạt động | ⚫ Xám |
| Tạm khóa | 🔴 Đỏ |

## 🧪 Test API với curl

### Lấy tất cả nhân viên
```bash
curl http://localhost:8000/api/users
```

### Tìm kiếm
```bash
curl "http://localhost:8000/api/users?search=admin"
```

### Lọc theo vai trò
```bash
curl "http://localhost:8000/api/users?role=Admin"
```

### Lọc theo trạng thái
```bash
curl "http://localhost:8000/api/users?status=active"
```

### Kết hợp tất cả
```bash
curl "http://localhost:8000/api/users?search=nguyen&role=Admin&status=active"
```

### Thêm nhân viên mới
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password_hash": "hashed_password",
    "full_name": "New User Name",
    "role": "editor",
    "status": "active"
  }'
```

### Cập nhật nhân viên
```bash
curl -X PUT http://localhost:8000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name",
    "role": "Admin"
  }'
```

### Xóa nhân viên
```bash
curl -X DELETE http://localhost:8000/api/users/1
```

## 📚 Files Quan Trọng

### Frontend
```
Frontend/src/pages/employees/
├── EmployeeListPage.jsx      # Trang chính - danh sách nhân viên
├── EmployeeModal.jsx          # Modal thêm/sửa
└── EmployeeDetailModal.jsx    # Modal xem chi tiết
```

### Backend
```
Backend/
├── models/model.py                    # Model User
├── services/user_service.py           # Business logic
├── controllers/user_controller.py     # Controller
├── routers/user_router.py             # API routes
├── seed_employees.py                  # Script tạo dữ liệu mẫu
└── test_employee_api.py               # Script test API
```

## ⚡ Performance Tips

1. **Pagination**: Backend hỗ trợ skip & limit
   ```javascript
   await userService.getAll({ skip: 0, limit: 50 });
   ```

2. **Cache**: Kết quả search có thể cache ở frontend để giảm API calls

3. **Debounce**: Search input đã được debounce tự động

## 🔒 Validation Rules

### Username
- Bắt buộc
- Min 3 ký tự
- Unique (không trùng)
- Không thể đổi khi edit

### Email
- Bắt buộc
- Format email hợp lệ
- Unique (không trùng)

### Password
- Bắt buộc khi tạo mới
- Min 6 ký tự
- Tùy chọn khi edit (để trống = không đổi)

### Full Name
- Bắt buộc

## 🎯 Đã Test & Hoạt Động

✅ Giao diện responsive (Desktop, Tablet, Mobile)
✅ CRUD đầy đủ (Create, Read, Update, Delete)
✅ Search real-time
✅ Filter theo role và status
✅ Validation form đầy đủ
✅ Toast notifications
✅ Error handling
✅ API với query parameters
✅ Modal animations
✅ Loading states
✅ Empty states

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra Backend đang chạy (http://localhost:8000)
2. Kiểm tra Frontend đang chạy (http://localhost:5173)
3. Kiểm tra database đã có dữ liệu chưa
4. Xem console log để debug
5. Xem file EMPLOYEE_MANAGEMENT_README.md để biết thêm chi tiết

---

**Chúc bạn sử dụng vui vẻ! 🎉**
