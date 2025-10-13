# AutoFB Frontend - Social Media Management System

Frontend React application for managing social media posts across multiple platforms.

## 🚀 Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **State Management**: React Context / Zustand

## 📁 Project Structure

```
src/
├── main.jsx                # Application entry point
├── index.css              # Global styles & Tailwind
├── config/                 # Configuration files
│   ├── api.config.js      # API endpoints & base URL
│   └── constants.js       # Application constants
├── services/               # API service layer
│   ├── api.service.js     # Axios instance & interceptors
│   ├── post.service.js    # Post APIs
│   ├── user.service.js    # User APIs
│   ├── page.service.js    # Page APIs
│   └── analytics.service.js # Analytics APIs
├── utils/                  # Utility functions
│   ├── helpers.js         # General helpers
│   └── dateFormatter.js   # Date formatting
├── router/                 # Route configuration
│   └── index.jsx          # Routes definition
├── layouts/                # Layout components
│   ├── MainLayout.jsx     # Main app layout
│   └── AuthLayout.jsx     # Auth pages layout
├── pages/                  # Page components
│   ├── Dashboard/
│   ├── Posts/
│   ├── Calendar/
│   ├── Pages/
│   ├── Employees/
│   ├── Templates/
│   ├── Media/
│   ├── Analytics/
│   └── Auth/
└── components/             # Reusable components
    ├── common/            # Common UI components
    ├── layout/            # Layout components
    ├── dashboard/         # Dashboard components
    ├── posts/             # Post-related components
    └── ...
```

## 🛠️ Setup & Installation

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=AutoFB
VITE_APP_VERSION=1.0.0
```

### 3. Run Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm run preview
```

## 📦 Created Files

### ✅ Configuration (6 files)
- ✅ `package.json` - Dependencies & scripts
- ✅ `vite.config.js` - Vite configuration
- ✅ `tailwind.config.js` - Tailwind CSS config
- ✅ `postcss.config.js` - PostCSS config
- ✅ `.env.example` - Environment variables template
- ✅ `index.html` - HTML template

### ✅ Core Setup (7 files)
- ✅ `src/index.css` - Global styles with Tailwind
- ✅ `src/main.jsx` - Application entry point
- ✅ `src/config/api.config.js` - API endpoints (130+ endpoints)
- ✅ `src/config/constants.js` - All constants
- ✅ `src/utils/helpers.js` - Utility functions
- ✅ `src/utils/dateFormatter.js` - Date formatting
- ✅ `src/router/index.jsx` - Routes configuration

### ✅ Services Layer (5 files)
- ✅ `src/services/api.service.js` - Axios instance with interceptors
- ✅ `src/services/post.service.js` - Post CRUD & actions
- ✅ `src/services/user.service.js` - User management
- ✅ `src/services/page.service.js` - Page management
- ✅ `src/services/analytics.service.js` - Analytics APIs

## 🔨 To Be Created

### Services (7 more files needed)
Create these following the same pattern as existing services:

```javascript
// src/services/platform.service.js
// src/services/template.service.js
// src/services/watermark.service.js
// src/services/media.service.js
// src/services/hashtag.service.js
// src/services/post-media.service.js
// src/services/post-hashtag.service.js
```

### Layouts (2 files)

**MainLayout.jsx** - Main application layout with sidebar & header:
```jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
```

**AuthLayout.jsx** - Login/Register layout:
```jsx
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
```

### Common Components (14 files)

Pattern for Button.jsx:
```jsx
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  icon = null,
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
```

Create similar patterns for:
- Input.jsx
- Select.jsx
- Textarea.jsx
- Modal.jsx
- Card.jsx
- Badge.jsx
- Loading.jsx
- Pagination.jsx
- Table.jsx
- Tabs.jsx
- Dropdown.jsx
- Avatar.jsx
- Toast.jsx

### Layout Components (4 files)

**Sidebar.jsx** - Navigation sidebar:
```jsx
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Calendar, Users, 
  Image, BarChart3, Bot, Settings, Package 
} from 'lucide-react';
import { ROUTES } from '../../config/constants';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.DASHBOARD },
    { icon: FileText, label: 'Quản lý bài đăng', path: ROUTES.POSTS },
    { icon: Calendar, label: 'Lịch đăng', path: ROUTES.CALENDAR },
    { icon: Package, label: 'Quản lý Page', path: ROUTES.PAGES },
    { icon: Users, label: 'Nhân viên', path: ROUTES.EMPLOYEES },
    { icon: FileText, label: 'Templates', path: ROUTES.TEMPLATES },
    { icon: Image, label: 'Thư viện Media', path: ROUTES.MEDIA },
    { icon: BarChart3, label: 'Analytics', path: ROUTES.ANALYTICS },
    { icon: Bot, label: 'AI Assistant', path: ROUTES.AI_ASSISTANT },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">AutoFB</h1>
        <p className="text-sm text-gray-500">Social Media Manager</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors
                    ${active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <Icon size={20} className="mr-3" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Link to="/settings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
          <Settings size={20} className="mr-3" />
          <span>Cài đặt</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
```

Create similar for:
- Header.jsx
- Footer.jsx
- Breadcrumb.jsx

### Pages (15+ pages needed)

Follow this pattern for **PostListPage.jsx**:
```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../../services/post.service';
import PostTable from '../../components/posts/PostTable';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { Plus, RefreshCw } from 'lucide-react';
import { ROUTES } from '../../config/constants';
import toast from 'react-hot-toast';

const PostListPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ skip: 0, limit: 20 });

  useEffect(() => {
    fetchPosts();
  }, [pagination.skip]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getAll(pagination);
      if (response.success) {
        setPosts(response.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách bài đăng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Bạn có chắc muốn xóa bài đăng này?')) {
      try {
        await postService.delete(postId);
        toast.success('Xóa bài đăng thành công');
        fetchPosts();
      } catch (error) {
        toast.error('Không thể xóa bài đăng');
      }
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý bài đăng</h1>
          <p className="text-gray-600 mt-1">Quản lý tất cả bài đăng của bạn</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPosts} icon={<RefreshCw size={18} />}>
            Làm mới
          </Button>
          <Link to={ROUTES.POST_CREATE}>
            <Button icon={<Plus size={18} />}>Tạo bài đăng</Button>
          </Link>
        </div>
      </div>

      <PostTable posts={posts} onDelete={handleDelete} />
    </div>
  );
};

export default PostListPage;
```

### Feature Components

Create components for each feature following the same patterns.

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 API Integration

All API calls go through the service layer. Example:

```javascript
import { postService } from './services/post.service';
import toast from 'react-hot-toast';

// In your component
const fetchPosts = async () => {
  try {
    const response = await postService.getAll({ skip: 0, limit: 20 });
    if (response.success) {
      setPosts(response.data);
      toast.success(response.message);
    }
  } catch (error) {
    toast.error('Failed to fetch posts');
  }
};
```

## 🎨 Styling Guide

Using Tailwind CSS utility classes:

```jsx
// Card
<div className="bg-white rounded-lg shadow p-6">

// Button Primary
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">

// Grid Layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Flex Container
<div className="flex items-center justify-between">
```

## 📝 Todo Checklist

### High Priority
- [ ] Complete all Layout components (MainLayout, AuthLayout, Sidebar, Header)
- [ ] Create all Common components (Button, Input, Modal, Loading, etc.)
- [ ] Implement Dashboard page with charts
- [ ] Create Post management pages (List, Create, Edit, Detail)
- [ ] Build Calendar page with schedule view

### Medium Priority
- [ ] Page management (List, Create, Connect)
- [ ] Employee management
- [ ] Template library
- [ ] Media library with upload
- [ ] Analytics dashboard

### Low Priority
- [ ] AI Assistant chat interface
- [ ] Dark mode support
- [ ] Mobile responsive improvements
- [ ] Performance optimizations

## 🔗 Related Documentation

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Lucide Icons](https://lucide.dev/)

## 📄 License

MIT License
