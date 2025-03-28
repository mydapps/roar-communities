
import { toast } from 'sonner';
import { CommentReply } from '@/components/post/EnhancedCommentItem';

// Base API URL
const API_BASE_URL = 'https://api.dapps.co';

export { CommentReply };

export interface RepliesResponse {
  success: boolean;
  post_code: string;
  community: string;
  total_count: number;
  displayed_count: number;
  replies: CommentReply[];
}

export interface MeowResponse {
  success: boolean;
  message: string;
  action: string;
  reply_id: number;
  meow_count: number;
}

export interface CreateReplyResponse {
  success: boolean;
  message: string;
  reply_id: number;
  post_code: string;
  parent_id: number;
  created_on: string;
  handle: string;
  avatar_url: string;
}

/**
 * Fetch replies for a post
 */
export const fetchReplies = async (postCode: string, limit: number = 3): Promise<RepliesResponse> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found for fetching replies');
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/get_replies?postCode=${postCode}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch replies: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching replies:', error);
    toast.error('Could not load comments. Please try again later.');
    return {
      success: false,
      post_code: postCode,
      community: '',
      total_count: 0,
      displayed_count: 0,
      replies: []
    };
  }
};

/**
 * Toggle meow for a reply
 */
export const toggleMeow = async (replyId: number): Promise<MeowResponse> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found for meowing');
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/meow_reply`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ replyId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to toggle meow: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error toggling meow:', error);
    toast.error('Could not update meow. Please try again later.');
    return {
      success: false,
      message: 'Failed to update meow',
      action: 'error',
      reply_id: replyId,
      meow_count: 0
    };
  }
};

/**
 * Create a new reply for a post
 */
export const createReply = async (postCode: string, content: string, parentId?: number): Promise<CreateReplyResponse> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found for creating reply');
      throw new Error('Authentication required');
    }
    
    const payload: any = {
      postCode,
      content
    };
    
    if (parentId) {
      payload.parentId = parentId;
    }
    
    const response = await fetch(`${API_BASE_URL}/create_reply`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create reply: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating reply:', error);
    toast.error('Could not post your comment. Please try again later.');
    return {
      success: false,
      message: 'Failed to create reply',
      reply_id: 0,
      post_code: postCode,
      parent_id: 0,
      created_on: new Date().toISOString(),
      handle: '',
      avatar_url: ''
    };
  }
};
