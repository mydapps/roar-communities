
import { useState, useEffect, useCallback } from 'react';
import { fetchCommunities, Community } from '@/utils/api';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

export function useCommunities(initialSearchTerm = '') {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const loadCommunities = useCallback(async (search: string, pageNum: number, append = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching communities with search: "${search}", page: ${pageNum}`);
      
      const fetchedCommunities = await fetchCommunities({
        personal: true,
        search: search || undefined,
        page: pageNum,
        limit: 10
      });
      
      if (append) {
        setCommunities(prev => [...prev, ...fetchedCommunities]);
      } else {
        setCommunities(fetchedCommunities);
      }
      
      setHasMore(fetchedCommunities.length === 10); // Assuming 10 is the limit
    } catch (error) {
      console.error('Error loading communities:', error);
      setError('Failed to load communities');
      toast.error('Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load initial communities or when search term changes
  useEffect(() => {
    setPage(1);
    loadCommunities(debouncedSearchTerm, 1, false);
  }, [debouncedSearchTerm, loadCommunities]);
  
  // Function to load more communities
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadCommunities(debouncedSearchTerm, nextPage, true);
    }
  }, [debouncedSearchTerm, hasMore, loading, loadCommunities, page]);

  // Function to refresh communities
  const refresh = useCallback(() => {
    setPage(1);
    loadCommunities(debouncedSearchTerm, 1, false);
  }, [debouncedSearchTerm, loadCommunities]);
  
  return {
    communities,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    hasMore,
    loadMore,
    refresh
  };
}
