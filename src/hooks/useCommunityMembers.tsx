
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface CommunityMember {
  id: number;
  handle: string;
  shares: number;
  avatar: string | null;
}

export interface CommunityMembersPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CommunityMembersResponse {
  success: boolean;
  community: string;
  members: CommunityMember[];
  pagination: CommunityMembersPagination;
}

export const useCommunityMembers = (communityName: string | undefined) => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CommunityMembersPagination | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const currentPage = useRef<number>(1);
  
  const fetchMembers = useCallback(async (page: number = 1, limit: number = 10, append: boolean = false) => {
    if (!communityName) {
      setError('Community name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userKey = localStorage.getItem('dapps_user_key');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (userKey) {
        headers['x-user-key'] = userKey;
      }

      const response = await fetch(
        `https://api.dapps.co/get_community_members?name=${encodeURIComponent(communityName)}&page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch community members: ${response.status} ${response.statusText}`);
      }

      const data: CommunityMembersResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch community members');
      }

      setMembers(prev => append ? [...prev, ...data.members] : data.members);
      setPagination(data.pagination);
      setHasMore(data.pagination.hasNext);
      currentPage.current = page;

    } catch (err) {
      console.error('Error fetching community members:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to load community members. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [communityName]);

  useEffect(() => {
    // Reset and fetch first page when community name changes
    setMembers([]);
    currentPage.current = 1;
    fetchMembers(1, 10, false);
  }, [communityName, fetchMembers]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    const nextPage = currentPage.current + 1;
    fetchMembers(nextPage, 10, true);
  }, [loading, hasMore, fetchMembers]);

  return { members, loading, error, pagination, hasMore, loadMore };
};
