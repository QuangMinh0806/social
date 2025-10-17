import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { userService } from '../../services/userService.js';
import toast from 'react-hot-toast';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Key,
    Filter,
    MoreVertical,
    User,
    Shield,
    ShieldCheck,
    Crown
} from 'lucide-react';

const UserManagementPage = () => {
    const { user: currentUser, canManageRole, canViewRole, getRoleLabel, getAvailableRoles } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        skip: 0,
        limit: 10,
        total: 0
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [filters, pagination.skip, pagination.limit]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const result = await userService.getUsers({
                ...filters,
                skip: pagination.skip,
                limit: pagination.limit
            });

            if (result.success) {
                setUsers(result.data);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách users');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({ ...prev, skip: 0 }));
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa user này?')) {
            return;
        }

        try {
            const result = await userService.deleteUser(userId);
            if (result.success) {
                toast.success('Xóa user thành công');
                fetchUsers();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Không thể xóa user');
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'root':
                return <Crown className="h-4 w-4 text-yellow-500" />;
            case 'superadmin':
                return <ShieldCheck className="h-4 w-4 text-purple-500" />;
            case 'admin':
                return <Shield className="h-4 w-4 text-blue-500" />;
            default:
                return <User className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { label: 'Hoạt động', className: 'bg-green-100 text-green-800' },
            inactive: { label: 'Không hoạt động', className: 'bg-gray-100 text-gray-800' },
            suspended: { label: 'Bị khóa', className: 'bg-red-100 text-red-800' }
        };

        const config = statusConfig[status] || statusConfig.inactive;

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const filteredUsers = users.filter(user => canViewRole(user.role));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Users</h1>
                    <p className="text-gray-600">Quản lý tài khoản người dùng hệ thống</p>
                </div>

                {getAvailableRoles().length > 0 && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm User
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm user..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Tất cả quyền</option>
                        <option value="root">Root</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="admin">Admin</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="suspended">Bị khóa</option>
                    </select>

                    {/* Clear Filters */}
                    <button
                        onClick={() => {
                            setFilters({ search: '', role: '', status: '' });
                            setPagination(prev => ({ ...prev, skip: 0 }));
                        }}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Đang tải...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Không tìm thấy users nào
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quyền
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đăng nhập cuối
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.full_name || user.username}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getRoleIcon(user.role)}
                                                <span className="ml-2 text-sm text-gray-900">
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.last_login
                                                ? new Date(user.last_login).toLocaleDateString('vi-VN')
                                                : 'Chưa đăng nhập'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {canManageRole(user.role) && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowEditModal(true);
                                                            }}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>

                                                        {user.id !== currentUser?.id && (
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
                        disabled={pagination.skip === 0}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Trước
                    </button>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))}
                        disabled={filteredUsers.length < pagination.limit}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Hiển thị{' '}
                            <span className="font-medium">{pagination.skip + 1}</span>
                            {' '}-{' '}
                            <span className="font-medium">
                                {Math.min(pagination.skip + pagination.limit, pagination.skip + filteredUsers.length)}
                            </span>
                            {' '}trong tổng số{' '}
                            <span className="font-medium">{filteredUsers.length}</span>
                            {' '}kết quả
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
                                disabled={pagination.skip === 0}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))}
                                disabled={filteredUsers.length < pagination.limit}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <CreateUserModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        fetchUsers();
                        setShowCreateModal(false);
                    }}
                />
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={() => {
                        fetchUsers();
                        setShowEditModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};

// Create User Modal Component
const CreateUserModal = ({ onClose, onSuccess }) => {
    const { getAvailableRoles } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'admin'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await userService.createUser(formData);
            if (result.success) {
                toast.success('Tạo user thành công');
                onSuccess();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Không thể tạo user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo User Mới</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                        <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quyền</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            {getAvailableRoles().map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang tạo...' : 'Tạo User'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        email: user.email || '',
        full_name: user.full_name || '',
        status: user.status || 'active'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await userService.updateUser(user.id, formData);
            if (result.success) {
                toast.success('Cập nhật user thành công');
                onSuccess();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Không thể cập nhật user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Chỉnh sửa User</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                            <option value="suspended">Bị khóa</option>
                        </select>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagementPage;