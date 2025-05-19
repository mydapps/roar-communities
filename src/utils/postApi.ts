import { toast } from 'sonner';
import { createAuthHeaders, setupEventListener } from './apiBase';
import { POST_MIRRORED_EVENT } from '@/components/feed/post/MirrorButton';

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
  replies: Reply[];
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
  is_poll: boolean; // True if the post is a poll
  poll_data: PollData | null; // Null if not a poll or data not available
}

/**
 * Interface for a single option in a newly created poll (response from /api/create_post)
 */
export interface CreatedPollOption {
  id: number;
  option_text: string;
  option_image_url: string | null;
  option_sequence: number;
}

/**
 * Interface for the response of the create_post API
 */
export interface CreatePostResponse {
  status: "SUCCESS" | "ERROR" | string; // Allow for other status strings
  communityName: string;
  postCode: string;
  message?: string; // Optional error message
  created_poll_options?: CreatedPollOption[];
}

/**
 * Interface for detailed post information
 */
export interface PostDetails extends Post {
  author: {
    handle: string;
    avatar: string;
  };
  created_at: string;
  featured_image: string;
  has_upvoted: boolean;
  is_encrypted: boolean;
}

/**
 * Interface for original post information (for mirrors)
 */
export interface OriginalPost {
  code: string;
  community: string;
  title: string;
  body: string;
  author: string;
  author_avatar: string;
  created_on: string;
  images: string[];
}

/**
 * Interface for reply data
 */
export interface Reply {
  id: number;
  user_id: number;
  handle: string;
  avatar: string;
  content: string;
  created_at: string;
  time_ago: string;
  upvotes: number;
  has_meowed: boolean;
  meow_count: number; // Add this missing property
  replies?: Reply[];
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
 * Options for fetching posts
 */
export interface FetchPostsOptions {
  page: number;
  personal?: boolean;
  trending?: boolean;
  global?: boolean;
  limit?: number;
}

/**
 * Interface for the response of hiding/unhiding a post
 */
export interface HidePostResponse {
  success: boolean;
  message: string;
  status?: number;
}

/**
 * Setup event listener for post mirroring
 * This triggers a callback when a post is mirrored
 */
export const setupMirrorListener = (callback: () => void) => {
  return setupEventListener(POST_MIRRORED_EVENT, callback);
};

/**
 * Fetch posts with pagination and filter options
 */
export const fetchPosts = async (options: FetchPostsOptions): Promise<Post[]> => {
  try {
    const { page, personal, trending, global, limit } = options;
    
    // Construct API URL based on options
    let url = `/api/fetch_posts?page=${page}`;
    if (personal) {
      url += '&personal=1';
    }
    if (trending) {
      url += '&trending=1';
    }
    if (global) {
      url += '&global=1';
    }
    if (limit && limit > 0) {
      url += `&limit=${limit}`;
    }
    
    console.log(`Fetching posts from: ${url}`);
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: createAuthHeaders(),
      credentials: 'include'
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
 * Fetch a single post by its code/ID
 */
export const fetchPost = async (postCode: string): Promise<{
  post: PostDetails;
  original_post?: OriginalPost;
  replies?: Reply[];
  reply_count?: number;
}> => {
  try {
    const response = await fetch(`/api/get_post?code=${postCode}`, {
      method: 'GET',
      headers: createAuthHeaders(),
      credentials: 'include'
    });
    
    console.log(`Post API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to fetch post: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Post API response:`, data);
    
    return data;
  } catch (error) {
    console.error('Error fetching post:', error);
    toast.error('Failed to load post. Please try again.');
    throw error;
  }
};

/**
 * Toggle roar (upvote) status for a post
 */
export const toggleRoar = async (postCode: string): Promise<boolean | { status: string; errCode: string; message: string; community: string }> => {
  try {
    const response = await fetch(`/api/roar_post`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({ postCode }),
      credentials: 'include'
    });
    
    console.log(`Roar toggle API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed roar toggle response: ${errorText}`);
      
      // Check if this is a 403 error for not being part of the community
      if (response.status === 403) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.errCode === "004" && errorData.community) {
            // Return the parsed error object with community information
            return errorData;
          }
        } catch (parseError) {
          // If we can't parse the JSON, just continue with the normal error handling
          console.error("Error parsing 403 response:", parseError);
        }
      }
      
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
 * Mirror a post to another community or to the user's feed
 */
export const mirrorPost = async (params: {
  postCode: string;
  communityTo: string;
  quoteText?: string;
}): Promise<boolean> => {
  try {
    const { postCode, communityTo, quoteText } = params;

    if (!postCode) {
      console.error('Missing required parameters for mirroring post');
      throw new Error('Post code is required');
    }
    
    // communityTo can now be an empty string when mirroring to personal feed
    
    const response = await fetch(`/api/mirror_post`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(params),
      credentials: 'include'
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
    
    return data.status === "SUCCESS" || data.success === true;
  } catch (error) {
    console.error('Error mirroring post:', error);
    throw error;
  }
};

// --- NEW INTERFACE FOR createPost PARAMETERS ---
interface CreatePostServiceParams {
  body: string;
  community?: string;
  media?: Array<{ // Assuming media items have at least a url and type
    url: string;
    type: 'image' | 'video';
    // Add other fields from MediaUploadResponse if they are passed and needed
  }>;
  is_poll?: boolean;
  poll_options?: Array<{
    text: string;
    imageUrl?: string;
  }>;
}
// --- END NEW INTERFACE ---

/**
 * Create a new post in a community
 */
export const createPost = async (params: CreatePostServiceParams): Promise<CreatePostResponse> => {
  try {
    const { body, community, media, is_poll, poll_options } = params;

    console.log('Creating post with params:', params);
    
    const requestBody: any = {
      body: body.trim()
    };

    if (community) {
      requestBody.community = community;
    }

    if (media && media.length > 0) {
      requestBody.media = media.map(m => ({
        url: m.url,
        type: m.type,
        // Potentially map other fields if your backend expects them
        // e.g., originalUrl: m.originalUrl, displayUrl: m.displayUrl
      }));
    }

    if (is_poll && poll_options) {
      requestBody.is_poll = true;
      requestBody.poll_options = poll_options.map(opt => ({
        text: opt.text,
        imageUrl: opt.imageUrl
      }));
    }

    console.log('Constructed request payload for /api/create_post:', JSON.stringify(requestBody));

    const response = await fetch(`/api/create_post`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(requestBody),
      credentials: 'include'
    });

    console.log(`Response status: ${response.status}`);

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        const textResponse = await response.text();
        console.error('Non-JSON response from create_post:', textResponse);
        // Try to parse as JSON anyway, or handle as plain text error
        try {
            data = JSON.parse(textResponse); 
        } catch (e) {
            // If it's not JSON and not a 2xx, it's an error
            if (!response.ok) {
                toast.error(`Failed to create post: ${textResponse || response.statusText}`);
                return {
                    status: 'ERROR',
                    message: `Error ${response.status}: ${textResponse || response.statusText}`,
                    communityName: '',
                    postCode: ''
                };
            }
            // If it's a 2xx but not JSON, this is unexpected for create_post
            console.error('Successful HTTP response from create_post was not JSON:', textResponse);
            toast.error('Unexpected response from server.');
            return {
                status: 'ERROR',
                message: 'Unexpected response format from server.',
                communityName: '',
                postCode: ''
            };
        }
    }
    
    console.log('Create post API response data:', data);

    if (response.ok) {
      // Assuming 'data' is now the parsed JSON object
      if (data.status === "SUCCESS" || data.success === true) { 
        return {
          status: "SUCCESS",
          postCode: data.postCode, 
          communityName: data.communityName || '', 
          message: data.message, 
          created_poll_options: data.created_poll_options 
        };
      } else {
        console.warn('Post creation HTTP 2xx but API indicated failure:', data);
        toast.error(data.message || 'Post creation failed.');
        return {
          status: data.status || "ERROR",
          message: data.message || 'Post creation failed.',
          communityName: data.communityName || '',
          postCode: data.postCode || '' 
        };
      }
    } else {
      const errorText = data.message || JSON.stringify(data) || response.statusText;
      console.error('Failed to create post (HTTP error):', errorText);
      toast.error(`Failed to create post: ${errorText}`);
      return {
        status: 'ERROR',
        message: `Error ${response.status}: ${errorText}`,
        communityName: '', 
        postCode: '' 
      };
    }
  } catch (error) {
    console.error('Error creating post (catch block):', error);
    toast.error('An unexpected error occurred while creating the post.');
    return {
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'An unknown error occurred.',
      communityName: '',
      postCode: ''
    };
  }
};

/**
 * Hides or unhides a post via the API.
 * @param postCode - The unique code of the post.
 * @param action - 'hide' or 'unhide'.
 * @returns Promise resolving to HidePostResponse.
 */
export const hidePost = async (
  postCode: string, 
  action: 'hide' | 'unhide'
): Promise<HidePostResponse> => {
  if (!postCode) {
    // Return a predictable error format
    return { success: false, message: "postCode is required to hide or unhide a post." };
  }
  
  console.log(`API Call: Hiding/Unhiding post ${postCode} with action: ${action}`);
  
  try {
    const headers = createAuthHeaders(); // Get headers with content-type
    const response = await fetch('/api/hide_post', { // Use relative path for proxy
      method: 'POST',
      headers: headers,
      credentials: 'include', // Include credentials (cookies)
      body: JSON.stringify({ postCode, action }),
    });

    const responseData = await response.json();
    console.log('API Response (hidePost):', responseData);

    if (!response.ok) {
      // Use the message from the API if available, otherwise a default
      const errorMessage = responseData?.message || `HTTP error! status: ${response.status}`;
      console.error("Hide Post API Error:", errorMessage, responseData);
      return { success: false, message: errorMessage };
    }

    // Assuming the API returns HidePostResponse structure on success
    return responseData as HidePostResponse;

  } catch (error) {
    console.error('Network or other error hiding post:', error);
    let message = 'An unknown error occurred.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, message: `Network error: ${message}` };
  }
};

// --- Interfaces and Functions for Post Reporting/Flagging ---

/**
 * Interface for a single flag type option
 */
export interface FlagType {
  id: number;
  name: string;
  description: string;
}

/**
 * Interface for the API response containing flag types
 */
export interface FetchFlagTypesResponse {
  success: boolean;
  flagTypes: FlagType[];
}

/**
 * Interface for the payload when submitting a post flag
 */
export interface FlagPostPayload {
  postCode: string;
  flagTypeId: number;
  notes?: string;
}

/**
 * Interface for the API response after submitting a flag
 */
export interface FlagPostResponse {
  success: boolean;
  message: string;
  errorCode?: string; // e.g., "ALREADY_FLAGGED"
}

/**
 * Fetches the available flag types from the API.
 */
export const fetchFlagTypes = async (): Promise<FetchFlagTypesResponse> => {
  console.log("API Call: Fetching flag types");
  try {
    const headers = createAuthHeaders();
    const response = await fetch('/api/flag_types', { // Use relative path
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });

    const responseData = await response.json();
    console.log('API Response (fetchFlagTypes):', responseData);

    if (!response.ok || !responseData.success) {
      const errorMessage = responseData?.message || `HTTP error! status: ${response.status}`;
      console.error("Fetch Flag Types API Error:", errorMessage, responseData);
      // Return a standard error format
      return { success: false, flagTypes: [] }; 
    }

    return responseData as FetchFlagTypesResponse;

  } catch (error) {
    console.error('Network or other error fetching flag types:', error);
    let message = 'An unknown error occurred.';
    if (error instanceof Error) {
      message = error.message;
    }
    // Return a standard error format
    return { success: false, flagTypes: [] }; 
  }
};

/**
 * Submits a flag for a specific post.
 */
export const flagPost = async (payload: FlagPostPayload): Promise<FlagPostResponse> => {
  console.log("API Call: Flagging post", payload);
  try {
    const headers = createAuthHeaders();
    const response = await fetch('/api/flag_post', { // Use relative path
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    console.log('API Response (flagPost):', responseData);

    if (!response.ok) {
       // Use the message and potentially errorCode from the API response
       const errorMessage = responseData?.message || `HTTP error! status: ${response.status}`;
       const errorCode = responseData?.errorCode;
       console.error("Flag Post API Error:", errorMessage, responseData);
       return { success: false, message: errorMessage, errorCode: errorCode };
    }
    
    // Also check the success boolean in the response body
    if (!responseData.success) {
      console.error("Flag Post API returned success: false", responseData);
      return { success: false, message: responseData.message || "API indicated failure.", errorCode: responseData.errorCode };
    }

    // Assuming the API returns FlagPostResponse structure on success
    return responseData as FlagPostResponse;

  } catch (error) {
    console.error('Network or other error flagging post:', error);
    let message = 'An unknown error occurred.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, message: `Network error: ${message}` };
  }
};

// --- End Interfaces and Functions for Post Reporting/Flagging ---

/**
 * Pin or unpin a post in a community.
 */
export const pinCommunityPost = async (params: {
  postCode: string;
  action: 'pin' | 'unpin';
}): Promise<{ success: boolean; message: string; pinned?: 0 | 1; errorCode?: string }> => {
  const { postCode, action } = params;
  try {
    const response = await fetch('/api/pin_post', {
      method: 'POST',
      headers: {
        ...createAuthHeaders(), // Spread existing auth headers
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postCode, action }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      // Use error message from API if available, otherwise a default
      throw new Error(data.message || `API error: ${response.status}`);
    }
    
    // Assuming data contains { success: boolean, message: string, pinned?: 0 | 1, errorCode?: string }
    return data;

  } catch (error: any) {
    console.error('Error in pinCommunityPost:', error);
    // Return a failed promise compatible with the expected structure
    return {
      success: false,
      message: error.message || 'Failed to update post pin status. Please try again.',
    };
  }
};

/**
 * Hide a post from the user's feed (logical deletion for the user).
 */
export const hidePostFromUser = async (postCode: string): Promise<HidePostResponse> => {
  if (!postCode) {
    // Return a predictable error format
    return { success: false, message: "postCode is required to hide a post." };
  }
  
  console.log(`API Call: Hiding post ${postCode} from user's feed`);
  
  try {
    const headers = createAuthHeaders(); // Get headers with content-type
    const response = await fetch('/api/hide_post_from_user', { // Use relative path for proxy
      method: 'POST',
      headers: headers,
      credentials: 'include', // Include credentials (cookies)
      body: JSON.stringify({ postCode }),
    });

    const responseData = await response.json();
    console.log('API Response (hidePostFromUser):', responseData);

    if (!response.ok) {
      // Use the message from the API if available, otherwise a default
      const errorMessage = responseData?.message || `HTTP error! status: ${response.status}`;
      console.error("Hide Post API Error:", errorMessage, responseData);
      return { success: false, message: errorMessage };
    }

    // Assuming the API returns HidePostResponse structure on success
    return responseData as HidePostResponse;

  } catch (error) {
    console.error('Network or other error hiding post from user:', error);
    let message = 'An unknown error occurred.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, message: `Network error: ${message}` };
  }
};

// --- NEW POLL DATA INTERFACES ---
export interface PollDataOption {
  option_id: number;
  text: string;
  imageUrl: string | null;
  vote_count: number;
  percentage: number;
}

export interface PollData {
  is_active: boolean;
  poll_end_time: string; // ISO date string
  total_votes: number;
  user_has_voted: boolean;
  chosen_option_id: number | null;
  options: PollDataOption[];
}
// --- END NEW POLL DATA INTERFACES ---
