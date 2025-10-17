import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

const UnauthorizedPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldX className="h-12 w-12 text-red-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Không có quyền truy cập
                </h1>

                <p className="text-gray-600 mb-8">
                    Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;