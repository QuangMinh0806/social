export const POST_STATUS = {
  draft: 'Nháp',
  scheduled: 'Đã lên lịch',
  publishing: 'Đang đăng',
  published: 'Đã đăng',
  failed: 'Thất bại',
  deleted: 'Đã xóa',
};

export const POST_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  CAROUSEL: 'carousel',
  STORY: 'story',
};

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ROOT: 'root'
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

export const PAGE_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

export const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  GIF: 'gif',
};

export const PLATFORMS = {
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  TWITTER: 'Twitter',
};

export const WATERMARK_POSITIONS = {
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  CENTER: 'center',
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  
  // Posts
  POSTS: '/posts',
  POST_CREATE: '/posts/create',
  POST_EDIT: (id) => `/posts/${id}/edit`,
  POST_DETAIL: (id) => `/posts/${id}`,
  
  // Calendar
  CALENDAR: '/calendar',
  
  // Pages
  PAGES: '/pages',
  PAGE_CREATE: '/pages/create',
  PAGE_DETAIL: (id) => `/pages/${id}`,
  
  // Employees
  EMPLOYEES: '/employees',
  EMPLOYEE_CREATE: '/employees/create',
  EMPLOYEE_DETAIL: (id) => `/employees/${id}`,
  
  // Templates
  TEMPLATES: '/templates',
  TEMPLATE_CREATE: '/templates/create',
  TEMPLATE_DETAIL: (id) => `/templates/${id}`,
  
  // Media
  MEDIA: '/media',
  
  // Analytics
  ANALYTICS: '/analytics',
  
  // AI Assistant
  AI_ASSISTANT: '/ai-assistant',
  
  // Config
  CONFIG: '/config',
  
  // Settings
  SETTINGS: '/settings',
  PROFILE: '/profile',
  
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Error
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
};

export const PAGINATION = {
  DEFAULT_SKIP: 0,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const DATE_FORMATS = {
  FULL: 'dd/MM/yyyy HH:mm:ss',
  DATE_ONLY: 'dd/MM/yyyy',
  TIME_ONLY: 'HH:mm',
  SHORT: 'dd/MM/yyyy HH:mm',
};

export const FILE_UPLOAD = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mpeg', 'video/quicktime'],
};

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 3000,
  WARNING: 4000,
};
