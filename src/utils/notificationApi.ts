import { toast } from 'sonner';
import { createAuthHeaders } from './apiBase';

/**
 * Notification type enum
 */
export type NotificationType = 'roar' | 'reply' | 'tag' | 'share' | 'reward' | 'community' | 'system' | 'mirror';

/**
 * Interface for notification data
 */
export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  url: string;
  seen: boolean;
  date: string;
  image?: string; // Optional image (e.g. user avatar or community image)
}

/**
 * Interface for notification pagination
 */
export interface NotificationPagination {
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

/**
 * Interface for notification API response
 */
export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  pagination: NotificationPagination;
}

/**
 * Interface for unread notification count response
 */
export interface UnreadNotificationCountResponse {
  success: boolean;
  count: number;
}

/**
 * Interface for mark notification as seen response
 */
export interface MarkNotificationResponse {
  success: boolean;
  message: string;
  count?: number;
}

/**
 * Fetch notifications with pagination
 * @param offset Pagination offset
 * @param limit Number of notifications to fetch
 * @returns Notification response with pagination
 */
export const fetchNotifications = async (
  offset: number = 0, 
  limit: number = 10
): Promise<NotificationResponse> => {
  try {
    console.log(`Fetching notifications with offset ${offset}, limit ${limit}`);
    
    const response = await fetch(
      `/api/get_notifications?offset=${offset}&limit=${limit}`,
      {
        method: 'GET',
        headers: createAuthHeaders(),
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch notifications:', errorText);
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { 
      success: false, 
      notifications: [], 
      pagination: { total: 0, offset, limit, has_more: false } 
    };
  }
};

/**
 * Get count of unread notifications
 * @returns Count of unread notifications
 */
export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    console.log(`Fetching unread notification count`);
    
    const response = await fetch(
      `/api/get_unread_notifications_count`,
      {
        method: 'GET',
        headers: createAuthHeaders(),
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch unread notification count:', errorText);
      return 0;
    }
    
    const data: UnreadNotificationCountResponse = await response.json();
    
    return data.success ? data.count : 0;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
};

/**
 * Mark a specific notification as seen
 * @param id Notification ID
 * @returns Success status and message
 */
export const markNotificationSeen = async (id: number): Promise<MarkNotificationResponse> => {
  try {
    console.log(`Marking notification ${id} as seen`);
    
    const response = await fetch(
      `/api/mark_notification_seen`,
      {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({ id }),
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to mark notification as seen:', errorText);
      return { success: false, message: 'Failed to update notification' };
    }
    
    const data: MarkNotificationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking notification as seen:', error);
    return { success: false, message: 'An error occurred' };
  }
};

/**
 * Mark all notifications as seen
 * @returns Success status, message and count of updated notifications
 */
export const markAllNotificationsSeen = async (): Promise<MarkNotificationResponse> => {
  try {
    console.log(`Marking all notifications as seen`);
    
    const response = await fetch(
      `/api/mark_all_notifications_seen`,
      {
        method: 'POST',
        headers: createAuthHeaders(),
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to mark all notifications as seen:', errorText);
      return { success: false, message: 'Failed to update notifications' };
    }
    
    const data: MarkNotificationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking all notifications as seen:', error);
    return { success: false, message: 'An error occurred' };
  }
}; 