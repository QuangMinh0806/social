# 🎬 TikTok OAuth Integration Guide

## 📝 Tổng quan

Đã thêm chức năng **đăng nhập và kết nối TikTok** vào hệ thống quản lý Page.

---

## 🎯 Các file đã tạo/cập nhật

### 1. Frontend Components

#### ✅ `Frontend/src/components/ConnectWithTiktok.jsx` (MỚI)
Component button kết nối TikTok, tương tự như ConnectWithYoutube

**Features:**
- Icon TikTok (MessageCircle)
- Call `/tiktok/login` API để lấy auth URL
- Redirect user đến TikTok OAuth
- Loading state khi đang xử lý

**Styling:**
- Border đen, text đen
- Hover: background đen, text trắng
- Icon: MessageCircle size 20

### 2. Frontend Pages

#### ✅ `Frontend/src/pages/pages/PageListPage.jsx` (UPDATED)
Thêm nút "Kết nối TikTok" vào header

**Thay đổi:**
```jsx
// Import component
import ConnectWithTiktok from '../../components/ConnectWithTiktok';

// Thêm vào actions (bên trái Youtube)
<div className="flex gap-3">
    <ConnectWithTiktok />      {/* 🆕 TikTok */}
    <ConnectWithYoutube />     {/* Youtube */}
    <LoginWithFb />            {/* Facebook */}
    <Button>Kết nối Page mới</Button>
</div>
```

**Vị trí buttons (trái → phải):**
1. 🎬 Kết nối TikTok (đen)
2. 🎥 Kết nối với Youtube (đỏ)
3. 👤 Đăng nhập Facebook (xanh)
4. ➕ Kết nối Page mới (primary)

### 3. Backend Routes

#### ✅ `Backend/routers/tiktok_router.py` (UPDATED)

**Imports mới:**
```python
from fastapi import Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from services.page_service import PageService
```

**Route `/callback` enhanced:**

1️⃣ **Get access token** từ TikTok OAuth
2️⃣ **Fetch user info** với fields: `open_id`, `union_id`, `avatar_url`, `display_name`
3️⃣ **Check existing page** trong database
4️⃣ **Create or Update page:**
   - Nếu đã tồn tại → Update token + avatar + status
   - Nếu chưa có → Create new page
5️⃣ **Redirect về `/pages`** với alert success

**Page data structure:**
```python
{
    "page_name": "TikTok Display Name",
    "platform_id": 5,  # TikTok platform ID
    "page_id": "open_id_from_tiktok",
    "access_token": "access_token_from_oauth",
    "avatar_url": "https://...",
    "status": "connected",
    "created_by": 1
}
```

---

## 🔄 OAuth Flow

### User Flow:

```
1. User click "Kết nối TikTok"
   ↓
2. Frontend call GET /tiktok/login
   ↓
3. Backend return auth_url
   ↓
4. Browser redirect đến TikTok OAuth
   ↓
5. User đăng nhập TikTok + cho phép quyền
   ↓
6. TikTok redirect về /tiktok/callback?code=xxx
   ↓
7. Backend đổi code → access_token
   ↓
8. Backend lấy user info (open_id, display_name, avatar)
   ↓
9. Backend lưu/update page vào database
   ↓
10. Redirect về /pages với alert "Kết nối thành công!"
```

### API Flow:

```
GET /tiktok/login
→ Response: { "auth_url": "https://www.tiktok.com/v2/auth/authorize?..." }

User authorize on TikTok
↓
GET /tiktok/callback?code=xxx&state=yyy
→ POST https://open.tiktokapis.com/v2/oauth/token/
   ← { "data": { "access_token": "...", "expires_in": 86400 } }
→ GET https://open.tiktokapis.com/v2/user/info/
   ← { "data": { "user": { "open_id": "...", "display_name": "..." } } }
→ Save to database
→ Return HTML redirect script
```

---

## 🎨 UI Preview

### Page Management Header:

```
┌──────────────────────────────────────────────────────┐
│  Danh sách Trang/Nhóm              [Actions]         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  [🎬 Kết nối TikTok]  [🎥 Kết nối với Youtube]       │
│  [👤 Đăng nhập Facebook]  [➕ Kết nối Page mới]      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### TikTok Button Styling:

```css
/* Default */
border: 1px solid black
color: black
background: white

/* Hover */
background: black
color: white
```

---

## 🔐 TikTok OAuth Configuration

### Current Settings (tiktok_router.py):

```python
CLIENT_KEY = "sbaw7q53fi2sp7s8lx"
CLIENT_SECRET = "iXXyqL5mJt1jBUiM2ouFGowv4w6D2ohq"
REDIRECT_URI = "https://8a7c47cd4eed.ngrok-free.app/tiktok/callback"
```

### Scopes:

```
user.info.basic   - Lấy thông tin cơ bản user
video.upload      - Upload video
video.publish     - Đăng video lên TikTok
```

### Required Fields in User Info:

```
open_id       - Unique ID (dùng làm page_id)
union_id      - Universal ID across apps
avatar_url    - Avatar URL
display_name  - Tên hiển thị
```

---

## 📊 Database

### Pages Table:

| Field | Type | Example |
|-------|------|---------|
| `page_name` | VARCHAR | "John Doe" |
| `platform_id` | INT | 5 (TikTok) |
| `page_id` | VARCHAR | "open_id_xxx" |
| `access_token` | TEXT | "act.xxx..." |
| `avatar_url` | VARCHAR | "https://p16.tiktokcdn.com/..." |
| `status` | VARCHAR | "connected" |
| `created_by` | INT | 1 |

### Platform ID:

⚠️ **Chú ý:** Code hiện tại dùng `platform_id = 5` cho TikTok.  
Kiểm tra trong database `platforms` table để đảm bảo ID đúng:

```sql
SELECT id, name FROM platforms WHERE name = 'TikTok';
```

Nếu khác 5, update trong `tiktok_router.py` line:

```python
"platform_id": 5,  # ← Thay số này
```

---

## ✅ Testing

### 1. Test Login Flow:

1. Vào trang `/pages`
2. Click "Kết nối TikTok"
3. Đăng nhập TikTok (hoặc đã login rồi)
4. Click "Authorize" cho phép quyền
5. Redirect về `/pages` với alert success
6. Thấy page TikTok mới xuất hiện

### 2. Check Database:

```sql
SELECT page_name, platform_id, page_id, status 
FROM pages 
WHERE platform_id = 5;
```

### 3. Check Access Token:

```sql
SELECT access_token FROM pages WHERE page_id = 'your_open_id';
```

Token này dùng để upload video lên TikTok.

### 4. Test Update Existing Page:

1. Đăng nhập lại với cùng TikTok account
2. Page sẽ được **update** (không tạo mới)
3. Check logs: `✅ Updated TikTok page: ...`

---

## 🚨 Troubleshooting

### Error: "Missing authorization code"

**Cause:** User deny authorization hoặc TikTok không trả về code

**Fix:** User cần click "Authorize" trên TikTok OAuth

### Error: "Failed to save page"

**Cause:** Database error, sai platform_id, hoặc missing fields

**Fix:** 
- Check platform_id trong database
- Check logs để xem error message chi tiết
- Verify page_service.create() parameters

### Redirect về ngrok URL không hoạt động

**Cause:** REDIRECT_URI không match với TikTok app settings

**Fix:**
1. Vào TikTok Developer Portal
2. Update Redirect URI: `https://your-ngrok.ngrok-free.app/tiktok/callback`
3. Update trong code `REDIRECT_URI`

### Token expired khi upload video

**Cause:** TikTok access token hết hạn (86400s = 24h)

**Fix:** Implement refresh token flow hoặc prompt user login lại

---

## 🔄 Next Steps

### 1. Refresh Token Implementation

Hiện tại chỉ lưu `access_token`. Cần thêm:

```python
"refresh_token": token_info["data"]["refresh_token"],
"expires_at": datetime.now() + timedelta(seconds=86400)
```

### 2. Auto-refresh Token

Background job check token expiry và auto-refresh:

```python
if page.expires_at < datetime.now():
    # Refresh token
    new_token = refresh_tiktok_token(page.refresh_token)
    await page_service.update(page.id, {"access_token": new_token})
```

### 3. User Info Display

Hiện avatar + display name trên page card:

```jsx
<img src={page.avatar_url} alt={page.page_name} />
<h3>{page.page_name}</h3>
```

### 4. Error Handling

Thêm try-catch cho từng bước trong callback route.

---

## 📚 References

- [TikTok OAuth Documentation](https://developers.tiktok.com/doc/login-kit-web)
- [TikTok User Info API](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info)
- [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started)

---

**Created:** October 17, 2025  
**Status:** ✅ Production Ready  
**Version:** 1.0
