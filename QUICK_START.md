# 🚀 QUICK START - Template System Update

## ⚡ Bắt đầu nhanh (3 bước)

### 1️⃣ Chạy Migration Database
```powershell
cd Backend
python migrations/add_template_new_fields.py
```

### 2️⃣ Khởi động Backend
```powershell
cd Backend
python main.py
```

### 3️⃣ Khởi động Frontend  
```powershell
cd Frontend
npm run dev
```

---

## 🎯 Truy cập giao diện mới

- **Tạo template:** http://localhost:5173/templates/create
- **Danh sách templates:** http://localhost:5173/templates
- **Chỉnh sửa:** http://localhost:5173/templates/edit/{id}

---

## ✨ Tính năng mới

### 1. 💬 Caption
Viết nội dung bài đăng với biến động:
```
🔥 Khuyến mãi {discount}% cho {product_name}
💰 Chỉ còn {price}đ
```

### 2. #️⃣ Hashtags
Thêm/xóa hashtag dễ dàng với giao diện badge đẹp mắt

### 3. 💧 Watermark
Chọn logo watermark từ thư viện có sẵn

### 4. 🖼️ Khung ảnh
Thêm khung trang trí cho hình ảnh

### 5. 🎬 Khung video
Thêm khung trang trí cho video

---

## 📋 Example Usage

```javascript
// Tạo template mới
const template = {
  name: "Sale Black Friday",
  caption: "🛍️ {product_name} giảm {discount}%\n💰 Giá: {price}đ",
  hashtags: ["blackfriday", "sale", "shopping"],
  watermark_enabled: true,
  watermark_id: 1,
  image_frame_enabled: true,
  image_frame_url: "https://cdn.example.com/frame.png"
};
```

---

## 🆘 Troubleshooting

### Lỗi khi chạy migration?
```powershell
# Kiểm tra database connection
cd Backend
python -c "from config.database import engine; print('OK')"
```

### Frontend không hiển thị watermarks?
```powershell
# Kiểm tra API
curl http://localhost:8000/api/watermarks
```

### Port đã được sử dụng?
```powershell
# Backend (8000)
netstat -ano | findstr :8000

# Frontend (5173)
netstat -ano | findstr :5173
```

---

## 📖 Chi tiết hơn

Xem file `IMPLEMENTATION_SUMMARY.md` để biết đầy đủ thông tin về:
- Cấu trúc database
- API endpoints
- Code changes
- Testing checklist

---

## ✅ Checklist sau khi setup

- [ ] Migration chạy thành công (8/8 migrations)
- [ ] Backend khởi động không lỗi
- [ ] Frontend khởi động không lỗi
- [ ] Vào `/templates/create` thấy 5 sections mới
- [ ] Dropdown watermark có dữ liệu
- [ ] Thêm/xóa hashtags hoạt động
- [ ] Lưu template thành công

---

**Nếu tất cả ✅ → Bạn đã sẵn sàng sử dụng hệ thống template mới! 🎉**
