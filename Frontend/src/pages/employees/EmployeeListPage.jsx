import { useState, useEffect } from 'react';
import { userService } from '../../services/user.service';
import toast from 'react-hot-toast';
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

  // Fetch employees
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll({ skip: 0, limit: 1000 });
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

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle create employee
  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  // Handle edit employee
  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  // Handle view employee details
  const handleViewDetail = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  // Handle delete employee
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

  // Handle save employee (create or update)
  const handleSave = async (data) => {
    try {
      if (selectedEmployee) {
        // Update
        await userService.update(selectedEmployee.id, data);
        toast.success('Cập nhật nhân viên thành công');
      } else {
        // Create
        await userService.create(data);
        toast.success('Thêm nhân viên thành công');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error(selectedEmployee ? 'Không thể cập nhật nhân viên' : 'Không thể thêm nhân viên');
      console.error('Error saving employee:', error);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      'Super Admin': 'bg-red-100 text-red-800',
      'Admin': 'bg-blue-100 text-blue-800',
      'Content Editor': 'bg-purple-100 text-purple-800',
      'Social Media Specialist': 'bg-green-100 text-green-800',
      'Video Producer': 'bg-yellow-100 text-yellow-800',
      'editor': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      'active': { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
      'inactive': { label: 'Ngưng hoạt động', color: 'bg-gray-100 text-gray-800' },
      'suspended': { label: 'Tạm khóa', color: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges['inactive'];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaUsers className="text-blue-600" />
          Quản lý nhân viên
        </h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <FaUsers className="text-3xl text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Tổng nhân viên</p>
              <p className="text-3xl font-bold text-gray-800">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <FaUserCheck className="text-3xl text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Đang hoạt động</p>
              <p className="text-3xl font-bold text-gray-800">{statistics.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-lg">
              <FaUserPlus className="text-3xl text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Mới trong tháng</p>
              <p className="text-3xl font-bold text-gray-800">{statistics.newThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Buttons Group */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreate}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FaUserPlus />
              Thêm nhân viên
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
              <FaFileExport />
              Export
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
              <FaFileImport />
              Import
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Content Editor">Content Editor</option>
              <option value="Social Media Specialist">Social Media Specialist</option>
              <option value="Video Producer">Video Producer</option>
              <option value="editor">Editor</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngưng hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-600">Không tìm thấy nhân viên nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                        {employee.role}
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
