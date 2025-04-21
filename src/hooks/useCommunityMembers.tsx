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

      const url = `/api/get_community_members?name=${encodeURIComponent(communityName)}&page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMembers(prev => (page === 1 ? data.members : [...prev, ...data.members]));
        setPagination(data.pagination);
        setHasMore(data.pagination.hasNext);
        currentPage.current = page;
      } else {
        throw new Error('Failed to load community members');
      }
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
