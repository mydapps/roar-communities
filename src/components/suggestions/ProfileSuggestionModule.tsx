import React, { useState, useEffect, useCallback } from 'react';
import { ProfileSuggestionCard, SuggestedUser } from './ProfileSuggestionCard';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, XCircle, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ProfileSuggestionModuleProps {
  onDismiss?: () => void; // Callback when the module is dismissed
  initialLimit?: number;
  fetchPageNumber?: number; // New prop for initial page to fetch
}

interface ProfileSuggestionResponse {
  success: boolean;
  data: (SuggestedUser | null | undefined)[]; // Allow for potentially malformed data from API
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
  error?: string;
}

export const ProfileSuggestionModule = React.memo<ProfileSuggestionModuleProps>(({ 
  onDismiss, 
  initialLimit = 3, 
  fetchPageNumber = 1 // Default to page 1 if not provided
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // currentPage will now be initialized by fetchPageNumber for the *first* fetch,
  // but subsequent internal refreshes will increment from its own state.
  const [currentPage, setCurrentPage] = useState(fetchPageNumber);
  const [totalPages, setTotalPages] = useState(1); 
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  const fetchSuggestions = useCallback(async (pageToFetch: number, limit: number) => {
    setIsLoading(true);
    setError(null);
    console.log(`[ProfileSuggestionModule] Fetching suggestions for page: ${pageToFetch}, limit: ${limit}`);
    try {
      const response = await fetch(`/api/profile-suggestion-relevant?page=${pageToFetch}&limit=${limit}`);
      const data: ProfileSuggestionResponse = await response.json();
      
      console.log(`[ProfileSuggestionModule] Raw data received for page ${pageToFetch}:`, JSON.stringify(data.data));

      if (response.ok && data.success) {
        const validSuggestions = data.data ? data.data.filter(
          (user): user is SuggestedUser => user !== null && user !== undefined && typeof user.handle === 'string'
        ) : [];
        
        if (data.data && validSuggestions.length !== data.data.length) {
            console.warn(`[ProfileSuggestionModule] Filtered out invalid user data from page ${pageToFetch}. Original count: ${data.data.length}, Valid count: ${validSuggestions.length}`);
        }

        setSuggestions(validSuggestions); 
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        if (validSuggestions.length === 0 && data.data && data.data.length > 0 && pageToFetch > 1) {
             // This case means API returned data, but all of it was invalid
        } else if (validSuggestions.length === 0 && pageToFetch > 1) {
            console.log(`[ProfileSuggestionModule] No valid suggestions found for page ${pageToFetch}. This might be the end of suggestions or API returned empty array.`);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch suggestions.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      if (suggestions.length === 0 || pageToFetch <= totalPages) {
        toast({
            variant: 'destructive',
            title: 'Could not load suggestions',
            description: err.message,
        });
      }
      console.error(`[ProfileSuggestionModule] Error fetching page ${pageToFetch}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [toast, totalPages]);

  useEffect(() => {
    // Use the fetchPageNumber prop for the initial fetch for this instance
    fetchSuggestions(fetchPageNumber, initialLimit);
  }, [fetchSuggestions, fetchPageNumber, initialLimit]);

  const handleRefresh = () => {
    // Refresh logic: try to get the next page from the API based on *this module's* current page view.
    // If it exceeds total API pages, it might loop back or fetch an empty page based on API behavior.
    const nextPageForModule = currentPage < totalPages ? currentPage + 1 : 1; // Or, could cap at totalPages
    fetchSuggestions(nextPageForModule, initialLimit);
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };
  
  const handleFollowToggleInCard = (updatedHandle: string, isNowFollowing: boolean) => {
    setSuggestions(currentSuggestions => 
      currentSuggestions.map(user => 
        user.handle === updatedHandle ? { ...user, isFollowing: isNowFollowing } : user
      )
    );
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.8; // Scroll by 80% of visible width
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading && suggestions.length === 0) {
    return (
      <div className="p-4 my-4 border rounded-lg bg-card">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error && suggestions.length === 0) {
    return (
      <div className="p-4 my-4 border rounded-lg bg-destructive/10 text-destructive-foreground">
        <div className="flex items-center justify-center h-48 flex-col">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Error loading suggestions</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchSuggestions(fetchPageNumber, initialLimit)} className="mt-4">
                Try Again
            </Button>
        </div>
      </div>
    );
  }

  if (!isLoading && suggestions.length === 0 && !error) {
    console.log(`[ProfileSuggestionModule] Instance for page ${fetchPageNumber} is rendering null (no valid suggestions).`);
    return null; 
  }

  return (
    <div className="p-4 my-6 border rounded-xl shadow-sm bg-muted/50 relative">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-card-foreground">Discover People</h3>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} title="Refresh suggestions">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {onDismiss && (
            <Button variant="ghost" size="icon" onClick={onDismiss} title="Dismiss suggestions">
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="relative">
            {/* Scroll Left Button */} 
            {suggestions.length > 1 && (
                <Button 
                    variant="outline"
                    size="icon" 
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={() => scroll('left')}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            )}

          <div ref={scrollContainerRef} className="flex space-x-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {suggestions.map((user) => (
              <ProfileSuggestionCard key={user.handle} user={user} onFollowToggle={handleFollowToggleInCard} />
            ))}
          </div>

            {/* Scroll Right Button */} 
            {suggestions.length > 1 && (
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 rounded-full h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={() => scroll('right')}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            )}
        </div>
      )}
      {error && suggestions.length > 0 && (
         <p className="text-xs text-destructive mt-2">Could not refresh suggestions: {error}</p>
      )}
    </div>
  );
});

ProfileSuggestionModule.displayName = 'ProfileSuggestionModule'; 