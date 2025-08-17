import { toast } from 'sonner';
import { createAuthHeaders } from './apiBase';

/**
 * Interface for comment reply data
 */
export interface CommentReply {
  id: number;
  uid: number;
  handle: string;
  avatar_url: string;
  content: string;
  created_on: string;
  time_ago: string;
  upvotes: number;
  meow_count: number;
  has_meowed: boolean;
  sub_replies?: CommentReply[];
  is_system_message?: boolean; // For tip system messages
}

/**
 * Fetch replies for a post
 */
export const fetchReplies = async (postCode: string, limit = 10): Promise<{
  success: boolean;
  replies: CommentReply[];
  total_count: number;
}> => {
  try {
    // No need to check for API key - cookies will handle authentication
    console.log(`Fetching replies for post: ${postCode}, limit: ${limit}`);
    
    // Use the correct API endpoint and parameter name
    const response = await fetch(`/api/get_replies?postCode=${postCode}&limit=${limit}`, {
      method: 'GET',
      headers: createAuthHeaders(false),
      credentials: 'include'
    });
    
    console.log(`Replies API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to fetch replies: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.replies?.length || 0} replies`);
    
    // Debug log to check for sub_replies structure
    if (data.replies && data.replies.length > 0) {
      const firstReply = data.replies[0];
      console.log(`First reply ID: ${firstReply.id}, Has sub_replies: ${!!firstReply.sub_replies}, Count: ${firstReply.sub_replies?.length || 0}`);
      
      if (firstReply.sub_replies && firstReply.sub_replies.length > 0) {
        console.log(`First sub-reply ID: ${firstReply.sub_replies[0].id}`);
        // Check for nested sub_replies
        if (firstReply.sub_replies[0].sub_replies) {
          console.log(`Nested sub_replies exist! Count: ${firstReply.sub_replies[0].sub_replies.length}`);
        }
      }
    }
    
    return {
      success: true,
      replies: data.replies || [],
      total_count: data.total_count || 0
    };
  } catch (error) {
    console.error('Error fetching replies:', error);
    toast.error('Failed to load comments. Please try again.');
    return { success: false, replies: [], total_count: 0 };
  }
};

/**
 * Create a reply to a post or another reply
 */
export const createReply = async (postCode: string, content: string, parentId = 0): Promise<{
  success: boolean;
  reply_id?: number;
  handle?: string;
  avatar_url?: string;
  created_on?: string;
  errCode?: string;
  communityName?: string;
  message?: string;
}> => {
  try {
    // No need to check for API key - cookies will handle authentication
    
    // Get user handle and avatar from localStorage
    const userHandle = localStorage.getItem('dapps_user_handle');
    const userAvatar = localStorage.getItem('dapps_user_avatar');
    
    console.log(`Creating reply to post ${postCode}, parent ${parentId}, content: ${content}`);
    
    const response = await fetch(`/api/create_reply`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        postCode,
        content,
        parentId
      }),
      credentials: 'include'
    });
    
    console.log(`Create reply API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      
      // Check if this is a 403 error for not being part of the community
      if (response.status === 403) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.errCode === "004" && errorData.communityName) {
            // Return the parsed error object with community information
            return {
              success: false,
              errCode: errorData.errCode,
              communityName: errorData.communityName,
              message: errorData.message || "You must be a member of the community to reply"
            };
          }
        } catch (parseError) {
          // If we can't parse the JSON, just continue with the normal error handling
          console.error("Error parsing 403 response:", parseError);
        }
      }
      
      throw new Error(`Failed to create reply: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Create reply API response:', data);
    
    if (data.success) {
      return {
        success: true,
        reply_id: data.reply_id || data.id,
        handle: data.handle || userHandle || 'you',
        avatar_url: data.avatar_url || userAvatar || 'default',
        created_on: data.created_on
      };
    } else {
      console.error('API returned success: false', data);
      return { success: false };
    }
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

/**
 * Toggle "meow" (like) status for a comment
 */
export const toggleMeow = async (commentId: number): Promise<{
  success: boolean;
  message?: string;
  action?: string;
  meow_count?: number;
}> => {
  try {
    // No need to check for API key - cookies will handle authentication
    
    console.log(`Toggling meow for comment: ${commentId}`);
    
    const response = await fetch(`/api/meow_reply`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        replyId: commentId
      }),
      credentials: 'include'
    });
    
    console.log(`Toggle meow API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to toggle meow: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Toggle meow API response:', data);
    
    return {
      success: data.success === true,
      message: data.message,
      action: data.action,
      meow_count: data.meow_count
    };
  } catch (error) {
    console.error('Error toggling meow:', error);
    return { success: false, message: 'An error occurred' };
  }
};
