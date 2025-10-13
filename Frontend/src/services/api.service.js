import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../config/api.config';
import toast from 'react-hot-toast';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Return data directly from successful responses
    return response.data;
  },
  (error) => {
    // Handle errors
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Handle specific status codes
    if (status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    } else if (status === 403) {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
    } else if (status === 404) {
      toast.error('Không tìm thấy tài nguyên.');
    } else if (status === 500) {
      toast.error('Lỗi máy chủ. Vui lòng thử lại sau.');
    } else if (message) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
