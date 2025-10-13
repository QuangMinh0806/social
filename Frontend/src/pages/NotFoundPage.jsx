import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">Không tìm thấy trang</h2>
        <p className="text-gray-600 mt-2 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link to="/dashboard">
          <Button icon={<Home size={20} />}>
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
