import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      <Link to="/dashboard" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
        <Home size={16} />
        <span>Trang chủ</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={16} className="text-gray-400" />
          {item.href ? (
            <Link to={item.href} className="text-gray-600 hover:text-blue-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
