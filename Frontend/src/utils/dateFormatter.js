/**
 * Format date to Vietnamese locale
 */
export const formatDate = (dateString, format = 'full') => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  const formats = {
    full: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
    },
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  };
  
  return new Intl.DateTimeFormat('vi-VN', formats[format] || formats.full).format(date);
};

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
  
  return formatDate(dateString, 'short');
};

/**
 * Format date for input datetime-local
 */
export const formatForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Check if date is in the past
 */
export const isPast = (dateString) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

/**
 * Check if date is today
 */
export const isToday = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};
