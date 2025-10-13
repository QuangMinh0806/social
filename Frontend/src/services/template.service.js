import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const templateService = {
    async getAll(params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.TEMPLATES}?${queryParams}`);
    },

    async getById(id) {
        return await apiClient.get(API_ENDPOINTS.TEMPLATE_BY_ID(id));
    },

    async getPublic(params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.PUBLIC_TEMPLATES}?${queryParams}`);
    },

    async getByCategory(category, params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.TEMPLATES_BY_CATEGORY(category)}?${queryParams}`);
    },

    async create(data) {
        return await apiClient.post(API_ENDPOINTS.TEMPLATES, data);
    },

    async update(id, data) {
        return await apiClient.put(API_ENDPOINTS.TEMPLATE_BY_ID(id), data);
    },

    async delete(id) {
        return await apiClient.delete(API_ENDPOINTS.TEMPLATE_BY_ID(id));
    },

    async incrementUsage(id) {
        return await apiClient.patch(API_ENDPOINTS.INCREMENT_TEMPLATE_USAGE(id));
    },
};
