import { useState, useEffect, useCallback } from 'react';
import { 
  fetchNotifications, 
  getUnreadNotificationsCount, 
  markNotificationSeen, 
  markAllNotificationsSeen,
  Notification,
  NotificationPagination
} from '@/utils/notificationApi';
import { toast } from 'sonner';

interface NotificationsState {
  loading: boolean;
  loadingMore: boolean;
  notifications: Notification[];
  pagination: NotificationPagination;
  unreadCount: number;
}

interface UseNotificationsReturn extends NotificationsState {
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsSeen: (id: number) => Promise<void>;
  markAllAsSeen: () => Promise<void>;
}

/**
 * Hook for managing notifications
 * Provides functions for loading, marking as read, and pagination
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [state, setState] = useState<NotificationsState>({
    loading: true,
    loadingMore: false,
    notifications: [],
    pagination: { total: 0, offset: 0, limit: 10, has_more: false },
    unreadCount: 0
  });

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationsCount();
      setState(prev => ({ ...prev, unreadCount: count }));
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Initial data fetch
  const refreshNotifications = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetchNotifications(0, state.pagination.limit);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          notifications: response.notifications,
          pagination: response.pagination
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
        toast.error('Failed to load notifications.');
      }
      
      // Refresh unread count after fetching notifications
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setState(prev => ({ ...prev, loading: false }));
      toast.error('Failed to load notifications. Please try again.');
    }
  }, [fetchUnreadCount, state.pagination.limit]);

  // Load more notifications for pagination
  const loadMoreNotifications = useCallback(async () => {
    // Check if we have more to load and that we're not already loading
    if (!state.pagination.has_more || state.loadingMore) {
      return;
    }
    
    setState(prev => ({ ...prev, loadingMore: true }));
    
    try {
      const nextOffset = state.pagination.offset + state.pagination.limit;
      const response = await fetchNotifications(nextOffset, state.pagination.limit);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          loadingMore: false,
          notifications: [...prev.notifications, ...response.notifications],
          pagination: response.pagination
        }));
      } else {
        setState(prev => ({ ...prev, loadingMore: false }));
        toast.error('Failed to load more notifications.');
      }
    } catch (error) {
      console.error('Error loading more notifications:', error);
      setState(prev => ({ ...prev, loadingMore: false }));
    }
  }, [
    state.loadingMore, 
    state.pagination.has_more,
    state.pagination.limit,
    state.pagination.offset,
    state.notifications
  ]);

  // Mark notification as seen
  const markAsSeen = useCallback(async (id: number) => {
    try {
      const response = await markNotificationSeen(id);
      
      if (response.success) {
        // Update local state to mark this notification as seen
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification =>
            notification.id === id ? { ...notification, seen: true } : notification
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
      }
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  }, []);

  // Mark all notifications as seen
  const markAllAsSeen = useCallback(async () => {
    try {
      const response = await markAllNotificationsSeen();
      
      if (response.success) {
        // Update all local notifications to be seen
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification => ({ ...notification, seen: true })),
          unreadCount: 0
        }));
        
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
      toast.error('Failed to mark notifications as read');
    }
  }, []);

  // Initial data fetch on mount
  useEffect(() => {
    refreshNotifications();
    
    // Set up an interval to refresh unread count every minute if user is logged in
    const userId = localStorage.getItem('dapps_user_id');
    if (userId) {
      const interval = setInterval(fetchUnreadCount, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [refreshNotifications, fetchUnreadCount]);

  return {
    ...state,
    refreshNotifications,
    loadMoreNotifications,
    markAsSeen,
    markAllAsSeen
  };
}; 