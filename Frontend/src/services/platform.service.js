import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const platformService = {
    async getAll(params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.PLATFORMS}?${queryParams}`);
    },

    async getById(id) {
        return await apiClient.get(API_ENDPOINTS.PLATFORM_BY_ID(id));
    },

    async getActive() {
        return await apiClient.get(API_ENDPOINTS.ACTIVE_PLATFORMS);

    },

    async create(data) {
        return await apiClient.post(API_ENDPOINTS.PLATFORMS, data);
    },

    async update(id, data) {
        return await apiClient.put(API_ENDPOINTS.PLATFORM_BY_ID(id), data);
    },

    async delete(id) {
        return await apiClient.delete(API_ENDPOINTS.PLATFORM_BY_ID(id));
    },
};
