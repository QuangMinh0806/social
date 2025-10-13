import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const watermarkService = {
  async getAll(params = {}) {
    const { skip = 0, limit = 100 } = params;
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    return await apiClient.get(`${API_ENDPOINTS.WATERMARKS}?${queryParams}`);
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.WATERMARK_BY_ID(id));
  },

  async getDefault() {
    return await apiClient.get(API_ENDPOINTS.DEFAULT_WATERMARK);
  },

  async create(data) {
    return await apiClient.post(API_ENDPOINTS.WATERMARKS, data);
  },

  async update(id, data) {
    return await apiClient.put(API_ENDPOINTS.WATERMARK_BY_ID(id), data);
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.WATERMARK_BY_ID(id));
  },
};
