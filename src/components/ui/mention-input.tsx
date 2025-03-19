
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

    // Combine the forwarded ref with our internal ref
    const combinedRef = (node: HTMLTextAreaElement) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      textareaRef.current = node;
    };

    useEffect(() => {
      // Check if we need to show suggestions
      const checkForMentionTriggers = () => {
        if (!textareaRef.current) return;
        
        const curPos = textareaRef.current.selectionStart;
        const textBeforeCursor = value.substring(0, curPos);
        
        // Check for @mention
        const atIndex = textBeforeCursor.lastIndexOf('@');
        const hasAtTrigger = atIndex >= 0 && 
                            (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ' || textBeforeCursor[atIndex - 1] === '\n');
        
        // Check for /c/ for community
        const cIndex = textBeforeCursor.lastIndexOf('/c/');
        const hasCTrigger = cIndex >= 0 && 
                           (cIndex === 0 || textBeforeCursor[cIndex - 1] === ' ' || textBeforeCursor[cIndex - 1] === '\n');
        
        if (hasAtTrigger && (!hasCTrigger || atIndex > cIndex)) {
          // Handle @mention
          const searchText = textBeforeCursor.substring(atIndex + 1);
          if (searchText.includes(' ')) {
            // Space found, stop suggesting
            setIsSuggesting(false);
          } else {
            setIsSuggesting(true);
            setSuggestionType('user');
            setSearchTerm(searchText);
            setCursorPosition(curPos);
            
            const filtered = USERS.filter(user => 
              user.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredSuggestions(filtered);
          }
        } else if (hasCTrigger) {
          // Handle /c/ for community
          const searchText = textBeforeCursor.substring(cIndex + 3);
          if (searchText.includes(' ') || searchText.includes('/')) {
            // Space or slash found, stop suggesting
            setIsSuggesting(false);
          } else {
            setIsSuggesting(true);
            setSuggestionType('community');
            setSearchTerm(searchText);
            setCursorPosition(curPos);
            
            const filtered = COMMUNITIES.filter(community => 
              community.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredSuggestions(filtered);
          }
        } else {
          setIsSuggesting(false);
        }
      };
      
      checkForMentionTriggers();
    }, [value, textareaRef.current?.selectionStart]);

    const handleSelectSuggestion = (suggestion: string) => {
      if (!textareaRef.current) return;
      
      const currentText = value;
      let startPos: number;
      let endPos: number;
      
      if (suggestionType === 'user') {
        // Find the position of the @ symbol
        startPos = currentText.substring(0, cursorPosition).lastIndexOf('@');
        endPos = cursorPosition;
        
        // Replace @partial with @selected_user
        const newText = 
          currentText.substring(0, startPos) + 
          `@${suggestion}` + 
          currentText.substring(endPos);
          
        onChange(newText);
        
        // Set cursor position after the inserted suggestion
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = startPos + suggestion.length + 1; // +1 for @
            textareaRef.current.selectionStart = newCursorPos;
            textareaRef.current.selectionEnd = newCursorPos;
            textareaRef.current.focus();
          }
        }, 0);
      } else if (suggestionType === 'community') {
        // Find the position of the /c/ tag
        startPos = currentText.substring(0, cursorPosition).lastIndexOf('/c/');
        endPos = cursorPosition;
        
        // Replace /c/partial with /c/selected_community
        const newText = 
          currentText.substring(0, startPos) + 
          `/c/${suggestion}` + 
          currentText.substring(endPos);
          
        onChange(newText);
        
        // Set cursor position after the inserted suggestion
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = startPos + suggestion.length + 3; // +3 for /c/
            textareaRef.current.selectionStart = newCursorPos;
            textareaRef.current.selectionEnd = newCursorPos;
            textareaRef.current.focus();
          }
        }, 0);
      }
      
      setIsSuggesting(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isSuggesting && e.key === 'Escape') {
        setIsSuggesting(false);
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
            onFocus={onFocus}
            className={`${className} resize-none`}
            style={{ minHeight, maxHeight }}
          />
        </div>
        
        <Popover open={isSuggesting} onOpenChange={setIsSuggesting}>
          <PopoverTrigger asChild>
            <div className="absolute top-0 left-0 h-0 w-0 overflow-hidden" />
          </PopoverTrigger>
          <PopoverContent 
            className="w-60 p-0" 
            align="start" 
            sideOffset={5} 
            alignOffset={-20}
          >
            <Command>
              <CommandList>
                <CommandGroup heading={suggestionType === 'user' ? 'Users' : 'Communities'}>
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        onSelect={() => handleSelectSuggestion(suggestion)}
                        className="flex items-center gap-2"
                      >
                        {suggestionType === 'user' ? (
                          <AtSign className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Hash className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{suggestion}</span>
                      </CommandItem>
                    ))
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No {suggestionType === 'user' ? 'users' : 'communities'} found
                    </div>
                  )}
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
