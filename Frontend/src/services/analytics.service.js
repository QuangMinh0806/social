import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const analyticsService = {
  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    return await apiClient.get(API_ENDPOINTS.DASHBOARD_STATS);
  },

  /**
   * Get post analytics by ID
   */
  async getPostAnalytics(postId) {
    return await apiClient.get(API_ENDPOINTS.POST_ANALYTICS(postId));
  },

  /**
   * Get top performing posts
   */
  async getTopPosts(params = {}) {
    const { limit = 10, metric = 'engagement_rate' } = params;
    const queryParams = new URLSearchParams({ 
      limit: limit.toString(),
      metric 
    });
    return await apiClient.get(`${API_ENDPOINTS.TOP_POSTS}?${queryParams}`);
  },

  /**
   * Update post metrics
   */
  async updateMetrics(postId, metrics) {
    return await apiClient.put(API_ENDPOINTS.UPDATE_METRICS(postId), metrics);
  },

  /**
   * Calculate engagement rate
   */
  async calculateEngagement(postId) {
    return await apiClient.post(API_ENDPOINTS.CALCULATE_ENGAGEMENT(postId));
  },
};
