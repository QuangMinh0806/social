# Template List Page - Edit Function Added

## 📝 Tóm tắt thay đổi

Đã thêm chức năng **Sửa** (Edit) vào TemplateListPageNew.jsx để người dùng có thể chỉnh sửa template từ danh sách.

## 🔧 Các thay đổi đã thực hiện

### 1. Import useNavigate
```javascript
import { useNavigate } from 'react-router-dom';
```

### 2. Khởi tạo navigate hook
```javascript
const TemplateListPageNew = () => {
    const navigate = useNavigate();
    // ... rest of code
}
```

### 3. Thêm handler functions

#### handleEdit - Điều hướng đến trang edit
```javascript
const handleEdit = (templateId) => {
    navigate(`/templates/${templateId}/edit`);
};
```

#### handleView - Xem chi tiết template (placeholder)
```javascript
const handleView = (templateId) => {
    // TODO: Implement view modal or navigate to detail page
    toast.info('Chức năng xem chi tiết đang được phát triển');
};
```

### 4. Cập nhật button onClick handlers
```javascript
<div className="flex items-center gap-2 pt-3 border-t">
    <Button 
        variant="outline" 
        size="sm" 
        icon={<Eye size={16} />}
        onClick={() => handleView(template.id)}
    >
        Xem
    </Button>
    <Button 
        variant="outline" 
        size="sm" 
        icon={<Edit size={16} />}
        onClick={() => handleEdit(template.id)}  // ← Thêm onClick
    >
        Sửa
    </Button>
    <Button
        variant="outline"
        size="sm"
        icon={<Trash2 size={16} />}
        onClick={() => handleDelete(template.id)}
    >
        Xóa
    </Button>
</div>
```

### 5. Sửa lỗi trong form
Thay `modalType` bằng `formType` trong phần hướng dẫn:
```javascript
<li>Frame {formType === 'video_frame' ? 'Video' : 'Hình ảnh'}: 
    Dùng cho bài đăng {formType === 'video_frame' ? 'video' : 'hình ảnh'}
</li>
```

### 6. Cập nhật handleSubmit để xử lý hashtags đúng
```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        setSaving(true);
        
        // Prepare data based on template type
        const submitData = {
            ...formData,
            template_type: activeFilter,
        };

        // Process hashtags field - convert string to array
        if (activeFilter === 'hashtag' && formData.hashtags) {
            if (typeof formData.hashtags === 'string') {
                submitData.hashtags = formData.hashtags
                    .split(/[\s,]+/)
                    .filter(tag => tag.trim())
                    .map(tag => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`);
            }
        } else {
            submitData.hashtags = activeFilter === 'hashtag' ? [] : null;
        }

        // Clean up unused fields based on template type
        if (activeFilter !== 'caption') {
            delete submitData.caption;
        }
        if (activeFilter !== 'watermark') {
            delete submitData.watermark_position;
            delete submitData.watermark_opacity;
            delete submitData.watermark_image_url;
        }
        if (activeFilter !== 'image_frame' && activeFilter !== 'video_frame') {
            delete submitData.frame_type;
            delete submitData.aspect_ratio;
            delete submitData.frame_image_url;
        }

        await templateService.create(submitData);
        toast.success('Tạo template thành công');
        
        // Reset and reload
        setActiveFilter('all');
        await fetchTemplates();
    } catch (error) {
        toast.error('Không thể tạo template');
    } finally {
        setSaving(false);
    }
};
```

## 🎯 Chức năng hoàn thiện

### Nút "Xem" (View)
- Click → Hiển thị thông báo "Chức năng xem chi tiết đang được phát triển"
- TODO: Có thể implement modal xem chi tiết hoặc navigate đến trang detail

### Nút "Sửa" (Edit) ✅
- Click → Điều hướng đến `/templates/{id}/edit`
- Trang edit sẽ load template data và cho phép chỉnh sửa
- Hỗ trợ chuyển đổi giữa các loại template

### Nút "Xóa" (Delete) ✅
- Click → Hiển thị confirm dialog
- Xác nhận → Gọi API xóa template
- Reload danh sách sau khi xóa thành công

## 🔄 Flow hoạt động

1. **User click "Sửa"** → `handleEdit(template.id)` được gọi
2. **Navigate** → Chuyển đến `/templates/{id}/edit`
3. **TemplateEditPage** → Load template data từ API
4. **Auto-detect type** → Tab tự động chuyển đến loại template tương ứng
5. **User chỉnh sửa** → Có thể đổi type, sửa content, etc.
6. **Submit** → Backend validate và save
7. **Success** → Quay lại danh sách templates

## 📋 Route cần có

Đảm bảo route này tồn tại trong router config:
```javascript
{
  path: '/templates/:id/edit',
  element: <TemplateEditPage />
}
```

## ✅ Tính năng đã implement

- ✅ Navigation từ list → edit page
- ✅ Pass template ID qua URL params
- ✅ Hashtag handling (string → array)
- ✅ Data cleaning trước khi submit
- ✅ Proper error handling
- ✅ Success feedback với toast
- ✅ Auto reload danh sách sau khi create

## 🚀 Hướng dẫn sử dụng

### Để sửa template:
1. Vào trang danh sách templates: `/templates`
2. Tìm template cần sửa
3. Click nút **"Sửa"** (icon bút)
4. Tự động chuyển đến trang edit với tab đúng loại template
5. Chỉnh sửa thông tin
6. Click "Cập nhật mẫu"
7. Quay lại danh sách

### Để tạo template mới từ list page:
1. Click vào tab loại template muốn tạo (Caption/Hashtag/...)
2. Form tạo mới sẽ hiển thị
3. Điền thông tin
4. Click "Lưu template"
5. Template mới sẽ xuất hiện trong danh sách

## 🔗 Files liên quan

- `Frontend/src/pages/templates/TemplateListPageNew.jsx` - Danh sách templates (đã cập nhật)
- `Frontend/src/pages/templates/TemplateEditPage.jsx` - Trang edit (đã có sẵn)
- `Frontend/src/pages/templates/TemplateCreatePageNew.jsx` - Trang tạo mới
- `Backend/services/template_service.py` - Service xử lý data

## 🎉 Hoàn thành

Chức năng sửa template đã được thêm vào TemplateListPageNew.jsx thành công!
