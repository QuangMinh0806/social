import apiClient from './api.service';

export const youtubeService = {
  /**
   * Upload video to YouTube using URL
   */
  async uploadVideo(data) {
    console.log('YouTube service - uploading video with data:', data);
    console.log('Calling API: POST /youtube/upload');
    return await apiClient.post('/youtube/upload', data, {
      timeout: 0 // No timeout for video upload
    });
  },

  /**
   * Upload video file to YouTube
   */
  async uploadVideoFile(formData) {
    console.log('YouTube service - uploading video file');
    console.log('Calling API: POST /youtube/upload-file');
    return await apiClient.post('/youtube/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 0 // No timeout for video upload
    });
  },

  /**
   * Get YouTube pages for user
   */
  async getPages(userId) {
    return await apiClient.get(`/pages/user/${userId}`);
  }
};