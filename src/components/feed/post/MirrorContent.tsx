
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle2 } from 'lucide-react';

interface MirrorContentProps {
  username: string;
  timeAgo: string;
  content: string;
  images?: string[];
  video?: string;
}

export const MirrorContent = ({ username, timeAgo, content, images, video }: MirrorContentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  const communities = [
    { name: "Ethereum Devs", members: 12400 },
    { name: "DeFi Explorers", members: 8300 },
    { name: "NFT Creators", members: 15600 },
    { name: "Web3 Gaming", members: 9800 },
    { name: "DAO Governance", members: 5400 },
    { name: "Solana Builders", members: 7200 },
    { name: "ZK Research", members: 3100 },
    { name: "Layer 2 Solutions", members: 6700 }
  ];

  const filteredCommunities = communities.filter(
    community => community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-start gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${username}`} />
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
      
      <div className="p-4">
        <h3 className="mb-4 text-sm font-medium">Select a community to mirror to</h3>
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
              />
            </div>
          </div>
          
          <div className="max-h-[30vh] overflow-y-auto">
            {filteredCommunities.length > 0 ? (
              <div className="space-y-2">
                {filteredCommunities.map((community) => (
                  <div 
                    key={community.name}
                    className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                      selectedCommunity === community.name 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                    onClick={() => setSelectedCommunity(community.name)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {community.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{community.name}</p>
                        <p className="text-xs text-muted-foreground">{community.members.toLocaleString()} members</p>
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
        </div>
      </div>
    </>
  );
};
