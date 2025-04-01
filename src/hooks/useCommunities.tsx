
import { useState, useEffect, useCallback } from 'react';
import { fetchCommunities, Community } from '@/utils/communityApi';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';

interface UseCommunitiesProps {
  category?: string;
  search?: string;
  personal?: boolean;
}

export const useCommunities = ({ category, search, personal }: UseCommunitiesProps = {}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  const loadCommunities = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      const isFirstLoad = pageNum === 1;
      
      if (isFirstLoad && !refresh) {
        setIsLoading(true);
      } else if (refresh) {
        setIsRefreshing(true);
      }
      
      setError(null);
      
      console.log(`Fetching communities for page ${pageNum}, category: ${category}, search: ${search}, personal: ${personal}`);
      
      const fetchedCommunities = await fetchCommunities({
        page: pageNum,
        limit: 10,
        category,
        search,
        personal,
      });
      
      console.log(`Fetched ${fetchedCommunities.length} communities`);
      
      if (fetchedCommunities.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
        
        if (pageNum === 1 || refresh) {
          setCommunities(fetchedCommunities);
        } else {
          setCommunities(prev => [...prev, ...fetchedCommunities]);
        }
        
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Error loading communities:', err);
      setError('Failed to load communities');
      toast.error('Failed to load communities. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [category, search, personal]);

  const refreshCommunities = useCallback(() => {
    return loadCommunities(1, true);
  }, [loadCommunities]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadCommunities(page + 1);
    }
  }, [isLoading, hasMore, page, loadCommunities]);

  // Initial load
  useEffect(() => {
    loadCommunities(1);
  }, [category, search, personal, loadCommunities]);

  // Infinite scroll
  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      loadMore();
    }
  }, [inView, isLoading, hasMore, loadMore]);

  return {
    communities,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    refreshCommunities,
    loadMore,
    loadMoreRef: ref,
  };
};
