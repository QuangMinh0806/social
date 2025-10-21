// api.service.js
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config.js';
import toast from 'react-hot-toast';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor thêm token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor xử lý lỗi 401
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    return Promise.reject(error);
  }
);

// === Phần AuthService gộp vào ===
export const authService = {
  login: async (credentials) => {
    try {
      const data = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.detail || 'Đăng nhập thất bại' };
    }
  },

  register: async (userData) => {
    try {
      const data = await apiClient.post(API_ENDPOINTS.REGISTER, userData);
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.detail || 'Đăng ký thất bại' };
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  },

  getCurrentUser: async () => {
    try {
      const data = await apiClient.get(API_ENDPOINTS.GET_CURRENT_USER);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.detail || 'Không thể lấy thông tin user' };
    }
  },

  changePassword: async (passwordData) => {
    try {
      const data = await apiClient.post(API_ENDPOINTS.CHANGE_PASSWORD, passwordData);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.detail || 'Đổi mật khẩu thất bại' };
    }
  },
};

export default apiClient;
