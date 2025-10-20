import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config.js';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
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

// Add response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
      console.log('Login response:', API_ENDPOINTS.LOGIN);
      const { access_token, user } = response.data;
      
      // Store token and user info
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Đăng nhập thất bại'
      };
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.REGISTER, userData);
      const { access_token, user } = response.data;
      
      // Store token and user info
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Đăng ký thất bại'
      };
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  },

  // Get current user info
  async getCurrentUser() {
    try {
      const response = await api.get(API_ENDPOINTS.GET_CURRENT_USER);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Không thể lấy thông tin user'
      };
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.post(API_ENDPOINTS.CHANGE_PASSWORD, passwordData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Đổi mật khẩu thất bại'
      };
    }
  },

  // Create new user (admin only)
  async createUser(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.CREATE_USER, userData);
      const statusCode = response.status;
      return { success: true, data: response.data, statusCode };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Tạo user thất bại'
      };
    }
  },

  // Check if user is logged in
  isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    return !!(token && user);
  },

  // Get stored user info
  getStoredUser() {
    const userStr = localStorage.getItem('auth_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Get stored token
  getStoredToken() {
    return localStorage.getItem('auth_token');
  },

  // Check if user has specific role
  hasRole(role) {
    const user = this.getStoredUser();
    return user?.role === role;
  }
};

export default api;