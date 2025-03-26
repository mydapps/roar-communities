
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Check, Loader2, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { fetchCommunities, Community } from '@/utils/api';

interface MirrorContentProps {
  username: string;
  timeAgo: string;
  content: string;
  onCommunitySelect: (community: string | null) => void;
  onQuoteChange: (quote: string) => void;
  selectedCommunity: string | null;
  quoteText: string;
  images?: string[];
  video?: string;
}

export const MirrorContent = ({
  username,
  timeAgo,
  content,
  onCommunitySelect,
  onQuoteChange,
  selectedCommunity,
  quoteText,
  images,
  video
}: MirrorContentProps) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const mobile = useIsMobile();
  
  // Load user communities on initial mount
  useEffect(() => {
    console.log("MirrorContent mounted, fetching communities...");
    loadCommunities();
  }, []);
  
  const loadCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching user communities...');
      const userCommunities = await fetchCommunities({ 
        personal: true,
        limit: 20
      });
      
      console.log(`Fetched ${userCommunities.length} user communities`);
      
      if (userCommunities.length === 0) {
        // If user is not part of any communities, fetch popular ones
        console.log('No user communities found, fetching popular communities...');
        const popularCommunities = await fetchCommunities({ 
          limit: 20
        });
        
        console.log(`Fetched ${popularCommunities.length} popular communities`);
        setCommunities(popularCommunities);
        setFilteredCommunities(popularCommunities);
      } else {
        setCommunities(userCommunities);
        setFilteredCommunities(userCommunities);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      setError('Failed to load communities. Please try again.');
      setCommunities([]);
      setFilteredCommunities([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search only when the input changes, with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout to implement debounce
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.trim() === '') {
      // If search is cleared, show all loaded communities immediately
      setIsSearching(false);
      setFilteredCommunities(communities);
      return;
    }
    
    // Set a flag to indicate searching is in progress
    setIsSearching(true);
    
    // Set a timeout to execute the search after a delay (debounce)
    const timeout = setTimeout(() => {
      executeSearch(query);
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeout as unknown as NodeJS.Timeout);
  };
  
  const executeSearch = async (query: string) => {
    console.log(`Executing search for: "${query}"`);
    
    try {
      setLoading(true);
      
      // For longer queries, search on the server
      if (query.length >= 2) {
        console.log('Searching communities from server...');
        const searchResults = await fetchCommunities({
          search: query,
          limit: 20
        });
        
        console.log(`Search returned ${searchResults.length} communities`);
        setFilteredCommunities(searchResults);
      } else {
        // For very short queries, filter client-side for better responsiveness
        console.log('Filtering communities client-side...');
        const filtered = communities.filter(community => 
          community.name.toLowerCase().includes(query.toLowerCase())
        );
        console.log(`Filtered to ${filtered.length} communities`);
        setFilteredCommunities(filtered);
      }
    } catch (error) {
      console.error('Error searching communities:', error);
      toast.error('Error searching communities. Please try again.');
      
      // Fallback to client-side filtering on error
      const filtered = communities.filter(community => 
        community.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCommunities(filtered);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };
  
  const handleQuoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onQuoteChange(e.target.value);
  };
  
  const handleCommunitySelect = (communityName: string) => {
    console.log('Community selected:', communityName);
    console.log('Previously selected community:', selectedCommunity);
    
    if (selectedCommunity === communityName) {
      console.log('Deselecting community');
      onCommunitySelect(null);
    } else {
      console.log('Selecting new community');
      onCommunitySelect(communityName);
    }
  };
  
  // Display number with appropriate formatting
  const formatMemberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  return (
    <div className={`flex flex-col gap-4 ${mobile ? 'pb-28' : ''} p-4 overflow-y-auto`}>
      {/* Original post display */}
      <div className="rounded-md border p-3 bg-muted/30">
        <div className="flex items-center mb-2">
          <div className="flex flex-col">
            <span className="font-medium text-sm">@{username}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
        <p className="text-sm line-clamp-3 text-muted-foreground">{content}</p>
        {(images && images.length > 0) ? (
          <div className="mt-2 rounded overflow-hidden h-20 w-20 bg-muted">
            <img 
              src={images[0]} 
              alt="Post attachment" 
              className="h-full w-full object-cover"
            />
            {images.length > 1 && (
              <div className="bg-background/80 text-xs px-1 py-0.5 rounded-sm absolute bottom-1 right-1">
                +{images.length - 1}
              </div>
            )}
          </div>
        ) : video ? (
          <div className="mt-2 rounded overflow-hidden h-20 bg-muted">
            <video 
              src={video} 
              className="h-full w-auto"
            />
          </div>
        ) : null}
      </div>
      
      {/* Quote input */}
      <div className="grid gap-2">
        <Label htmlFor="quote">Your Quote (Optional)</Label>
        <Textarea 
          id="quote" 
          placeholder="Add your thoughts about this post..."
          className="min-h-24"
          value={quoteText}
          onChange={handleQuoteChange}
        />
      </div>
      
      <Separator className="my-1" />
      
      {/* Community selection */}
      <div className="grid gap-3">
        <Label>Select a Community</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        
        <div className="rounded-md border divide-y max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No communities found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isSearching ? 'Searching...' : 'Try a different search term'}
              </p>
            </div>
          ) : (
            filteredCommunities.map((community, index) => (
              <div 
                key={index}
                className={`p-2.5 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 ${
                  selectedCommunity === community.name ? 'bg-primary/10' : ''
                }`}
                onClick={() => handleCommunitySelect(community.name)}
              >
                <div className="h-10 w-10 rounded-md bg-muted overflow-hidden">
                  {community.image ? (
                    <img 
                      src={community.image} 
                      alt={community.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                      {community.name.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{community.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatMemberCount(community.membersCount || 0)} members
                  </div>
                </div>
                {selectedCommunity === community.name && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
