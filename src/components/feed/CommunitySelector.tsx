
import React, { useState, useEffect, useCallback } from 'react';
import { getUserHoldings, UserHoldingsResponse, UserHolding } from '@/utils/communityTokensApi';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, Heart, Sparkles } from 'lucide-react';

interface CommunitySelectorProps {
  onSelect: (community: string) => void;
  selectedCommunity?: string;
}

export function CommunitySelector({ onSelect, selectedCommunity }: CommunitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Fetch holdings data
  const fetchHoldings = useCallback(async (page: number = 1, search?: string, reset: boolean = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await getUserHoldings({ 
        page, 
        limit: 10, 
        search: search?.trim() || undefined 
      });
      
      if (response.success && response.data) {
        if (reset || page === 1) {
          setHoldings(response.data.holdings);
        } else {
          setHoldings(prev => [...prev, ...response.data.holdings]);
        }
        
        setHasMore(response.data.pagination.hasNextPage);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch user holdings:', response.error);
        if (reset || page === 1) {
          setHoldings([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching user holdings:', error);
      if (reset || page === 1) {
        setHoldings([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    fetchHoldings(1, searchTerm, true);
  }, [fetchHoldings, searchTerm]);
  
  // Handle search term changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchHoldings(1, searchTerm, true);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchHoldings]);
  
  // Handle scrolling to load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const div = e.currentTarget;
    if (div.scrollTop + div.clientHeight >= div.scrollHeight - 20 && hasMore && !isLoadingMore) {
      fetchHoldings(currentPage + 1, searchTerm, false);
    }
  };
  
  // Render witty message when user doesn't hold any community tokens
  const renderEmptyState = () => {
    if (isLoading) return null;
    
    return (
      <div className="py-8 px-4 text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <Heart className="h-4 w-4 text-pink-500 absolute -top-1 -right-1" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-base text-foreground">No community tokens yet!</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            You don't hold any community tokens yet. Buy some tokens to join communities and start posting!
          </p>
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Tip: Browse the Communities page to discover tokens</span>
          <Sparkles className="h-3 w-3" />
        </div>
      </div>
    );
  };
  
  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput 
        placeholder="Search your community tokens..." 
        value={searchTerm}
        onValueChange={setSearchTerm}
        className="border-none focus:ring-0"
      />
      
      <CommandList 
        className="max-h-[300px] overflow-auto custom-scrollbar"
        onScroll={handleScroll}
      >
        {isLoading && holdings.length === 0 ? (
          <div className="py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading your community tokens...</p>
          </div>
        ) : holdings.length === 0 ? (
          searchTerm.trim() ? (
            <CommandEmpty>No community tokens found matching "{searchTerm}"</CommandEmpty>
          ) : (
            renderEmptyState()
          )
        ) : (
          <CommandGroup heading="Your Community Tokens">
            {holdings.map((holding) => (
              <CommandItem
                key={holding.ticker}
                value={holding.name}
                onSelect={() => onSelect(holding.name)}
                className="flex items-center gap-2 py-2 px-2 cursor-pointer"
              >
                {holding.image ? (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={holding.image} alt={holding.name} />
                    <AvatarFallback>{holding.ticker.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">{holding.ticker.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{holding.givenName || holding.name} (${holding.ticker})</p>
                  
                  <div className="flex items-center gap-1 mt-0.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {holding.totalHolders.toLocaleString()} holders
                    </span>
                  </div>
                </div>
                
                {selectedCommunity === holding.name && (
                  <Badge variant="secondary" className="ml-auto text-xs">Selected</Badge>
                )}
              </CommandItem>
            ))}
            
            {isLoadingMore && (
              <div className="py-2 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
              </div>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
