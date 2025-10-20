import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config.js';

// Create axios instance với auth token
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor để include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor để handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const userService = {
  // Get users list with filters
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.skip) queryParams.append('skip', params.skip);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);

      const url = `${API_ENDPOINTS.USERS}?${queryParams.toString()}`;
      const response = await api.get(url);
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Không thể lấy danh sách users'
      };
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(API_ENDPOINTS.USER_BY_ID(userId));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Không thể lấy thông tin user'
      };
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.CREATE_USER, userData);
      return { success: true, data: response.data, statusCode: response.status };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Tạo user thất bại'
      };
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(API_ENDPOINTS.UPDATE_USER(userId), userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Cập nhật user thất bại'
      };
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await api.delete(API_ENDPOINTS.DELETE_USER(userId));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Xóa user thất bại'
      };
    }
  },

  // Change user password (admin function)
  async changeUserPassword(userId, newPassword) {
    try {
      const response = await api.post(
        API_ENDPOINTS.CHANGE_USER_PASSWORD(userId),
        { new_password: newPassword }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Đổi mật khẩu thất bại'
      };
    }
  }
};