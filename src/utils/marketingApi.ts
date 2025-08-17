// Marketing Notifications API Utilities
// Admin-only access for UIDs 1, 2, 3

import { toast } from 'sonner';

// 🔑 API Configuration
const API_BASE = '/api/marketing_notifications';

// 📊 TypeScript Interfaces
export interface MarketingUser {
  id: number;
  handle: string;
  avatar?: string;
  device_count: number;
  enabled_notification_types: string[];
  max_notifications_per_hour: number;
  last_active: string;
  devices?: {
    device_type: string;
    device_model: string;
    last_active: string;
  }[];
}

export interface MarketingUsersResponse {
  success: boolean;
  users: MarketingUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total_users_with_notifications: number;
  };
}

export interface SendNotificationRequest {
  title: string;
  message: string;
  url?: string;
  target_type: 'single' | 'multiple' | 'all';
  target_user_ids?: number[];
  notes?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  campaign_id: string;
  results: {
    total_targeted: number;
    total_sent: number;
    total_failed: number;
    success_rate: string;
  };
  message: string;
}

export interface Campaign {
  id: number;
  campaign_id: string;
  title: string;
  message: string;
  url?: string;
  target_type: 'single' | 'multiple' | 'all';
  total_targeted: number;
  total_sent: number;
  total_failed: number;
  success_rate: string;
  status: 'draft' | 'sending' | 'completed' | 'failed' | 'cancelled';
  sent_by_uid: number;
  sent_by_handle: string;
  sent_at: string;
  notes?: string;
  created_at: string;
}

export interface CampaignHistoryResponse {
  success: boolean;
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total_campaigns: number;
    total_users_targeted: number;
    total_notifications_sent: number;
    total_notifications_failed: number;
    average_success_rate: string;
  };
}

export interface NotificationTemplate {
  id: number;
  name: string;
  title: string;
  message: string;
  url_template?: string;
  category: string;
  is_active: boolean;
  created_by_handle: string;
}

export interface TemplatesResponse {
  success: boolean;
  templates: NotificationTemplate[];
  summary: {
    total_templates: number;
    active_templates: number;
    categories: string[];
  };
}

// 🔑 Admin Authentication Utilities
export const checkAdminAccess = (): boolean => {
  const userId = localStorage.getItem('dapps_user_id');
  const userIdNum = userId ? parseInt(userId) : null;
  
  if (!userIdNum || ![1, 2, 3].includes(userIdNum)) {
    console.warn('Marketing admin access denied. User ID not in [1, 2, 3]');
    return false;
  }
  
  return true;
};

export const getAdminUserKey = async (): Promise<string | null> => {
  try {
    // First check if we have admin access
    if (!checkAdminAccess()) {
      toast.error('Admin access required for marketing notifications');
      return null;
    }

    // Get or create user API key for admin functionality
    const response = await fetch('/api/get_user_key', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user key: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.userKey) {
      return data.userKey;
    } else {
      throw new Error('Failed to retrieve user key');
    }
  } catch (error) {
    console.error('Error getting admin user key:', error);
    toast.error('Failed to get admin authentication key');
    return null;
  }
};

// 🛠️ API Functions

export const getMarketingUsers = async (options: {
  page?: number;
  limit?: number;
  include_devices?: boolean;
} = {}): Promise<MarketingUsersResponse | null> => {
  try {
    if (!checkAdminAccess()) return null;
    
    const userKey = await getAdminUserKey();
    if (!userKey) return null;

    const { page = 1, limit = 50, include_devices = false } = options;
    const url = `${API_BASE}/users?page=${page}&limit=${limit}&include_devices=${include_devices}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        toast.error('Admin access required for marketing notifications');
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching marketing users:', error);
    toast.error('Failed to load users');
    return null;
  }
};

export const sendMarketingNotification = async (
  request: SendNotificationRequest
): Promise<SendNotificationResponse | null> => {
  try {
    if (!checkAdminAccess()) return null;
    
    const userKey = await getAdminUserKey();
    if (!userKey) return null;

    const response = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 403) {
        toast.error('Admin access required for marketing notifications');
        return null;
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      toast.success(`Campaign sent successfully! ${data.results.total_sent} notifications delivered.`);
    } else {
      toast.error('Failed to send campaign');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending marketing notification:', error);
    toast.error('Failed to send notification');
    return null;
  }
};

export const getCampaignHistory = async (options: {
  page?: number;
  limit?: number;
  status?: string;
  sent_by?: number;
} = {}): Promise<CampaignHistoryResponse | null> => {
  try {
    if (!checkAdminAccess()) return null;
    
    const userKey = await getAdminUserKey();
    if (!userKey) return null;

    const { page = 1, limit = 20, status = 'all', sent_by } = options;
    let url = `${API_BASE}/history?page=${page}&limit=${limit}&status=${status}`;
    if (sent_by) {
      url += `&sent_by=${sent_by}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        toast.error('Admin access required for marketing notifications');
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching campaign history:', error);
    toast.error('Failed to load campaign history');
    return null;
  }
};

export const getNotificationTemplates = async (options: {
  category?: string;
  active?: boolean;
} = {}): Promise<TemplatesResponse | null> => {
  try {
    if (!checkAdminAccess()) return null;
    
    const userKey = await getAdminUserKey();
    if (!userKey) return null;

    const { category = 'all', active = true } = options;
    const url = `${API_BASE}/templates?category=${category}&active=${active}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        toast.error('Admin access required for marketing notifications');
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    toast.error('Failed to load templates');
    return null;
  }
};

// 🎯 Helper Functions
export const formatSuccessRate = (rate: string): string => {
  const numRate = parseFloat(rate);
  return numRate >= 95 ? '🟢' : numRate >= 90 ? '🟡' : '🔴';
};

export const formatTargetType = (type: string): string => {
  switch (type) {
    case 'single': return '👤 Single User';
    case 'multiple': return '👥 Multiple Users';
    case 'all': return '🌍 All Users';
    default: return type;
  }
};

export const formatCampaignStatus = (status: string): string => {
  switch (status) {
    case 'completed': return '✅ Completed';
    case 'sending': return '🚀 Sending';
    case 'failed': return '❌ Failed';
    case 'cancelled': return '⚠️ Cancelled';
    case 'draft': return '📝 Draft';
    default: return status;
  }
};

export default {
  checkAdminAccess,
  getAdminUserKey,
  getMarketingUsers,
  sendMarketingNotification,
  getCampaignHistory,
  getNotificationTemplates,
  formatSuccessRate,
  formatTargetType,
  formatCampaignStatus,
}; 