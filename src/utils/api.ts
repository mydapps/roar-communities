
import { toast } from 'sonner';

/**
 * Base API URL for all requests
 */
const API_BASE_URL = 'https://api.dapps.co';

/**
 * Interface for API post responses
 */
export interface Post {
  code: string;
  community: string;
  avatar: string;
  handle: string;
  timeAgo: string;
  title: string;
  body: string;
  body_shrunk: number;
  upvotes: number;
  comments: number;
  roar: number; // 1 if user has already roared this post, 0 if not
  ipfs: string;
  engagement: number;
  roarable: number;
  image: number;
  image_url: string;
  currentPage: number;
  offset: number;
  multiple_images: number;
  images: string[];
  reply_count: number;
  replies: {
    handle: string;
    avatar: string;
    date: string;
    body: string;
  }[];
  pinned: number;
  is_mirror: number;
  mirror_quote?: string;
  original_post_code?: string;
  original_community?: string;
  original_title?: string;
  original_body?: string;
  original_author?: string;
  original_author_avatar?: string;
  original_created_on?: string;
}

/**
 * Fetch posts with pagination and filter options
 */
export const fetchPosts = async (options: {
  page: number;
  personal?: boolean;
  trending?: boolean;
}): Promise<Post[]> => {
  try {
    const { page, personal, trending } = options;
    
    // Get user API key from local storage
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found');
      toast.error('Authentication required. Please log in again.');
      return [];
    }
    
    // Construct API URL based on options
    let url = `${API_BASE_URL}/fetch_posts?page=${page}`;
    if (personal) {
      url += '&personal=1';
    }
    if (trending) {
      url += '&trending=1';
    }
    
    console.log(`Fetching posts from: ${url}`);
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
      },
    });
    
    console.log(`API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to fetch posts: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} posts successfully`);
    if (data.length > 0) {
      console.log('First post:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No posts returned from API');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    toast.error('Failed to load posts. Please try again.');
    return [];
  }
};

/**
 * Toggle roar (upvote) status for a post
 */
export const toggleRoar = async (postCode: string): Promise<boolean> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found for roar toggle');
      return false;
    }
    
    console.log(`Toggling roar for post: ${postCode}`);
    
    const response = await fetch(`${API_BASE_URL}/toggle_roar`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ post_code: postCode })
    });
    
    console.log(`Roar toggle API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed roar toggle response: ${errorText}`);
      throw new Error(`Failed to toggle roar: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Roar toggle result:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error toggling roar:', error);
    toast.error('Failed to update interaction. Please try again.');
    return false;
  }
};
