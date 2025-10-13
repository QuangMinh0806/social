import apiClient from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const mediaService = {
    async getAll(params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.MEDIA}?${queryParams}`);
    },

    async getById(id) {
        return await apiClient.get(API_ENDPOINTS.MEDIA_BY_ID(id));
    },

    async getByUser(userId, params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.MEDIA_BY_USER(userId)}?${queryParams}`);
    },

    async getByType(type, params = {}) {
        const { skip = 0, limit = 100 } = params;
        const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        return await apiClient.get(`${API_ENDPOINTS.MEDIA_BY_TYPE(type)}?${queryParams}`);
    },

    async upload(formData) {
        return await apiClient.post(API_ENDPOINTS.UPLOAD_MEDIA, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    async uploadMultiple(formData) {
        return await apiClient.post(`${API_ENDPOINTS.MEDIA}/upload/multiple`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    async create(data) {
        return await apiClient.post(API_ENDPOINTS.MEDIA, data);
    },

    async update(id, data) {
        return await apiClient.put(API_ENDPOINTS.MEDIA_BY_ID(id), data);
    },

    async delete(id) {
        return await apiClient.delete(API_ENDPOINTS.MEDIA_BY_ID(id));
    },

    async markAsProcessed(id) {
        return await apiClient.patch(API_ENDPOINTS.MARK_PROCESSED(id));
    },
};
