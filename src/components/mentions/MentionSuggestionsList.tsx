import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface SuggestionItem {
  id: string; // Unique identifier (e.g., username or community handle/name)
  display: string; // Primary display text (e.g., username or community name)
  subDisplay?: string; // Secondary display text (e.g., c/handle)
  image?: string; // URL for avatar/image
  type: 'user' | 'community';
}

interface MentionSuggestionsListProps {
  suggestions: SuggestionItem[];
  isLoading: boolean;
  onSelect: (suggestion: SuggestionItem) => void;
  mentionType: 'user' | 'community' | null;
  highlightedIndex?: number;
  onItemHover?: (index: number) => void;
}

export const MentionSuggestionsList: React.FC<MentionSuggestionsListProps> = ({
  suggestions,
  isLoading,
  onSelect,
  mentionType,
  highlightedIndex,
  onItemHover
}) => {
  if (isLoading) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-md p-4 flex items-center justify-center min-h-[80px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
        <div className="bg-background border border-border rounded-lg shadow-md p-4 text-center text-sm text-muted-foreground min-h-[80px] flex items-center justify-center">
            No {mentionType === 'user' ? 'users' : 'communities'} found.
        </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-lg shadow-md overflow-hidden max-h-[200px]"> 
      <ScrollArea className="h-full">
        <div className="p-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => onItemHover && onItemHover(index)}
              className={cn(
                'w-full text-left p-2 flex items-center gap-2 rounded hover:bg-muted focus:bg-muted focus:outline-none',
                'transition-colors duration-100 ease-in-out',
                index === highlightedIndex ? 'bg-muted' : ''
              )}
              aria-label={`Select ${suggestion.display}`}
              ref={el => {
                if (index === highlightedIndex && el) {
                  el.scrollIntoView({ block: 'nearest' });
                }
              }}
            >
              <Avatar className="h-7 w-7 flex-shrink-0">
                {suggestion.image ? (
                  <AvatarImage src={suggestion.image} alt={suggestion.display} />
                ) : (
                  suggestion.type === 'user' ? <User className="h-4 w-4"/> : <Users className="h-4 w-4"/>
                )}
                <AvatarFallback>{suggestion.display.substring(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium truncate">{suggestion.display}</p>
                {suggestion.subDisplay && (
                  <p className="text-xs text-muted-foreground truncate">{suggestion.subDisplay}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}; 