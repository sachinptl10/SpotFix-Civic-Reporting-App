import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch unread count for badge
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || user?.role === 'government') return;
    try {
      const res = await notificationService.getUnreadCount();
      if (res && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch (err) {
      // Silently ignore background badge errors
    }
  }, [isAuthenticated, user?.role]);

  // Fetch notification list
  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      if (!isAuthenticated || user?.role === 'government') return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await notificationService.getNotifications({ page: 1, limit: 20 });
        if (res && res.notifications) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount || 0);
          setPage(1);
          setHasMore(Boolean(res.hasMore));
        }
      } catch (err) {
        console.warn('[NotificationContext] Fetch error:', err.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, user?.role]
  );

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('[NotificationContext] Mark read error:', err.message);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[NotificationContext] Mark all read error:', err.message);
    }
  }, []);

  // Sync on auth and app foreground transition
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'government') {
      fetchUnreadCount();
      fetchNotifications();

      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          fetchUnreadCount();
        }
      });

      return () => {
        subscription.remove();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.role, fetchUnreadCount, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isRefreshing,
        hasMore,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
