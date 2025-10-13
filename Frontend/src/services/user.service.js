    import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const userService = {
  async login(credentials) {
    return await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
  },

  async getAll(params = {}) {
    const { skip = 0, limit = 100, search, role, status } = params;
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    
    if (search) {
      queryParams.append('search', search);
    }
    if (role && role !== 'all') {
      queryParams.append('role', role);
    }
    if (status && status !== 'all') {
      queryParams.append('status', status);
    }
    
    return await apiClient.get(`${API_ENDPOINTS.USERS}?${queryParams}`);
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.USER_BY_ID(id));
  },

  async getByEmail(email) {
    return await apiClient.get(API_ENDPOINTS.USER_BY_EMAIL(email));
  },

  async create(data) {
    return await apiClient.post(API_ENDPOINTS.USERS, data);
  },

  async update(id, data) {
    return await apiClient.put(API_ENDPOINTS.USER_BY_ID(id), data);
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.USER_BY_ID(id));
  },

  async updateLastLogin(id) {
    return await apiClient.patch(API_ENDPOINTS.UPDATE_LAST_LOGIN(id));
  },
};
