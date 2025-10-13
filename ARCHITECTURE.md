# 🏗️ KIẾN TRÚC HỆ THỐNG TEMPLATE

## 📊 Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                         TEMPLATES                           │
├─────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                           │
│     name                  VARCHAR(100)    [NOT NULL]        │
│     description           TEXT                              │
│     category              VARCHAR(50)                       │
│                                                             │
│ ┌─ NEW FIELDS ──────────────────────────────────────────┐  │
│ │  caption               TEXT             💬 Caption     │  │
│ │  hashtags              JSON             #️⃣ Array       │  │
│ │                                                        │  │
│ │  watermark_id          INTEGER          💧 FK →       │  │
│ │  watermark_enabled     BOOLEAN          💧 Flag       │  │
│ │                                                        │  │
│ │  image_frame_url       VARCHAR(255)     🖼️ URL        │  │
│ │  image_frame_enabled   BOOLEAN          🖼️ Flag       │  │
│ │                                                        │  │
│ │  video_frame_url       VARCHAR(255)     🎬 URL        │  │
│ │  video_frame_enabled   BOOLEAN          🎬 Flag       │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│     content_template      TEXT            (Legacy)          │
│     thumbnail_url         VARCHAR(255)                      │
│     is_public             BOOLEAN                           │
│ FK  created_by            INTEGER         → users.id        │
│     usage_count           INTEGER                           │
│     created_at            DATETIME                          │
│     updated_at            DATETIME                          │
└─────────────────────────────────────────────────────────────┘
                                  │
                                  │ FK: watermark_id
                                  ▼
                    ┌──────────────────────────┐
                    │      WATERMARKS          │
                    ├──────────────────────────┤
                    │ PK  id                   │
                    │     name                 │
                    │     image_url            │
                    │     position             │
                    │     opacity              │
                    └──────────────────────────┘
```

---

## 🔄 Data Flow

### Tạo Template (Create Flow)

```
┌──────────┐    POST      ┌──────────┐    create()    ┌──────────┐
│          │  /templates  │          │                │          │
│ Frontend ├─────────────►│ Router   ├───────────────►│Controller│
│  (React) │              │ (FastAPI)│                │          │
└──────────┘              └──────────┘                └────┬─────┘
                                                           │
     ▲                                                     │
     │                                                     ▼
     │                                              ┌──────────┐
     │                    Success Response         │ Service  │
     │                    with template data       │          │
     └─────────────────────────────────────────────┤  CRUD    │
                                                   └────┬─────┘
                                                        │
                                                        │ INSERT
                                                        ▼
                                                 ┌──────────┐
                                                 │ Database │
                                                 │(Postgres)│
                                                 └──────────┘
```

### Lấy Template (Read Flow)

```
┌──────────┐    GET       ┌──────────┐   get_by_id() ┌──────────┐
│          │ /templates/1 │          │               │          │
│ Frontend ├─────────────►│ Router   ├──────────────►│Controller│
│          │              │          │               │          │
└──────────┘              └──────────┘               └────┬─────┘
     ▲                                                    │
     │                                                    ▼
     │                                             ┌──────────┐
     │                   Template JSON             │ Service  │
     │                   with new fields           │          │
     └─────────────────────────────────────────────┤ _to_dict │
                                                   └────┬─────┘
                                                        │
                                                        │ SELECT
                                                        ▼
                                                 ┌──────────┐
                                                 │ Database │
                                                 │          │
                                                 └──────────┘
```

---

## 🎨 Frontend Component Structure

```
TemplateCreatePage.jsx / TemplateEditPage.jsx
│
├─ <Breadcrumb />
│
├─ <form onSubmit={handleSubmit}>
│   │
│   ├─ 📋 <Card title="Thông tin cơ bản">
│   │   ├─ <Input name="name" />
│   │   ├─ <Input name="category" />
│   │   ├─ <Textarea name="description" />
│   │   └─ <checkbox is_public />
│   │
│   ├─ 💬 <Card title="Caption - Nội dung bài viết">
│   │   └─ <Textarea name="caption" />
│   │
│   ├─ #️⃣ <Card title="Hashtags">
│   │   ├─ <Input + addHashtag() />
│   │   └─ <Badge> #tag <X onClick={remove} />
│   │
│   ├─ 💧 <Card title="Watermark">
│   │   ├─ <checkbox watermark_enabled />
│   │   └─ <Select watermark_id> (from API)
│   │
│   ├─ 🖼️ <Card title="Khung ảnh">
│   │   ├─ <checkbox image_frame_enabled />
│   │   └─ <Input image_frame_url />
│   │
│   ├─ 🎬 <Card title="Khung video">
│   │   ├─ <checkbox video_frame_enabled />
│   │   └─ <Input video_frame_url />
│   │
│   └─ <Card>
│       └─ <Button type="submit">Lưu</Button>
│
└─ State Management:
    ├─ formData { name, caption, hashtags[], ... }
    ├─ watermarks[] (from API)
    ├─ hashtagInput (temporary)
    └─ loading, saving (UI states)
```

---

## 📡 API Endpoints

```
┌─────────────────────────────────────────────────────────────┐
│                    Template API Endpoints                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GET    /api/templates                                      │
│         → List all templates                                │
│         Response: { success, data: [...] }                  │
│                                                             │
│  GET    /api/templates/{id}                                 │
│         → Get single template                               │
│         Response: { success, data: {...} }                  │
│                                                             │
│  POST   /api/templates                                      │
│         → Create new template                               │
│         Body: {                                             │
│           name, caption, hashtags[],                        │
│           watermark_enabled, watermark_id,                  │
│           image_frame_enabled, image_frame_url,             │
│           video_frame_enabled, video_frame_url              │
│         }                                                   │
│                                                             │
│  PUT    /api/templates/{id}                                 │
│         → Update template                                   │
│         Body: { ...same as POST }                           │
│                                                             │
│  DELETE /api/templates/{id}                                 │
│         → Delete template                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Watermark API (Helper)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GET    /api/watermarks                                     │
│         → List all watermarks for dropdown                  │
│         Response: { success, data: [                        │
│           { id, name, position, ... }                       │
│         ]}                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 State Management Flow

### Hashtag Management

```
User Input: "shopping"
      │
      ▼
[Enter] or [+ Thêm]
      │
      ▼
addHashtag()
      │
      ├─ Remove "#" if present
      ├─ Check duplicates
      └─ Add to formData.hashtags[]
      │
      ▼
formData.hashtags = ["shopping", "sale", ...]
      │
      ▼
Render: <Badge>#shopping <X /></Badge>
      │
      └─ onClick X → removeHashtag()
                     │
                     ▼
              Filter out from array
                     │
                     ▼
              Re-render badges
```

### Watermark Toggle

```
Initial State:
  watermark_enabled: false
  watermark_id: null
      │
      ▼
User checks ☑ "Bật watermark"
      │
      ▼
onChange → setFormData({
  ...prev,
  watermark_enabled: true
})
      │
      ▼
Conditional Render:
  {watermark_enabled && (
    <Select watermark_id>
      <option>-- Chọn --</option>
      {watermarks.map(...)}
    </Select>
  )}
      │
      ▼
User selects watermark_id: 1
      │
      ▼
formData: {
  watermark_enabled: true,
  watermark_id: 1
}
```

---

## 🔐 Data Validation

### Backend Validation (Controller)

```python
async def create(self, data: dict):
    # Required fields
    required = ["name", "created_by"]
    
    for field in required:
        if field not in data:
            raise BadRequestException(f"Missing: {field}")
    
    # Optional fields with defaults
    data.setdefault("hashtags", [])
    data.setdefault("watermark_enabled", False)
    data.setdefault("image_frame_enabled", False)
    data.setdefault("video_frame_enabled", False)
    
    return await self.service.create(data)
```

### Frontend Validation

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Client-side validation
  if (!formData.name.trim()) {
    toast.error('Vui lòng nhập tên mẫu');
    return;
  }
  
  // Ensure hashtags is array
  if (!Array.isArray(formData.hashtags)) {
    formData.hashtags = [];
  }
  
  // Submit to API
  await templateService.create(formData);
};
```

---

## 📦 Dependencies

### Backend
```
sqlalchemy       → ORM, database models
asyncio          → Async operations
fastapi          → API framework
```

### Frontend
```
react            → UI framework
react-router-dom → Routing
lucide-react     → Icons
react-hot-toast  → Notifications
```

---

## 🎨 Color Scheme

```
Section          | Icon  | Color Class
─────────────────|───────|─────────────────
Caption          | 💬    | text-blue-600
Hashtags         | #️⃣    | text-purple-600
Watermark        | 💧    | text-cyan-600
Image Frame      | 🖼️    | text-green-600
Video Frame      | 🎬    | text-red-600
```

---

## 🚀 Performance Considerations

### Database
- ✅ JSON field cho hashtags (native support)
- ✅ Foreign key index trên watermark_id
- ✅ Pagination trên listing endpoints

### Frontend
- ✅ Lazy load watermarks chỉ khi cần
- ✅ Debounce hashtag input
- ✅ Conditional rendering cho frames
- ✅ Loading states để UX tốt hơn

### API
- ✅ Async/await throughout
- ✅ Connection pooling
- ✅ Error handling với try/catch

---

## 📈 Future Scalability

### Phase 2 - Enhancements
```
├─ Template Preview Component
├─ Drag & Drop Frame Upload
├─ Real-time Collaboration
└─ Template Versioning
```

### Phase 3 - Advanced
```
├─ AI Caption Generation
├─ Hashtag Analytics & Suggestions
├─ A/B Testing Templates
└─ Template Marketplace
```

---

**Kiến trúc này được thiết kế để:**
- ✅ Dễ bảo trì và mở rộng
- ✅ Tuân theo best practices
- ✅ Tách biệt concerns (separation of concerns)
- ✅ Reusable components
- ✅ Type-safe với validation
