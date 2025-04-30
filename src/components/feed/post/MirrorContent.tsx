import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Check, Loader2, Search, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { fetchCommunities, Community } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { debounce } from '@/utils/helpers';

// Special value for mirroring to personal feed
export const PERSONAL_FEED = "MY_FEED";

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
  sourceCommunity?: string;
}

// Helper function to format member counts
const formatMemberCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Memoized community item component to prevent unnecessary re-renders
const CommunityItem = React.memo(({ 
  community, 
  isSelected, 
  onSelect, 
  disabledReason 
}: { 
  community: Community; 
  isSelected: boolean; 
  onSelect: (name: string) => void;
  disabledReason?: string;
}) => {
  const handleClick = useCallback(() => {
    if (!disabledReason) {
      onSelect(community.name);
    }
  }, [community.name, onSelect, disabledReason]);

  return (
    <div 
      className={`flex items-center justify-between p-2 ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'} rounded-md cursor-pointer ${disabledReason ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      title={disabledReason}
    >
      <div className="flex items-center gap-3">
        {community.image && (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            <img 
              src={community.image} 
              alt={community.name} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div>
          <div className="font-medium">{community.name}</div>
          {community.membersCount !== undefined && (
            <div className="text-xs text-muted-foreground">
              {formatMemberCount(community.membersCount)} members
            </div>
          )}
        </div>
      </div>
      {isSelected && <Check className="h-4 w-4 text-primary" />}
    </div>
  );
});

// Special component for the Personal Feed option
const PersonalFeedOption = React.memo(({ 
  isSelected, 
  onSelect 
}: { 
  isSelected: boolean; 
  onSelect: () => void;
}) => {
  return (
    <div 
      className={`flex items-center justify-between p-2 ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'} rounded-md cursor-pointer mb-2 border border-primary/20`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="font-medium">My Feed</div>
          <div className="text-xs text-muted-foreground">
            Mirror to your personal feed
          </div>
        </div>
      </div>
      {isSelected && <Check className="h-4 w-4 text-primary" />}
    </div>
  );
});

export const MirrorContent = ({
  username,
  timeAgo,
  content,
  onCommunitySelect,
  onQuoteChange,
  selectedCommunity,
  quoteText,
  images,
  video,
  sourceCommunity
}: MirrorContentProps) => {
  // Refs to avoid unnecessary re-renders
  const communitiesRef = useRef<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const mobile = useIsMobile();
  
  // Create debounced search function outside of render
  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      console.log(`Executing search for: "${query}"`);
      
      try {
        setLoading(true);
        
        if (query.trim() === '') {
          setFilteredCommunities(communitiesRef.current);
          setLoading(false);
          setIsSearching(false);
          return;
        }
        
        // Always search on the server for accurate results
        const searchResults = await fetchCommunities({
          search: query,
          limit: 50
        });
        
        if (searchResults.length === 0 && query.length >= 2) {
          // If no results from API but we have a meaningful query, try to search client-side as fallback
          const filtered = communitiesRef.current.filter(community => 
            community && typeof community.name === 'string' && // Check if name exists and is a string
            community.name.toLowerCase().includes(query.toLowerCase())
          );
          setFilteredCommunities(filtered);
        } else {
          // Use server results
          setFilteredCommunities(searchResults);
        }
      } catch (error) {
        console.error('Error searching communities:', error);
        toast.error('Error searching communities. Please try again.');
        
        // Fallback to client-side filtering on error
        const filtered = communitiesRef.current.filter(community => 
          community && typeof community.name === 'string' && // Check if name exists and is a string
          community.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredCommunities(filtered);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }, 300)
  ).current;
  
  // Load user communities on initial mount
  useEffect(() => {
    loadCommunities();
    
    // Set the personal feed as selected by default
    if (!selectedCommunity) {
      onCommunitySelect(PERSONAL_FEED);
    }
    
  }, []);
  
  const loadCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userCommunities = await fetchCommunities({ 
        personal: true,
        limit: 20
      });
      
      if (userCommunities.length === 0) {
        // If user is not part of any communities, fetch popular ones
        const popularCommunities = await fetchCommunities({ 
          limit: 20
        });
        
        communitiesRef.current = popularCommunities;
        setFilteredCommunities(popularCommunities);
      } else {
        communitiesRef.current = userCommunities;
        setFilteredCommunities(userCommunities);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      setError('Failed to load communities. Please try again.');
      communitiesRef.current = [];
      setFilteredCommunities([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);
    
    debouncedSearch(query);
  }, [debouncedSearch]);
  
  // Quote change handler
  const handleQuoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onQuoteChange(e.target.value);
  }, [onQuoteChange]);
  
  // Community selection handler
  const handleCommunitySelect = useCallback((communityName: string) => {
    // Prevent selecting the same community as the source
    if (sourceCommunity && communityName === sourceCommunity) {
      toast.error("Cannot mirror to the same community", {
        description: "Please select a different community to mirror this post to",
        duration: 3000,
      });
      return;
    }
    
    if (selectedCommunity === communityName) {
      onCommunitySelect(null);
    } else {
      onCommunitySelect(communityName);
    }
  }, [selectedCommunity, onCommunitySelect, sourceCommunity]);
  
  // Handle personal feed selection
  const handlePersonalFeedSelect = useCallback(() => {
    if (selectedCommunity === PERSONAL_FEED) {
      onCommunitySelect(null);
    } else {
      onCommunitySelect(PERSONAL_FEED);
    }
  }, [selectedCommunity, onCommunitySelect]);
  
  // Memoize the communities list to prevent unnecessary re-renders
  const communitiesList = useMemo(() => {
    // Limit the number of items rendered for better performance, especially on mobile
    const displayLimit = mobile ? 30 : 50;
    const displayedCommunities = filteredCommunities.slice(0, displayLimit);
    
    return (
      <div className="mt-4 space-y-1 max-h-[300px] overflow-y-auto overscroll-contain">
        {/* Always show the Personal Feed option at the top */}
        {searchQuery.trim() === '' && (
          <PersonalFeedOption
            isSelected={selectedCommunity === PERSONAL_FEED}
            onSelect={handlePersonalFeedSelect}
          />
        )}
        
        {/* Add a separator between My Feed and communities */}
        {searchQuery.trim() === '' && displayedCommunities.length > 0 && (
          <div className="py-1">
            <Separator />
            <div className="py-1 text-xs text-muted-foreground text-center">Communities</div>
          </div>
        )}
        
        {displayedCommunities.map((community, index) => (
          <CommunityItem
            key={`community-${community.name}-${index}`} /* Use name and index as key */
            community={community}
            isSelected={selectedCommunity === community.name}
            onSelect={handleCommunitySelect}
            disabledReason={sourceCommunity && community.name === sourceCommunity ? 
              "Cannot mirror to the same community" : undefined}
          />
        ))}
        
        {filteredCommunities.length > displayLimit && (
          <div className="text-center text-sm text-muted-foreground py-2">
            {filteredCommunities.length - displayLimit} more communities...
          </div>
        )}
        
        {filteredCommunities.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-4">
            No communities found
          </div>
        )}
      </div>
    );
  }, [filteredCommunities, selectedCommunity, handleCommunitySelect, sourceCommunity, mobile, searchQuery, handlePersonalFeedSelect]);
  
  // Memoize the content preview
  const contentPreview = useMemo(() => {
    const maxPreviewLength = 150;
    const truncatedContent = content.length > maxPreviewLength 
      ? `${content.substring(0, maxPreviewLength)}...` 
      : content;
    
    return (
      <div className="rounded-md border p-3 bg-muted/30">
        <div className="flex items-center mb-2">
          <div className="font-medium">@{username}</div>
          <div className="text-xs text-muted-foreground ml-2">{timeAgo}</div>
        </div>
        <p className="text-sm">{truncatedContent}</p>
        {images && images.length > 0 && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {images.length > 1 ? `${images.length} Images` : '1 Image'}
            </Badge>
          </div>
        )}
        {video && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">Video</Badge>
          </div>
        )}
      </div>
    );
  }, [content, username, timeAgo, images, video]);
  
  return (
    <div 
      className={`flex flex-col gap-4 ${mobile ? 'pb-28' : ''} p-4 overflow-y-auto`}
      style={{ 
        overscrollBehavior: 'contain',
        touchAction: 'manipulation' // Improve touch handling on mobile
      }}
    >
      {/* Original post display */}
      {contentPreview}
      
      {/* Select community section */}
      <div className="mt-2">
        <Label htmlFor="community" className="block mb-2">Select where to mirror</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="community"
            placeholder="Search communities..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {communitiesList}
      </div>
      
      <Separator className="my-4" />
      
      {/* Quote input section */}
      <div>
        <Label htmlFor="quote" className="block mb-2">Add a quote (optional)</Label>
        <Textarea
          id="quote"
          placeholder="What are your thoughts on this post?"
          value={quoteText}
          onChange={handleQuoteChange}
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  );
};
