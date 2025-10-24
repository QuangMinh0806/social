import { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUser, FaEnvelope, FaLock, FaUserTag, FaImage } from 'react-icons/fa';
import { useAuthStore } from '../../stores/authStore.js';
import RoleSelect from './RoleSelect.jsx';

const EmployeeModal = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password_hash: '',
    full_name: '',
    avatar_url: '',
    role: 'admin',
    status: 'active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        username: employee.username || '',
        email: employee.email || '',
        password_hash: '',
        full_name: employee.full_name || '',
        avatar_url: employee.avatar_url || '',
        role: employee.role || 'admin',
        status: employee.status || 'active'
      });
    } else {
      const availableRoles = useAuthStore.getState().getAvailableRoles?.() || [];
      const defaultRole = availableRoles.length ? availableRoles[0].value : 'admin';

      setFormData({
        username: '',
        email: '',
        password_hash: '',
        full_name: '',
        avatar_url: '',
        role: defaultRole,
        status: 'active'
      });
    }
    setErrors({});
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!employee && !formData.password_hash.trim()) {
      newErrors.password_hash = 'Mật khẩu là bắt buộc khi tạo mới';
    } else if (formData.password_hash && formData.password_hash.length < 6) {
      newErrors.password_hash = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Họ tên là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const dataToSend = { ...formData };

    if (employee && !dataToSend.password_hash) {
      delete dataToSend.password_hash;
    }

    onSave(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-lg sticky top-0 z-10">
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
            <FaUser className="text-sm sm:text-base" />
            <span className="hidden sm:inline">
              {employee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
            </span>
            <span className="sm:hidden">
              {employee ? 'Chỉnh sửa' : 'Thêm mới'}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition p-1"
          >
            <FaTimes size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Username */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <FaUser className="inline mr-1 sm:mr-2 text-blue-600 text-xs sm:text-sm" />
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!!employee}
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.username ? 'border-red-500' : 'border-gray-300'
                  } ${employee ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Nhập tên đăng nhập"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <FaEnvelope className="inline mr-1 sm:mr-2 text-blue-600 text-xs sm:text-sm" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Nhập email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <FaLock className="inline mr-1 sm:mr-2 text-blue-600 text-xs sm:text-sm" />
                Mật khẩu {!employee && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password_hash"
                value={formData.password_hash}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.password_hash ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder={employee ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
              />
              {errors.password_hash && (
                <p className="text-red-500 text-xs mt-1">{errors.password_hash}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <FaUser className="inline mr-1 sm:mr-2 text-blue-600 text-xs sm:text-sm" />
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Nhập họ và tên"
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <FaUserTag className="inline mr-1 sm:mr-2 text-blue-600 text-xs sm:text-sm" />
                Vai trò <span className="text-red-500">*</span>
              </label>
              <RoleSelect
                name="role"
                value={formData.role}
                onChange={handleChange}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
                <option value="suspended">Tạm khóa</option>
              </select>
            </div>

            {/* Avatar URL */}
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <FaImage className="inline mr-1 sm:mr-2 text-blue-600 text-xs sm:text-sm" />
                URL Avatar
              </label>
              <input
                type="text"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Nhập URL ảnh đại diện"
              />
              {formData.avatar_url && (
                <div className="mt-2">
                  <img
                    src={formData.avatar_url}
                    alt="Preview"
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-gray-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm sm:text-base font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
            >
              <FaSave className="text-sm" />
              {employee ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;