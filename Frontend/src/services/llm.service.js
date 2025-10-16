import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const llmService = {
    async getAll(params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.AI}/llm?${queryParams}`);
    },

    async getById(id) {
        return await apiClient.get(`${API_ENDPOINTS.AI}/llm/${id}`);
    },

    async create(data) {
        return await apiClient.post(`${API_ENDPOINTS.AI}/llm`, data);
    },

    async update(id, data) {
        return await apiClient.put(`${API_ENDPOINTS.AI}/llm/${id}`, data);
    },

    async delete(id) {
        return await apiClient.delete(`${API_ENDPOINTS.AI}/llm/${id}`);
    },
};
