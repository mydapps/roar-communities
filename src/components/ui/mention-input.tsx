
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
    const [suggestionType, setSuggestionType] = useState<SuggestionType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const popoverTargetRef = useRef<HTMLDivElement>(null);
    const lastKeyPressRef = useRef<string | null>(null);
    
    // Function to calculate the position where the popover should appear
    const calculatePopoverPosition = () => {
      if (!textareaRef.current) return { top: 0, left: 0 };
      
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      
      // Create a mirror div to calculate position
      const mirror = document.createElement('div');
      mirror.style.position = 'absolute';
      mirror.style.top = '0';
      mirror.style.left = '0';
      mirror.style.visibility = 'hidden';
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.wordWrap = 'break-word';
      mirror.style.width = window.getComputedStyle(textarea).width;
      mirror.style.padding = window.getComputedStyle(textarea).padding;
      mirror.style.font = window.getComputedStyle(textarea).font;
      
      // Copy the text up to the cursor
      const textBeforeCursor = value.substring(0, cursorPos);
      mirror.textContent = textBeforeCursor;
      
      // Create a span to mark the cursor position
      const span = document.createElement('span');
      span.id = 'mirror-cursor-position';
      mirror.appendChild(span);
      
      // Append to body, get position, then remove
      document.body.appendChild(mirror);
      const spanPosition = document.getElementById('mirror-cursor-position')?.getBoundingClientRect();
      document.body.removeChild(mirror);
      
      if (!spanPosition) return { top: 0, left: 0 };
      
      const textareaPosition = textarea.getBoundingClientRect();
      
      // Calculate relative position
      return {
        top: spanPosition.top - textareaPosition.top + 20, // 20px below the cursor
        left: Math.min(spanPosition.left - textareaPosition.left, textareaPosition.width - 250), // Prevent overflow
      };
    };

    // Combine the forwarded ref with our internal ref
    const combinedRef = (node: HTMLTextAreaElement) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      textareaRef.current = node;
    };

    // Function to check for mention triggers
    const checkForMentionTriggers = (text: string, cursorPos: number) => {
      if (!textareaRef.current) return;
      
      // Get text before cursor
      const textBeforeCursor = text.substring(0, cursorPos);
      
      // Match for @ mentions
      const atMatch = /@(\w*)$/.exec(textBeforeCursor);
      
      // Match for /c/ community mentions  
      const communityMatch = /\/c\/(\w*)$/.exec(textBeforeCursor);
      
      if (atMatch) {
        // Handle @ mentions
        const searchText = atMatch[1];
        setSuggestionType('user');
        setSearchTerm(searchText);
        setCursorPosition(cursorPos);
        
        const filtered = searchText === '' ? 
          USERS.slice(0, 5) : 
          USERS.filter(user => 
            user.toLowerCase().includes(searchText.toLowerCase())
          ).slice(0, 5);
          
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else if (communityMatch) {
        // Handle /c/ community mentions
        const searchText = communityMatch[1];
        setSuggestionType('community');
        setSearchTerm(searchText);
        setCursorPosition(cursorPos);
        
        const filtered = searchText === '' ? 
          COMMUNITIES.slice(0, 5) : 
          COMMUNITIES.filter(community => 
            community.toLowerCase().includes(searchText.toLowerCase())
          ).slice(0, 5);
          
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        // No triggers found
        setShowSuggestions(false);
      }
    };

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      
      onChange(newValue);
      checkForMentionTriggers(newValue, cursorPos);
    };

    // Handle cursor position changes
    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const cursorPos = (e.target as HTMLTextAreaElement).selectionStart;
      checkForMentionTriggers(value, cursorPos);
    };

    // Handle key presses for navigation through suggestions
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      lastKeyPressRef.current = e.key;
      
      if (!showSuggestions || filteredSuggestions.length === 0) return;
      
      // Tab or Enter to select the first suggestion
      if ((e.key === 'Tab' || e.key === 'Enter') && showSuggestions) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[0]);
      }
      
      // Escape to close suggestions
      else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    };

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
      setShowSuggestions(false);
      
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

    // Calculate popover position when suggestions change
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    
    useEffect(() => {
      if (showSuggestions) {
        const position = calculatePopoverPosition();
        setPopoverPosition(position);
      }
    }, [showSuggestions, searchTerm, value]);

    return (
      <div className="relative w-full">
        <div className="relative w-full" ref={popoverTargetRef}>
          <Textarea
            ref={combinedRef}
            value={value}
            onChange={handleChange}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            onFocus={onFocus}
            className={`${className} resize-none`}
            style={{ minHeight, maxHeight }}
          />
          
          {showSuggestions && (
            <div 
              className="absolute z-50"
              style={{ top: `${popoverPosition.top}px`, left: `${popoverPosition.left}px` }}
            >
              <div className="w-60 bg-popover text-popover-foreground rounded-md border shadow-md overflow-hidden">
                <div className="p-1">
                  <div className="text-xs text-muted-foreground px-2 py-1.5">
                    {suggestionType === 'user' ? 'Suggested Users' : 'Suggested Communities'}
                    <span className="text-xs ml-1 text-muted-foreground opacity-60">(Tab to select)</span>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredSuggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        {suggestionType === 'user' ? (
                          <AtSign className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        ) : (
                          <Hash className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
