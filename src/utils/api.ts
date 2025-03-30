import { toast } from 'sonner';
import { POST_MIRRORED_EVENT } from '@/components/feed/post/MirrorButton';

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
  original_images?: string[];
}

/**
 * Interface for community data
 */
export interface Community {
  name: string;
  description?: string;
  image?: string;
  type?: string;
  sharePrice?: {
    buyPrice: number;
    sellPrice: number;
  };
  userShares?: number;
  isAdmin?: number;
  membersCount: number;
  usdPrice?: number;
  marketCap?: string;
  last7Prices?: number[];
  userAvatars?: string[];
  metaUserInfo?: number;
}

/**
 * Interface for media upload response
 */
export interface MediaUploadResponse {
  success: boolean;
  url: string;
  type: 'image' | 'video';
  originalUrl: string;
  displayUrl: string;
  markdown: string;
  isProcessing: boolean;
  fileInfo?: {
    name: string;
    originalName: string;
    size: number;
    type: string;
  };
}

/**
 * Setup event listener for post mirroring
 * This triggers a callback when a post is mirrored
 */
export const setupMirrorListener = (callback: () => void) => {
  document.addEventListener(POST_MIRRORED_EVENT, callback);
  return () => {
    document.removeEventListener(POST_MIRRORED_EVENT, callback);
  };
};

/**
 * Fetch communities with optional search query
 */
export const fetchCommunities = async (options: {
  personal?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
}): Promise<Community[]> => {
  try {
    const { personal, search, page = 1, limit = 10, category } = options;
    
    // Get user API key from local storage
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found for fetching communities');
      toast.error('Authentication required. Please log in again.');
      return [];
    }
    
    // Construct API URL based on options
    let url = `${API_BASE_URL}/get_communities?page=${page}&limit=${limit}`;
    if (personal) {
      url += '&personal=1';
    }
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (search && search.trim() !== '') {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    
    console.log(`Fetching communities from: ${url}`);
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
      },
    });
    
    console.log(`Communities API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to fetch communities: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Communities API response structure:`, Object.keys(data));
    console.log(`Success property:`, data.success);
    
    let communities: Community[] = [];
    
    if (data.success && data.communities && Array.isArray(data.communities)) {
      // New API format
      console.log(`Found communities array with length: ${data.communities.length}`);
      if (data.communities.length > 0) {
        console.log('First community data sample:', data.communities[0]);
      }
      
      communities = data.communities.map((community: any) => ({
        name: community.name || 'Unknown Community',
        description: community.description || '',
        image: community.image || '',
        type: community.type || 'General',
        sharePrice: community.sharePrice,
        userShares: community.userShares,
        isAdmin: community.isAdmin,
        membersCount: parseInt(String(community.membersCount || '0'), 10),
        usdPrice: community.usdPrice,
        marketCap: community.marketCap,
        last7Prices: community.last7Prices,
        userAvatars: community.userAvatars,
        metaUserInfo: community.metaUserInfo
      }));
    } else if (Array.isArray(data)) {
      // Old API format
      console.log(`Fetched ${data.length} communities successfully (old format)`);
      communities = data.map((community: any) => ({
        name: community.name || 'Unknown Community',
        description: community.description || '',
        image: community.image || '',
        membersCount: parseInt(String(community.membersCount || '0'), 10),
        userAvatars: community.userAvatars || []
      }));
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format');
    }
    
    console.log('Transformed communities:', communities.length);
    return communities;
  } catch (error) {
    console.error('Error fetching communities:', error);
    toast.error('Failed to load communities. Please try again.');
    return [];
  }
};

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
    
    const response = await fetch(`${API_BASE_URL}/roar_post`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ postCode })
    });
    
    console.log(`Roar toggle API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed roar toggle response: ${errorText}`);
      throw new Error(`Failed to toggle roar: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Roar toggle result:', result);
    return result.status === "SUCCESS";
  } catch (error) {
    console.error('Error toggling roar:', error);
    toast.error('Failed to update interaction. Please try again.');
    return false;
  }
};

/**
 * Mirror a post to another community
 */
export const mirrorPost = async (params: {
  postCode: string;
  communityTo: string;
  quoteText?: string;
}): Promise<boolean> => {
  try {
    const { postCode, communityTo, quoteText } = params;

    if (!postCode || !communityTo) {
      console.error('Missing required parameters for mirroring post');
      throw new Error('Post code and destination community are required');
    }

    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found');
      throw new Error('Authentication required. Please log in again.');
    }
    
    console.log(`Mirroring post:`, params);
    
    // Use the exact field names expected by the API (postCode instead of post_code)
    const requestBody = {
      postCode,
      communityTo,
      quoteText: quoteText?.trim() || undefined
    };
    
    console.log(`Request payload:`, JSON.stringify(requestBody));
    
    const response = await fetch(`${API_BASE_URL}/mirror_post`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response content-type: ${response.headers.get("content-type")}`);
    
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await response.json();
        console.error('Mirror API error response (JSON):', errorData);
        errorMessage = errorData.message || errorMessage;
      } else {
        const errorText = await response.text();
        console.error('Mirror API error response (text):', errorText);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Mirror API response:', data);
    
    return data.status === "SUCCESS";
  } catch (error) {
    console.error('Error mirroring post:', error);
    throw error;
  }
};

/**
 * Create a new post in a community
 */
export const createPost = async (params: {
  body: string;
  community?: string;
  mediaUrls?: string[];
}): Promise<boolean | any> => {
  try {
    const { body, community, mediaUrls } = params;

    if (!body || body.trim() === '') {
      throw new Error('Post content is required');
    }

    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found');
      throw new Error('Authentication required. Please log in again.');
    }
    
    console.log('Creating post:', params);
    
    // Send the post body which already includes embedded media URLs
    const requestBody: Record<string, any> = {
      body: body.trim()
    };
    
    if (community) {
      requestBody.community = community;
    }
    
    // Only include separate mediaUrls if specifically needed by the API
    // Most cases this isn't needed since we now embed them in the body
    if (mediaUrls && mediaUrls.length > 0 && !body.includes('![]')) {
      requestBody.mediaUrls = mediaUrls;
    }
    
    console.log('Request payload:', JSON.stringify(requestBody));
    
    const response = await fetch(`${API_BASE_URL}/create_post`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`Response status: ${response.status}`);
    
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
      console.log('Create post API response:', data);
      
      // If request wasn't successful, return the error response directly
      if (!response.ok) {
        console.error('Create post API error response (JSON):', data);
        return data; // Return the error object with status and error message
      }
      
      // Extract the post code from the response if available
      if (data.postCode || data.post_code || data.code) {
        const postCode = data.postCode || data.post_code || data.code;
        console.log('Extracted post code from response:', postCode);
        return {
          status: "SUCCESS",
          postCode: postCode
        };
      }
    } else {
      const errorText = await response.text();
      console.error('Create post API error response (text):', errorText);
      
      if (!response.ok) {
        return {
          status: 'ERROR',
          error: `Error ${response.status}: ${errorText}`
        };
      }
      
      data = { success: true };
    }
    
    // Return the raw response if it has a status property, otherwise return boolean success
    return data.status === "SUCCESS" ? data : (data.success === true);
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};
