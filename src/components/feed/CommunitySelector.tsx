
import React, { useState, useEffect } from 'react';
import { useCommunities } from '@/hooks/useCommunities';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users } from 'lucide-react';

interface CommunitySelectorProps {
  onSelect: (community: string) => void;
  selectedCommunity?: string;
}

export function CommunitySelector({ onSelect, selectedCommunity }: CommunitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { 
    communities, 
    isLoading, 
    hasMore,
    loadMore
  } = useCommunities({
    search: searchTerm
  });
  
  // Handle scrolling to load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const div = e.currentTarget;
    if (div.scrollTop + div.clientHeight >= div.scrollHeight - 20 && hasMore) {
      loadMore();
    }
  };
  
  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput 
        placeholder="Search communities..." 
        value={searchTerm}
        onValueChange={setSearchTerm}
        className="border-none focus:ring-0"
      />
      
      <CommandList 
        className="max-h-[300px] overflow-auto custom-scrollbar"
        onScroll={handleScroll}
      >
        {isLoading && communities.length === 0 ? (
          <div className="py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading communities...</p>
          </div>
        ) : communities.length === 0 ? (
          <CommandEmpty>No communities found</CommandEmpty>
        ) : (
          <CommandGroup heading="Communities">
            {communities.map((community) => (
              <CommandItem
                key={community.name}
                value={community.name}
                onSelect={() => onSelect(community.name)}
                className="flex items-center gap-2 py-2 px-2 cursor-pointer"
              >
                {community.image ? (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={community.image} alt={community.name} />
                    <AvatarFallback>{community.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">{community.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{community.name}</p>
                  
                  <div className="flex items-center gap-1 mt-0.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {community.membersCount.toLocaleString()} members
                    </span>
                  </div>
                </div>
                
                {selectedCommunity === community.name && (
                  <Badge variant="secondary" className="ml-auto text-xs">Selected</Badge>
                )}
              </CommandItem>
            ))}
            
            {isLoading && communities.length > 0 && (
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
