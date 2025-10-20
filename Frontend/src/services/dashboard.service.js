import { API_BASE_URL } from '../config/api.config';

export const dashboardService = {
    async getStats() {
        const response = await fetch(`${API_BASE_URL}/analytics/dashboard-stats`, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }

        return response.json();
    }
};
