# Template System - Hệ thống quản lý mẫu nội dung

## 📋 Tổng quan

Hệ thống Template đã được cập nhật với giao diện mới, bao gồm các tính năng:

### ✨ Tính năng mới

1. **📝 Caption** - Nội dung bài viết
   - Viết caption cho bài đăng
   - Hỗ trợ biến động như `{product_name}`, `{price}`
   
2. **#️⃣ Hashtags** - Quản lý hashtag
   - Thêm/xóa hashtag dễ dàng
   - Hiển thị trực quan với màu sắc
   
3. **💧 Watermark** - Logo đóng dấu
   - Chọn watermark từ thư viện
   - Bật/tắt watermark linh hoạt
   - Liên kết với bảng `watermarks`
   
4. **🖼️ Image Frame** - Khung ảnh
   - Thêm khung trang trí cho hình ảnh
   - URL khung ảnh tùy chỉnh
   
5. **🎬 Video Frame** - Khung video
   - Thêm khung trang trí cho video
   - URL khung video tùy chỉnh

---

## 🗄️ Cấu trúc Database

### Bảng `templates` - Các trường mới

```sql
-- Caption
caption TEXT

-- Hashtags (JSON Array)
hashtags JSON  -- ["hashtag1", "hashtag2", ...]

-- Watermark
watermark_id INTEGER REFERENCES watermarks(id)
watermark_enabled BOOLEAN DEFAULT FALSE

-- Image Frame
image_frame_url VARCHAR(255)
image_frame_enabled BOOLEAN DEFAULT FALSE

-- Video Frame
video_frame_url VARCHAR(255)
video_frame_enabled BOOLEAN DEFAULT FALSE
```

---

## 🚀 Hướng dẫn cài đặt

### 1. Chạy Migration Database

```bash
cd Backend
python migrations/add_template_new_fields.py
```

Migration script sẽ tự động thêm các trường mới vào bảng `templates`.

### 2. Backend đã được cập nhật

✅ Model (`models/model.py`) - Đã thêm các trường mới
✅ Service (`services/template_service.py`) - Đã cập nhật `_to_dict()`
✅ Controller - Không cần thay đổi (tự động xử lý)

### 3. Frontend đã được cập nhật

✅ `TemplateCreatePage.jsx` - Giao diện tạo mới
✅ `TemplateEditPage.jsx` - Giao diện chỉnh sửa

---

## 💻 Sử dụng API

### Tạo Template mới

```javascript
POST /api/templates

{
  "name": "Mẫu khuyến mãi",
  "description": "Mẫu cho các bài đăng khuyến mãi",
  "category": "Marketing",
  
  // Caption
  "caption": "🔥 Khuyến mãi {discount}% cho {product_name}\n💰 Chỉ còn {price}đ\n🎁 Số lượng có hạn!",
  
  // Hashtags
  "hashtags": ["sale", "discount", "shopping", "promotion"],
  
  // Watermark
  "watermark_enabled": true,
  "watermark_id": 1,
  
  // Image Frame
  "image_frame_enabled": true,
  "image_frame_url": "https://example.com/frames/summer-frame.png",
  
  // Video Frame
  "video_frame_enabled": false,
  "video_frame_url": "",
  
  // Legacy
  "thumbnail_url": "https://example.com/thumbnails/promo.jpg",
  "is_public": true,
  "created_by": 1
}
```

### Cập nhật Template

```javascript
PUT /api/templates/{id}

// Tương tự như tạo mới
```

### Lấy thông tin Template

```javascript
GET /api/templates/{id}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Mẫu khuyến mãi",
    "caption": "🔥 Khuyến mãi...",
    "hashtags": ["sale", "discount", "shopping"],
    "watermark_enabled": true,
    "watermark_id": 1,
    "image_frame_enabled": true,
    "image_frame_url": "https://...",
    "video_frame_enabled": false,
    "video_frame_url": "",
    // ... other fields
  }
}
```

---

## 🎨 Giao diện

### Thiết kế theo Module

Giao diện được chia thành các Card rõ ràng:

1. **Thông tin cơ bản** - Tên, mô tả, category
2. **Caption** - Icon MessageSquare (💬), màu xanh dương
3. **Hashtags** - Icon Hash (#), màu tím  
4. **Watermark** - Icon Droplet (💧), màu cyan
5. **Image Frame** - Icon Image (🖼️), màu xanh lá
6. **Video Frame** - Icon Video (🎬), màu đỏ

### Tính năng UI

- ✅ Toggle bật/tắt cho từng tính năng
- ✅ Thêm/xóa hashtag với badge đẹp
- ✅ Select dropdown cho watermark
- ✅ Icon màu sắc phân biệt các section
- ✅ Responsive design

---

## 📝 Ví dụ sử dụng Frontend

```jsx
// Tạo template với đầy đủ tính năng
const formData = {
  name: "Mẫu bài đăng sản phẩm",
  caption: "🎉 Ra mắt {product_name}!\n💰 Giá chỉ {price}đ",
  hashtags: ["newproduct", "shopping", "sale"],
  watermark_enabled: true,
  watermark_id: 1,
  image_frame_enabled: true,
  image_frame_url: "https://cdn.example.com/frame.png",
};

await templateService.create(formData);
```

---

## 🔧 File đã thay đổi

### Backend
- ✅ `Backend/models/model.py` - Template model
- ✅ `Backend/services/template_service.py` - Service layer
- ✅ `Backend/migrations/add_template_new_fields.py` - Migration script (NEW)

### Frontend  
- ✅ `Frontend/src/pages/templates/TemplateCreatePage.jsx` - Create page
- ✅ `Frontend/src/pages/templates/TemplateEditPage.jsx` - Edit page

---

## 🎯 Tương lai

Các tính năng có thể mở rộng:

- [ ] Preview template trước khi lưu
- [ ] Upload image frame/video frame trực tiếp
- [ ] Template marketplace (chia sẻ template công khai)
- [ ] Import/Export template JSON
- [ ] Duplicate template
- [ ] Template categories quản lý tốt hơn
- [ ] AI suggest hashtags
- [ ] Template analytics (template nào được dùng nhiều nhất)

---

## 📞 Hỗ trợ

Nếu có vấn đề, vui lòng kiểm tra:

1. ✅ Đã chạy migration script chưa?
2. ✅ Database có bảng `watermarks` chưa?
3. ✅ Backend API đang chạy?
4. ✅ Frontend service có import đầy đủ?

---

## 📄 License

Copyright © 2025 - Social Media Management System
