
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Community {
  name: string;
  membersCount: number;
  image: string;
  description: string;
}

interface MirrorContentProps {
  username: string;
  timeAgo: string;
  content: string;
  images?: string[];
  video?: string;
  onCommunitySelect: (community: string | null) => void;
  onQuoteChange: (quote: string) => void;
  selectedCommunity: string | null;
  quoteText: string;
}

export const MirrorContent = ({ 
  username, 
  timeAgo, 
  content, 
  images, 
  video,
  onCommunitySelect,
  onQuoteChange,
  selectedCommunity,
  quoteText
}: MirrorContentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Function to fetch communities - supports both personal and search modes
  const fetchCommunities = async (search?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userKey = localStorage.getItem('dapps_user_key');
      
      if (!userKey) {
        setError("Authentication required. Please log in again.");
        return;
      }
      
      // Build the API URL based on whether we're searching or getting personal communities
      let url = 'https://api.dapps.co/get_communities?page=1&limit=20';
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      } else {
        url += '&personal=1';
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-user-key': userKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch communities: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.communities) {
        setCommunities(data.communities.map((community: any) => ({
          name: community.name,
          membersCount: community.membersCount,
          image: community.image,
          description: community.description
        })));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError("Failed to load communities. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load communities. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load of personal communities
  useEffect(() => {
    fetchCommunities();
  }, []);
  
  // Handle search query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchCommunities(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        fetchCommunities(); // Load personal communities when search is cleared
      }
    }, 500);
    
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };

  // We'll display all communities from the API
  const displayedCommunities = communities;

  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-start gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://img.dapps.co/avatar/${username}.svg`} />
            <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-medium">{formatUsername(username)}</span>
              <span className="text-muted-foreground text-sm mx-1">·</span>
              <span className="text-muted-foreground text-sm">{timeAgo}</span>
            </div>
            <p className="text-sm mt-1">{content}</p>
          </div>
        </div>
        
        {(images?.length || video) && (
          <div className="ml-12 mt-2">
            {images && images.length > 0 && (
              <img 
                src={images[0]} 
                alt="First image" 
                className="rounded-md h-20 w-auto object-cover"
              />
            )}
            {video && (
              <video 
                src={video} 
                className="rounded-md h-20 w-auto object-cover"
              />
            )}
            {images && images.length > 1 && (
              <span className="text-xs text-muted-foreground mt-1 block">
                +{images.length - 1} more {images.length === 2 ? 'image' : 'images'}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <label htmlFor="quote-text" className="block text-sm font-medium mb-2">
            Add your thoughts (optional)
          </label>
          <Textarea 
            id="quote-text"
            placeholder="Add a comment..."
            className="w-full resize-none"
            value={quoteText}
            onChange={(e) => onQuoteChange(e.target.value)}
            maxLength={280}
            onClick={(e) => e.stopPropagation()} // Stop event propagation
          />
          <div className="text-xs text-muted-foreground text-right mt-1">
            {quoteText.length}/280
          </div>
        </div>
        
        <h3 className="text-sm font-medium">Select a community to mirror to</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search communities..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Stop event propagation
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="max-h-[30vh] overflow-y-auto">
              {displayedCommunities.length > 0 ? (
                <div className="space-y-2">
                  {displayedCommunities.map((community) => (
                    <div 
                      key={community.name}
                      className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                        selectedCommunity === community.name 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop event propagation
                        onCommunitySelect(community.name);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={community.image} />
                          <AvatarFallback>
                            {community.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{community.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {community.membersCount.toLocaleString()} members
                          </p>
                        </div>
                      </div>
                      {selectedCommunity === community.name && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No communities found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
