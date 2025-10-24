import { useState, useEffect } from 'react';
import { userService } from '../../services/userService.js';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore.js';
import {
  FaUsers,
  FaUserCheck,
  FaUserPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaFileExport,
  FaFileImport,
  FaFilter
} from 'react-icons/fa';
import EmployeeModal from './EmployeeModal';
import EmployeeDetailModal from './EmployeeDetailModal';

const EmployeeListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers({ skip: 0, limit: 1000 });
      if (response.success) {
        setEmployees(response.data);
        calculateStatistics(response.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách nhân viên');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data) => {
    const total = data.length;
    const active = data.filter(emp => emp.status === 'active').length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newThisMonth = data.filter(emp => {
      const createdDate = new Date(emp.created_at);
      return createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear;
    }).length;

    setStatistics({ total, active, newThisMonth });
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleViewDetail = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.username}"?`)) {
      return;
    }

    try {
      await userService.delete(employee.id);
      toast.success('Xóa nhân viên thành công');
      fetchEmployees();
    } catch (error) {
      toast.error('Không thể xóa nhân viên');
      console.error('Error deleting employee:', error);
    }
  };

  const handleSave = async (data) => {
    try {
      if (selectedEmployee) {
        await userService.updateUser(selectedEmployee.id, data);
        toast.success('Cập nhật nhân viên thành công');
      } else {
        const res = await userService.createUser(data);
        if (res.statusCode === 400) {
          toast.error('Tên đăng nhập hoặc email đã tồn tại');
          return;
        }
        toast.success('Thêm nhân viên thành công');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error(selectedEmployee ? 'Không thể cập nhật nhân viên' : 'Không thể thêm nhân viên');
      console.error('Error saving employee:', error);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'root': 'bg-purple-100 text-purple-800',
      'superadmin': 'bg-red-100 text-red-800',
      'admin': 'bg-blue-100 text-blue-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
      'inactive': { label: 'Ngưng hoạt động', color: 'bg-gray-100 text-gray-800' },
      'suspended': { label: 'Tạm khóa', color: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges['inactive'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaUsers className="text-blue-600 text-lg sm:text-2xl" />
          <span className="hidden sm:inline">Quản lý nhân viên</span>
          <span className="sm:hidden">Nhân viên</span>
        </h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-blue-100 p-2.5 sm:p-4 rounded-lg flex-shrink-0">
              <FaUsers className="text-2xl sm:text-3xl text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-xs sm:text-sm">Tổng nhân viên</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-green-100 p-2.5 sm:p-4 rounded-lg flex-shrink-0">
              <FaUserCheck className="text-2xl sm:text-3xl text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-xs sm:text-sm">Đang hoạt động</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{statistics.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-purple-100 p-2.5 sm:p-4 rounded-lg flex-shrink-0">
              <FaUserPlus className="text-2xl sm:text-3xl text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-xs sm:text-sm">Mới trong tháng</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{statistics.newThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Top Row - Buttons and Search */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Buttons Group */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium"
              >
                <FaUserPlus className="text-sm" />
                <span className="hidden sm:inline">Thêm nhân viên</span>
                <span className="sm:hidden">Thêm</span>
              </button>
              <button className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium">
                <FaFileExport className="text-sm" />
                <span className="hidden lg:inline">Export</span>
              </button>
              <button className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium">
                <FaFileImport className="text-sm" />
                <span className="hidden lg:inline">Import</span>
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 sm:max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500 text-sm flex-shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Tất cả vai trò</option>
                {
                  (useAuthStore.getState().getAvailableRoles?.() || [
                    { value: 'admin', label: 'Admin' },
                    { value: 'superadmin', label: 'Super Admin' },
                    { value: 'root', label: 'Root' }
                  ]).map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))
                }
              </select>
            </div>

            <div className="flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
                <option value="suspended">Tạm khóa</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="mx-auto text-5xl sm:text-6xl text-gray-300 mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Không tìm thấy nhân viên nào</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nhân viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quyền hạn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            {employee.avatar_url ? (
                              <img
                                src={employee.avatar_url}
                                alt={employee.username}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-lg">
                                  {employee.username?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{employee.full_name || employee.username}</div>
                            <div className="text-sm text-gray-500">@{employee.username} • {employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(employee.role)}`}>
                          {useAuthStore.getState().getRoleLabel(employee.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">all</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(employee.status).color}`}>
                          {getStatusBadge(employee.status).label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(employee.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetail(employee)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition"
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEdit(employee)}
                            className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 transition"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(employee)}
                            className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition"
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="p-4 hover:bg-gray-50 transition">
                  {/* Employee Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0">
                      {employee.avatar_url ? (
                        <img
                          src={employee.avatar_url}
                          alt={employee.username}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {employee.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {employee.full_name || employee.username}
                      </div>
                      <div className="text-sm text-gray-500 truncate">@{employee.username}</div>
                      <div className="text-sm text-gray-500 truncate">{employee.email}</div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(employee.role)}`}>
                      {useAuthStore.getState().getRoleLabel(employee.role)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(employee.status).color}`}>
                      {getStatusBadge(employee.status).label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(employee.created_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(employee)}
                      className="flex-1 text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FaEye className="text-xs" />
                      Xem
                    </button>
                    <button
                      onClick={() => handleEdit(employee)}
                      className="flex-1 text-green-600 hover:text-green-800 px-3 py-2 rounded-lg hover:bg-green-50 transition text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FaEdit className="text-xs" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(employee)}
                      className="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          employee={selectedEmployee}
        />
      )}

      {isDetailModalOpen && (
        <EmployeeDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
};

export default EmployeeListPage;