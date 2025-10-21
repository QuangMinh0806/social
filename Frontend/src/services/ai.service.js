import apiClient from './api.service';

const aiService = {
  /**
   * Generate content using AI based on topic
   * @param {string} topic - The topic to generate content for
   * @returns {Promise<{content: string}>}
   */
  generateContent: async (topic) => {
    try {
      // apiService already returns response.data in interceptor
      const data = await apiClient.post('/ai/generate-content', { topic });
      return data;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  },

  /**
   * Generate hashtags using AI based on topic
   * @param {string} topic - The topic to generate hashtags for
   * @returns {Promise<{hashtags: string}>}
   */
  generateHashtags: async (topic) => {
    try {
      // apiService already returns response.data in interceptor
      const data = await apiClient.post('/ai/generate-hashtags', { topic });
      return data;
    } catch (error) {
      console.error('Error generating hashtags:', error);
      throw error;
    }
  }
};

export default aiService;
