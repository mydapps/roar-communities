
import { toast } from 'sonner';
import { API_BASE_URL, getUserApiKey } from './apiBase';

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
 * Options for fetching communities
 */
export interface FetchCommunitiesOptions {
  personal?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
}

/**
 * Fetch communities with optional search query
 */
export const fetchCommunities = async (options: FetchCommunitiesOptions): Promise<Community[]> => {
  try {
    const { personal, search, page = 1, limit = 10, category } = options;
    
    // Get user API key from local storage
    const userKey = getUserApiKey();
    
    if (!userKey) {
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
