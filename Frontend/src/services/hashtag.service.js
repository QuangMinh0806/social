import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';
export const hashtagService = {
  async getAll(params = {}) {
    const { skip = 0, limit = 100 } = params;
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    return await apiClient.get(`${API_ENDPOINTS.HASHTAGS}?${queryParams}`);
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.HASHTAG_BY_ID(id));
  },

  async getPopular(limit = 50) {
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    return await apiClient.get(`${API_ENDPOINTS.POPULAR_HASHTAGS}?${queryParams}`);
  },

  async search(searchTerm, limit = 50) {
    const queryParams = new URLSearchParams({ 
      q: searchTerm,
      limit: limit.toString() 
    });
    return await apiClient.get(`${API_ENDPOINTS.SEARCH_HASHTAGS}?${queryParams}`);
  },

  async create(data) {
    return await apiClient.post(API_ENDPOINTS.HASHTAGS, data);
  },

  async update(id, data) {
    return await apiClient.put(API_ENDPOINTS.HASHTAG_BY_ID(id), data);
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.HASHTAG_BY_ID(id));
  },

  async incrementUsage(id) {
    return await apiClient.patch(API_ENDPOINTS.INCREMENT_HASHTAG_USAGE(id));
  },
};
