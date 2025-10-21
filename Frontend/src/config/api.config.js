// export const API_BASE_URL = 'http://localhost:8000/api';
export const API_BASE_URL = 'https://autosocialbe.tmedu.vn/api';

export const API_ENDPOINTS = {
    // Auth - Updated for new authentication system
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    GET_CURRENT_USER: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',

    // Users - Updated for new user management
    USERS: '/users',
    USER_BY_ID: (id) => `/users/${id}`,
    CREATE_USER: '/users',
    UPDATE_USER: (id) => `/users/${id}`,
    DELETE_USER: (id) => `/users/${id}`,
    CHANGE_USER_PASSWORD: (id) => `/users/${id}/change-password`,

    // Platforms
    PLATFORMS: '/platforms',
    PLATFORM_BY_ID: (id) => `/platforms/${id}`,
    ACTIVE_PLATFORMS: '/platforms/active',

    // Pages
    PAGES: '/pages',
    PAGE_BY_ID: (id) => `/pages/${id}`,
    PAGE_BY_USER: (userId) => `/pages/user/${userId}`,
    PAGE_BY_PLATFORM: (platformId) => `/pages/platform/${platformId}`,
    UPDATE_PAGE_TOKEN: (id) => `/pages/${id}/token`,
    SYNC_FOLLOWERS: (id) => `/pages/${id}/sync-followers`,

    // Page Permissions
    PAGE_PERMISSIONS: '/page-permissions',
    PERMISSION_BY_ID: (id) => `/page-permissions/${id}`,
    USER_PAGES: (userId) => `/page-permissions/user/${userId}`,
    CHECK_PERMISSION: (userId, pageId) => `/page-permissions/check/${userId}/${pageId}`,

    // Templates
    TEMPLATES: '/templates',
    TEMPLATE_BY_ID: (id) => `/templates/${id}`,
    PUBLIC_TEMPLATES: '/templates/public',
    TEMPLATES_BY_CATEGORY: (category) => `/templates/category/${category}`,
    INCREMENT_TEMPLATE_USAGE: (id) => `/templates/${id}/increment-usage`,

    // Watermarks
    WATERMARKS: '/watermarks',
    WATERMARK_BY_ID: (id) => `/watermarks/${id}`,
    DEFAULT_WATERMARK: '/watermarks/default',

    // Media
    MEDIA: '/media',
    MEDIA_BY_ID: (id) => `/media/${id}`,
    MEDIA_BY_USER: (userId) => `/media/user/${userId}`,
    MEDIA_BY_TYPE: (type) => `/media/type/${type}`,
    UPLOAD_MEDIA: '/media/upload',
    MARK_PROCESSED: (id) => `/media/${id}/mark-processed`,

    // Hashtags
    HASHTAGS: '/hashtags',
    HASHTAG_BY_ID: (id) => `/hashtags/${id}`,
    POPULAR_HASHTAGS: '/hashtags/popular',
    SEARCH_HASHTAGS: '/hashtags/search',
    INCREMENT_HASHTAG_USAGE: (id) => `/hashtags/${id}/increment-usage`,

    // Posts
    POSTS: '/posts',
    POST_BY_ID: (id) => `/posts/${id}`,
    POST_BY_STATUS: (status) => `/posts/status/${status}`,
    POST_BY_PAGE: (pageId) => `/posts/page/${pageId}`,
    POST_BY_USER: (userId) => `/posts/user/${userId}`,
    SCHEDULED_POSTS: '/posts/scheduled',
    POSTS_WITH_ANALYTICS: '/posts/with-analytics',
    PUBLISH_POST: (id) => `/posts/${id}/publish`,
    SCHEDULE_POST: (id) => `/posts/${id}/schedule`,
    UPDATE_POST_STATUS: (id) => `/posts/${id}/status`,

    // Post Media
    POST_MEDIA: '/post-media',
    POST_MEDIA_BY_POST: (postId) => `/post-media/post/${postId}`,
    ADD_MEDIA_TO_POST: '/post-media/add',
    REORDER_MEDIA: '/post-media/reorder',

    // Post Hashtags
    POST_HASHTAGS: '/post-hashtags',
    POST_HASHTAGS_BY_POST: (postId) => `/post-hashtags/post/${postId}`,
    ADD_HASHTAGS_TO_POST: '/post-hashtags/add',
    REMOVE_HASHTAG_FROM_POST: '/post-hashtags/remove',

    // Analytics
    POST_ANALYTICS: (postId) => `/analytics/posts/${postId}`,
    DASHBOARD_STATS: '/analytics/dashboard',
    TOP_POSTS: '/analytics/top-posts',
    UPDATE_METRICS: (postId) => `/analytics/posts/${postId}/metrics`,
    CALCULATE_ENGAGEMENT: (postId) => `/analytics/posts/${postId}/engagement`,

    // AI Assistant
    AI: '/ai',
    AI_GENERATE: '/ai/generate',
    AI_SUGGESTIONS: '/ai/suggestions',
    AI_CHAT: '/ai/chat',
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500,
};

// Timeout configurations (in milliseconds)
export const REQUEST_TIMEOUT = 0; // 30 seconds (default)
export const UPLOAD_TIMEOUT = 120000; // 2 minutes (for file uploads)
export const POST_CREATION_TIMEOUT = 300000; // 5 minutes (for creating posts - can take long with multiple platforms)
