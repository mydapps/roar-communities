
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Check, Loader2, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

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

interface Community {
  name: string;
  image: string;
  description: string;
  membersCount: number;
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
  const mobile = useIsMobile();
  
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        
        const userKey = localStorage.getItem('dapps_user_key');
        if (!userKey) {
          toast.error('Authentication required. Please log in again.');
          return;
        }
        
        const response = await fetch('https://api.dapps.co/get_communities?personal=1', {
          method: 'GET',
          headers: {
            'x-user-key': userKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch communities: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched communities:', data);
        
        setCommunities(data);
        setFilteredCommunities(data);
      } catch (error) {
        console.error('Error fetching communities:', error);
        toast.error('Failed to load communities. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunities();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCommunities(communities);
    } else {
      const filtered = communities.filter(community => 
        community.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCommunities(filtered);
    }
  }, [searchQuery, communities]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleQuoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onQuoteChange(e.target.value);
  };
  
  const handleCommunitySelect = (communityName: string) => {
    if (selectedCommunity === communityName) {
      onCommunitySelect(null);
    } else {
      onCommunitySelect(communityName);
    }
  };
  
  return (
    <div className={`flex flex-col gap-4 ${mobile ? 'pb-16' : ''} p-4 overflow-y-auto`}>
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
          ) : filteredCommunities.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No communities found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
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
                  <div className="text-xs text-muted-foreground">{community.membersCount} members</div>
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
