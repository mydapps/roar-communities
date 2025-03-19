
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { AtSign, Hash } from 'lucide-react';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

// Mock data for demonstration
const USERS = [
  'vitalik.eth',
  'satoshi.btc',
  'hayden.uni',
  'alice.lens',
  'bob.eth',
  'crypto_researcher',
  'data_wizard',
  'defi_maxi',
  'zero_knowledge',
  'alex.sol',
];

const COMMUNITIES = [
  'Ethereum Devs',
  'DeFi Explorers',
  'NFT Creators',
  'Web3 Gaming',
  'DAO Governance',
  'Solana Builders',
  'ZK Research',
  'Layer 2 Solutions',
  'Metaverse Architects',
  'Governance Models',
];

type SuggestionType = 'user' | 'community';

interface MentionInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  onFocus?: () => void;
  minHeight?: string;
  maxHeight?: string;
}

export const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(
  ({ placeholder, value, onChange, className, onFocus, minHeight = '80px', maxHeight = '300px' }, ref) => {
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionType, setSuggestionType] = useState<SuggestionType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const popoverTargetRef = useRef<HTMLDivElement>(null);
    const [suppressSuggestions, setSuppressSuggestions] = useState(false);

    // Combine the forwarded ref with our internal ref
    const combinedRef = (node: HTMLTextAreaElement) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      textareaRef.current = node;
    };

    // Function to check if we need to show suggestions
    const checkForMentionTriggers = () => {
      if (!textareaRef.current || suppressSuggestions) return;
      
      const curPos = textareaRef.current.selectionStart;
      const textBeforeCursor = value.substring(0, curPos);
      
      // Check for @mention
      const atMatch = /@(\w*)$/.exec(textBeforeCursor);
      const hasAtTrigger = atMatch !== null;
      
      // Check for /c/ for community
      const communityMatch = /\/c\/(\w*)$/.exec(textBeforeCursor);
      const hasCommunityTrigger = communityMatch !== null;
      
      if (hasAtTrigger && (!hasCommunityTrigger || atMatch.index > communityMatch?.index || 0)) {
        // Handle @mention
        const searchText = atMatch[1];
        if (searchText.length >= 1) {
          setIsSuggesting(true);
          setSuggestionType('user');
          setSearchTerm(searchText);
          setCursorPosition(curPos);
          
          const filtered = USERS.filter(user => 
            user.toLowerCase().includes(searchText.toLowerCase())
          );
          setFilteredSuggestions(filtered.length > 0 ? filtered : []);
        } else {
          // Show all users if just @ is typed
          setIsSuggesting(true);
          setSuggestionType('user');
          setSearchTerm('');
          setCursorPosition(curPos);
          setFilteredSuggestions(USERS);
        }
      } else if (hasCommunityTrigger) {
        // Handle /c/ for community
        const searchText = communityMatch[1];
        if (searchText.length >= 1) {
          setIsSuggesting(true);
          setSuggestionType('community');
          setSearchTerm(searchText);
          setCursorPosition(curPos);
          
          const filtered = COMMUNITIES.filter(community => 
            community.toLowerCase().includes(searchText.toLowerCase())
          );
          setFilteredSuggestions(filtered.length > 0 ? filtered : []);
        } else {
          // Show all communities if just /c/ is typed
          setIsSuggesting(true);
          setSuggestionType('community');
          setSearchTerm('');
          setCursorPosition(curPos);
          setFilteredSuggestions(COMMUNITIES);
        }
      } else {
        setIsSuggesting(false);
      }
    };
    
    // Check for mention triggers when content or cursor position changes
    useEffect(() => {
      checkForMentionTriggers();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, textareaRef.current?.selectionStart]);

    // Handle when user selects a suggestion
    const handleSelectSuggestion = (suggestion: string) => {
      if (!textareaRef.current) return;
      
      const currentText = value;
      let beforeMatch: string;
      let afterMatch: string;
      let newText: string;
      
      if (suggestionType === 'user') {
        const atIndex = currentText.lastIndexOf('@', cursorPosition);
        beforeMatch = currentText.substring(0, atIndex);
        afterMatch = currentText.substring(cursorPosition);
        
        // Replace @partial with @selected_user
        newText = beforeMatch + '@' + suggestion + ' ' + afterMatch;
      } else if (suggestionType === 'community') {
        const communityIndex = currentText.lastIndexOf('/c/', cursorPosition);
        beforeMatch = currentText.substring(0, communityIndex);
        afterMatch = currentText.substring(cursorPosition);
        
        // Replace /c/partial with /c/selected_community
        newText = beforeMatch + '/c/' + suggestion + ' ' + afterMatch;
      } else {
        return;
      }
      
      onChange(newText);
      
      // Temporarily suppress suggestions to prevent the popup from immediately reappearing
      setSuppressSuggestions(true);
      setTimeout(() => setSuppressSuggestions(false), 100);
      
      // Close suggestions
      setIsSuggesting(false);
      
      // Set cursor position after the inserted suggestion and space
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = suggestionType === 'user' 
            ? beforeMatch.length + suggestion.length + 2  // +2 for @ and space
            : beforeMatch.length + suggestion.length + 4; // +4 for /c/ and space
          
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
          textareaRef.current.focus();
        }
      }, 10);
    };

    // Handle key events for keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isSuggesting && filteredSuggestions.length > 0) {
        if (e.key === 'Tab' || e.key === 'Enter') {
          // Select the first suggestion with Tab or Enter
          e.preventDefault();
          handleSelectSuggestion(filteredSuggestions[0]);
        } else if (e.key === 'Escape') {
          // Close suggestions with Escape
          e.preventDefault();
          setIsSuggesting(false);
        } else if (e.key === 'ArrowDown' && filteredSuggestions.length > 1) {
          // Move selection down (would need additional state for selection index)
          e.preventDefault();
        } else if (e.key === 'ArrowUp' && filteredSuggestions.length > 1) {
          // Move selection up (would need additional state for selection index)
          e.preventDefault();
        }
      }
    };

    return (
      <div className="relative w-full">
        <div className="relative w-full" ref={popoverTargetRef}>
          <Textarea
            ref={combinedRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              onFocus?.();
              checkForMentionTriggers();
            }}
            className={`${className} resize-none`}
            style={{ minHeight, maxHeight }}
          />
        </div>
        
        <Popover 
          open={isSuggesting && filteredSuggestions.length > 0} 
          onOpenChange={(open) => {
            if (!open) setIsSuggesting(false);
          }}
        >
          <PopoverTrigger asChild>
            <div className="absolute top-0 left-0 h-0 w-0 overflow-hidden" />
          </PopoverTrigger>
          <PopoverContent 
            className="w-72 p-0 shadow-lg" 
            align="start" 
            sideOffset={5}
            alignOffset={-5}
          >
            <Command>
              <CommandList className="max-h-[300px]">
                <CommandGroup heading={suggestionType === 'user' ? `Users matching "${searchTerm || ''}"` : `Communities matching "${searchTerm || ''}"`}>
                  {filteredSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                      className="flex items-center gap-2 cursor-pointer hover:bg-accent"
                    >
                      {suggestionType === 'user' ? (
                        <AtSign className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <Hash className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <span className="flex-1 truncate">{suggestion}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

MentionInput.displayName = 'MentionInput';

// This component is responsible for rendering the content with hyperlinks
export const MentionContent = ({ content }: { content: string }) => {
  // Function to convert plain text with mentions to JSX with links
  const renderContentWithMentions = () => {
    // Regex patterns for finding mentions
    const userPattern = /@([\w.]+)/g;
    const communityPattern = /\/c\/([\w\s]+)/g;
    
    // Break the content into parts based on mentions
    let lastIndex = 0;
    const parts: JSX.Element[] = [];
    let match;
    
    // Add user mentions
    const contentWithUserMentions = content.replace(userPattern, (match, username) => {
      return `<a href="/u/${username}" class="text-primary hover:underline">@${username}</a>`;
    });
    
    // Add community mentions to the already processed content
    const finalContent = contentWithUserMentions.replace(communityPattern, (match, community) => {
      return `<a href="/c/${community}" class="text-primary hover:underline">/c/${community}</a>`;
    });
    
    // Use dangerouslySetInnerHTML since we're building the HTML ourselves
    return <span dangerouslySetInnerHTML={{ __html: finalContent }} />;
  };
  
  return (
    <div className="mention-content text-sm text-foreground/90 leading-relaxed">
      {renderContentWithMentions()}
    </div>
  );
};
