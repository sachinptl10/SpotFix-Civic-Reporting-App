import api from './api';

export const notificationService = {
  /**
   * Get paginated notifications for current citizen
   */
  async getNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    return await api.get(endpoint);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    return await api.get('/notifications/unread-count');
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    return await api.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    return await api.patch('/notifications/read-all');
  },
};

export default notificationService;
