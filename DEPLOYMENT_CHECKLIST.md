# ✅ DEPLOYMENT CHECKLIST

## 📋 Trước khi Deploy

### 🗄️ Database

- [ ] **Backup database hiện tại**
  ```powershell
  pg_dump -U username -d dbname > backup_before_template_update.sql
  ```

- [ ] **Chạy migration script**
  ```powershell
  cd Backend
  python migrations/add_template_new_fields.py
  ```

- [ ] **Verify các cột mới đã được tạo**
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'templates';
  ```
  
  Phải có:
  - ✅ caption (text)
  - ✅ hashtags (json)
  - ✅ watermark_id (integer)
  - ✅ watermark_enabled (boolean)
  - ✅ image_frame_url (varchar)
  - ✅ image_frame_enabled (boolean)
  - ✅ video_frame_url (varchar)
  - ✅ video_frame_enabled (boolean)

### 🔙 Backend

- [ ] **Test Backend độc lập**
  ```powershell
  cd Backend
  python main.py
  ```

- [ ] **Test API endpoints**
  ```powershell
  # List templates
  curl http://localhost:8000/api/templates
  
  # Get single template
  curl http://localhost:8000/api/templates/1
  
  # List watermarks
  curl http://localhost:8000/api/watermarks
  ```

- [ ] **Verify response có đủ fields mới**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "...",
      "caption": "...",
      "hashtags": [...],
      "watermark_enabled": false,
      // ... các field khác
    }
  }
  ```

### 🎨 Frontend

- [ ] **Install dependencies (nếu cần)**
  ```powershell
  cd Frontend
  npm install
  ```

- [ ] **Test build production**
  ```powershell
  npm run build
  ```
  
  ✅ Build thành công, không có errors

- [ ] **Test development mode**
  ```powershell
  npm run dev
  ```

### 🧪 Functional Testing

- [ ] **Test Create Template**
  - [ ] Vào http://localhost:5173/templates/create
  - [ ] Form hiển thị đầy đủ 5 sections
  - [ ] Icons hiển thị đúng màu sắc
  - [ ] Thêm hashtag → Badge xuất hiện
  - [ ] Xóa hashtag → Badge biến mất
  - [ ] Toggle watermark → Dropdown hiện/ẩn
  - [ ] Dropdown watermark có data
  - [ ] Toggle frames → Input URL hiện/ẩn
  - [ ] Submit form → Redirect về /templates
  - [ ] Toast notification hiện "Tạo mẫu thành công"

- [ ] **Test Edit Template**
  - [ ] Vào http://localhost:5173/templates/edit/1
  - [ ] Loading hiển thị trong lúc fetch
  - [ ] Form pre-filled với data cũ
  - [ ] Hashtags hiển thị dưới dạng badges
  - [ ] Watermark được chọn đúng
  - [ ] Frames được check đúng
  - [ ] Sửa và submit → Cập nhật thành công
  - [ ] Toast notification "Cập nhật mẫu thành công"

- [ ] **Test List Templates**
  - [ ] Vào http://localhost:5173/templates
  - [ ] Templates mới tạo hiển thị
  - [ ] Click "Chỉnh sửa" → Vào edit page
  - [ ] Click "Xóa" → Confirm và xóa thành công

### 🔍 Edge Cases

- [ ] **Template không có hashtags**
  - [ ] Hiển thị "Chưa có hashtag nào"
  - [ ] API trả về `hashtags: []`

- [ ] **Template không có watermark**
  - [ ] `watermark_enabled: false`
  - [ ] `watermark_id: null`
  - [ ] Dropdown không hiển thị

- [ ] **Template không có frames**
  - [ ] `image_frame_enabled: false`
  - [ ] `video_frame_enabled: false`
  - [ ] Input URLs không hiển thị

- [ ] **Watermark list rỗng**
  - [ ] Dropdown chỉ có option "-- Chọn watermark --"
  - [ ] Không crash

### 📱 Responsive Testing

- [ ] **Desktop (1920x1080)**
  - [ ] Form 2 columns
  - [ ] Sections rõ ràng

- [ ] **Tablet (768x1024)**
  - [ ] Form responsive
  - [ ] Cards stack tốt

- [ ] **Mobile (375x667)**
  - [ ] Form 1 column
  - [ ] Buttons stack vertical
  - [ ] Input fields full width

### 🚨 Error Handling

- [ ] **Network Error**
  - [ ] Backend off → Toast "Không thể kết nối"
  - [ ] Loading state tắt

- [ ] **Validation Error**
  - [ ] Name rỗng → Toast "Vui lòng nhập tên mẫu"
  - [ ] Form không submit

- [ ] **404 Error**
  - [ ] Edit template không tồn tại
  - [ ] Redirect về /templates
  - [ ] Toast "Không thể tải thông tin mẫu"

### 🔐 Security

- [ ] **SQL Injection**
  - [ ] SQLAlchemy ORM → Protected
  - [ ] Parameterized queries

- [ ] **XSS**
  - [ ] React escapes by default
  - [ ] No dangerouslySetInnerHTML

- [ ] **CSRF**
  - [ ] FastAPI CORS configured
  - [ ] Token validation (if implemented)

---

## 🚀 Deploy to Production

### Step 1: Database Migration

```powershell
# Production database
cd Backend
python migrations/add_template_new_fields.py
```

**⚠️ QUAN TRỌNG:**
- Chạy trong giờ thấp điểm
- Có backup sẵn
- Test trên staging trước

### Step 2: Deploy Backend

```powershell
cd Backend
# Build & deploy theo quy trình hiện tại
```

### Step 3: Deploy Frontend

```powershell
cd Frontend
npm run build
# Deploy folder dist/
```

### Step 4: Smoke Test

- [ ] Hit production URL
- [ ] Create 1 test template
- [ ] Edit test template
- [ ] Delete test template
- [ ] Check logs - no errors

---

## 📊 Monitoring

### Sau deploy, theo dõi:

- [ ] **Error rate**
  - Backend logs
  - Frontend console errors

- [ ] **API performance**
  - `/api/templates` response time
  - Database query performance

- [ ] **User feedback**
  - Bug reports
  - Feature requests

### Alerts cần setup:

```
🚨 Migration failed
🚨 API errors > 5% 
🚨 Page load time > 3s
🚨 Database connection errors
```

---

## 🔄 Rollback Plan

Nếu có vấn đề nghiêm trọng:

### Option 1: Rollback Migration

```sql
-- Remove new columns
ALTER TABLE templates DROP COLUMN IF EXISTS caption;
ALTER TABLE templates DROP COLUMN IF EXISTS hashtags;
ALTER TABLE templates DROP COLUMN IF EXISTS watermark_id;
ALTER TABLE templates DROP COLUMN IF EXISTS watermark_enabled;
ALTER TABLE templates DROP COLUMN IF EXISTS image_frame_url;
ALTER TABLE templates DROP COLUMN IF EXISTS image_frame_enabled;
ALTER TABLE templates DROP COLUMN IF EXISTS video_frame_url;
ALTER TABLE templates DROP COLUMN IF EXISTS video_frame_enabled;
```

### Option 2: Rollback Code

```powershell
# Frontend
git checkout HEAD~1 Frontend/src/pages/templates/

# Backend
git checkout HEAD~1 Backend/models/model.py
git checkout HEAD~1 Backend/services/template_service.py
```

### Option 3: Restore Backup

```powershell
psql -U username -d dbname < backup_before_template_update.sql
```

---

## ✅ Sign-off

Checklist này phải được complete trước khi deploy production:

- [ ] ✅ Tất cả tests pass
- [ ] ✅ Code review approved
- [ ] ✅ Staging test successful
- [ ] ✅ Backup completed
- [ ] ✅ Rollback plan ready
- [ ] ✅ Team notified

**Signed by:** _________________  
**Date:** _________________  
**Environment:** ☐ Staging  ☐ Production

---

## 📞 Support

Nếu gặp vấn đề:

1. Check logs:
   ```powershell
   # Backend
   tail -f Backend/logs/app.log
   
   # Frontend (browser)
   F12 → Console tab
   ```

2. Check database:
   ```sql
   SELECT * FROM templates ORDER BY id DESC LIMIT 5;
   ```

3. Contact team:
   - Backend issues → Backend dev
   - Frontend issues → Frontend dev
   - Database issues → DBA

---

**🎉 Good luck with deployment!**
