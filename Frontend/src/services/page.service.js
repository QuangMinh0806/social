import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const pageService = {
    async getAll(params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.PAGES}?${queryParams}`);
    },

    async getById(id) {
        return await apiClient.get(API_ENDPOINTS.PAGE_BY_ID(id));
    },

    async getByUser(userId, params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.PAGE_BY_USER(userId)}?${queryParams}`);
    },

    async getByPlatform(platformId, params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.PAGE_BY_PLATFORM(platformId)}?${queryParams}`);
    },

    async create(data) {
        return await apiClient.post(API_ENDPOINTS.PAGES, data);
    },

    async update(id, data) {
        return await apiClient.put(API_ENDPOINTS.PAGE_BY_ID(id), data);
    },

    async delete(id) {
        return await apiClient.delete(API_ENDPOINTS.PAGE_BY_ID(id));
    },

    async updateToken(id, accessToken, expiresAt) {
        return await apiClient.patch(API_ENDPOINTS.UPDATE_PAGE_TOKEN(id), {
            access_token: accessToken,
            token_expires_at: expiresAt,
        });
    },

    async syncFollowers(id, followerCount) {
        return await apiClient.patch(API_ENDPOINTS.SYNC_FOLLOWERS(id), {
            follower_count: followerCount,
        });
    },
};
