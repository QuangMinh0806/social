import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Facebook, 
  Users, 
  FileImage, 
  Image, 
  BarChart3, 
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/posts', icon: FileText, label: 'Quản lý bài viết' },
    { path: '/calendar', icon: Calendar, label: 'Lịch đăng bài' },
    { path: '/pages', icon: Facebook, label: 'Quản lý Page' },
    { path: '/employees', icon: Users, label: 'Nhân viên' },
    { path: '/templates', icon: FileImage, label: 'Mẫu nội dung' },
    { path: '/media', icon: Image, label: 'Thư viện Media' },
    { path: '/analytics', icon: BarChart3, label: 'Thống kê' },
    { path: '/ai-assistant', icon: Bot, label: 'AI Trợ lý' },
    { path: '/config', icon: Settings, label: 'Cấu hình' },
  ];

  return (
    <aside className={`bg-gray-900 text-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} flex flex-col`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        {!collapsed && <h1 className="text-xl font-bold">Social Auto Post</h1>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 transition-colors
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
              title={collapsed ? item.label : ''}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className={`text-xs text-gray-500 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? 'v1.0' : 'Version 1.0.0'}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
