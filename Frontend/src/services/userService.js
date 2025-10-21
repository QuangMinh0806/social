import { API_ENDPOINTS } from '../config/api.config.js';
import apiClient from './api.service.js';

export const userService = {
  // Get users list with filters
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.skip != null) queryParams.append('skip', params.skip);
      if (params.limit != null) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);

      const url = `${API_ENDPOINTS.USERS}?${queryParams.toString()}`;
      const data = await apiClient.get(url);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Không thể lấy danh sách users',
      };
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const data = await apiClient.get(API_ENDPOINTS.USER_BY_ID(userId));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Không thể lấy thông tin user',
      };
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.CREATE_USER, userData);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Tạo user thất bại',
      };
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const data = await apiClient.put(API_ENDPOINTS.UPDATE_USER(userId), userData);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Cập nhật user thất bại',
      };
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const data = await apiClient.delete(API_ENDPOINTS.DELETE_USER(userId));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Xóa user thất bại',
      };
    }
  },

  // Change user password (admin function)
  async changeUserPassword(userId, newPassword) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.CHANGE_USER_PASSWORD(userId), {
        new_password: newPassword,
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Đổi mật khẩu thất bại',
      };
    }
  },
};
