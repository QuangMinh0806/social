import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Social Auto Post</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Quản lý đăng bài tự động</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;