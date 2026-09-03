import { SERVER_HOST } from './constants';

/**
 * Format timestamp into human-readable date & time
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }

  // Older dates: format like "Sep 3, 2024"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Resolve full image URL whether it's a local file URI or server relative URL
 */
export const getImageUrl = (url) => {
  if (!url) return null;

  // Local file URI or remote http/https already complete
  if (url.startsWith('file://') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative path from backend (e.g. /uploads/image.jpg)
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${SERVER_HOST}${cleanPath}`;
};

/**
 * Truncate long strings cleanly
 */
export const truncateText = (text, maxLength = 80) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * Get two-letter initials from user's full name
 */
export const getUserInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Extract clean, friendly error message from API response or Error object
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  if (error.response && error.response.message) {
    return error.response.message;
  }

  if (error.message) {
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      return 'Unable to reach the SpotFix server. Please check your internet connection or server status.';
    }
    return error.message;
  }

  return fallback;
};
