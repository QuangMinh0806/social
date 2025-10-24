import { FaTimes, FaUser, FaEnvelope, FaUserTag, FaClock, FaCalendar } from 'react-icons/fa';

const EmployeeDetailModal = ({ isOpen, onClose, employee }) => {
  if (!isOpen || !employee) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
      'inactive': { label: 'Ngưng hoạt động', color: 'bg-gray-100 text-gray-800' },
      'suspended': { label: 'Tạm khóa', color: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges['inactive'];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-lg sticky top-0 z-10">
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
            <FaUser className="text-sm sm:text-base" />
            <span className="hidden sm:inline">Chi tiết nhân viên</span>
            <span className="sm:hidden">Thông tin</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition p-1"
          >
            <FaTimes size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b">
            <div className="flex-shrink-0">
              {employee.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={employee.username}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-purple-200"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-purple-200">
                  <span className="text-purple-600 font-bold text-2xl sm:text-3xl">
                    {employee.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                {employee.full_name || employee.username}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-2">@{employee.username}</p>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(employee.status).color}`}>
                {getStatusBadge(employee.status).label}
              </span>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-3 sm:space-y-4">
            {/* Email */}
            <div className="flex items-start gap-2 sm:gap-3">
              <FaEnvelope className="text-blue-600 mt-1 text-sm sm:text-base flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Email</p>
                <p className="text-sm sm:text-base text-gray-800 font-medium break-all">{employee.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-2 sm:gap-3">
              <FaUserTag className="text-purple-600 mt-1 text-sm sm:text-base flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Vai trò</p>
                <span className="inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                  {employee.role}
                </span>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-2 sm:gap-3">
              <FaCalendar className="text-green-600 mt-1 text-sm sm:text-base flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Ngày tạo</p>
                <p className="text-sm sm:text-base text-gray-800 break-words">{formatDate(employee.created_at)}</p>
              </div>
            </div>

            {/* Updated At */}
            <div className="flex items-start gap-2 sm:gap-3">
              <FaClock className="text-orange-600 mt-1 text-sm sm:text-base flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Cập nhật lần cuối</p>
                <p className="text-sm sm:text-base text-gray-800 break-words">{formatDate(employee.updated_at)}</p>
              </div>
            </div>

            {/* Last Login */}
            {employee.last_login && (
              <div className="flex items-start gap-2 sm:gap-3">
                <FaClock className="text-indigo-600 mt-1 text-sm sm:text-base flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Đăng nhập lần cuối</p>
                  <p className="text-sm sm:text-base text-gray-800 break-words">{formatDate(employee.last_login)}</p>
                </div>
              </div>
            )}

            {/* Employee ID */}
            <div className="flex items-start gap-2 sm:gap-3">
              <FaUser className="text-gray-600 mt-1 text-sm sm:text-base flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Mã nhân viên</p>
                <p className="text-sm sm:text-base text-gray-800 font-mono">EMP{employee.id?.toString().padStart(4, '0')}</p>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Thông tin bổ sung</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">ID Hệ thống</p>
                <p className="text-sm sm:text-base text-gray-800 font-semibold">{employee.id}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Trạng thái tài khoản</p>
                <p className="text-sm sm:text-base text-gray-800 font-semibold capitalize">{employee.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-end rounded-b-lg sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm sm:text-base font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;