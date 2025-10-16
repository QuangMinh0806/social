import apiClient from './api.service';
import { API_ENDPOINTS, POST_CREATION_TIMEOUT } from '../config/api.config';

export const postService = {
  /**
   * Get all posts with filters
   */
  async getAll(params = {}) {
    const { skip = 0, limit = 20, status = null, page_id = null, user_id = null } = params;
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    
    if (status) queryParams.append('status', status);
    if (page_id) queryParams.append('page_id', page_id.toString());
    if (user_id) queryParams.append('user_id', user_id.toString());
    
    return await apiClient.get(`${API_ENDPOINTS.POSTS}?${queryParams}`);
  },

  /**
   * Get post by ID
   */
  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.POST_BY_ID(id));
  },

  /**
   * Get posts by status
   */
  async getByStatus(status, params = {}) {
    const { skip = 0, limit = 20 } = params;
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    return await apiClient.get(`${API_ENDPOINTS.POST_BY_STATUS(status)}?${queryParams}`);
  },

  /**
   * Get posts by page
   */
  async getByPage(pageId, params = {}) {
    const { skip = 0, limit = 20 } = params;
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    return await apiClient.get(`${API_ENDPOINTS.POST_BY_PAGE(pageId)}?${queryParams}`);
  },

  /**
   * Get scheduled posts
   */
  async getScheduled(params = {}) {
    const { skip = 0, limit = 20 } = params;
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    return await apiClient.get(`${API_ENDPOINTS.SCHEDULED_POSTS}?${queryParams}`);
  },

  /**
   * Get posts with analytics
   */
  async getWithAnalytics(params = {}) {
    const { skip = 0, limit = 20 } = params;
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    return await apiClient.get(`${API_ENDPOINTS.POSTS_WITH_ANALYTICS}?${queryParams}`);
  },

  /**
   * Create new post
   * Supports both JSON and FormData (for file uploads)
   * Uses extended timeout for multi-platform posting
   */
  async create(data) {
    // Nếu data là FormData, gửi trực tiếp với timeout dài hơn
    if (data instanceof FormData) {
      return await apiClient.post(API_ENDPOINTS.POSTS, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: POST_CREATION_TIMEOUT // 5 phút cho việc đăng nhiều platform
      });
    }
    
    // Nếu data là object thông thường, gửi JSON với timeout dài
    return await apiClient.post(API_ENDPOINTS.POSTS, data, {
      timeout: POST_CREATION_TIMEOUT
    });
  },

  /**
   * Update post
   */
  async update(id, data) {
    return await apiClient.put(API_ENDPOINTS.POST_BY_ID(id), data);
  },

  /**
   * Delete post
   */
  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.POST_BY_ID(id));
  },

  /**
   * Publish post
   */
  async publish(id, data) {
    return await apiClient.post(API_ENDPOINTS.PUBLISH_POST(id), data);
  },

  /**
   * Schedule post
   */
  async schedule(id, scheduledAt) {
    return await apiClient.post(API_ENDPOINTS.SCHEDULE_POST(id), {
      scheduled_at: scheduledAt,
    });
  },

  /**
   * Update post status
   */
  async updateStatus(id, status) {
    return await apiClient.patch(API_ENDPOINTS.UPDATE_POST_STATUS(id), {
      status,
    });
  },
};
