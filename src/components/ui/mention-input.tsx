
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { AtSign, Hash } from 'lucide-react';
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
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const lastSelectionStart = useRef<number>(0);
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    
    // Combine the forwarded ref with our internal ref
    const combinedRef = (node: HTMLTextAreaElement) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      textareaRef.current = node;
    };

    // Calculate popover position based on cursor position
    const calculatePopoverPosition = () => {
      if (!textareaRef.current) return { top: 0, left: 0 };
      
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      
      // Get the text content up to the cursor
      const textBeforeCursor = value.substring(0, cursorPos);
      
      // Create a mirror div with same styling as textarea
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
      mirror.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
      
      // Find the last line break
      const lastLineBreakIndex = textBeforeCursor.lastIndexOf('\n');
      const textInCurrentLine = lastLineBreakIndex >= 0 
        ? textBeforeCursor.substring(lastLineBreakIndex + 1) 
        : textBeforeCursor;
      
      mirror.textContent = textInCurrentLine;
      
      // Create a span at the cursor position
      const span = document.createElement('span');
      span.id = 'cursor-position';
      mirror.appendChild(span);
      
      // Add to DOM, measure, then remove
      document.body.appendChild(mirror);
      const spanPosition = document.getElementById('cursor-position')?.getBoundingClientRect();
      document.body.removeChild(mirror);
      
      if (!spanPosition) return { top: 0, left: 0 };
      
      const textareaPosition = textarea.getBoundingClientRect();
      
      // Measure vertical position (how many lines down)
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
      const lineCount = (textBeforeCursor.match(/\n/g) || []).length;
      const verticalOffset = lineCount * lineHeight;
      
      // Calculate exact position
      return {
        top: spanPosition.height + (verticalOffset) + 8, // Add some spacing
        left: Math.min(spanPosition.width, textareaPosition.width - 250) // Prevent overflow
      };
    };

    // Check for mention triggers (@ or /c/)
    const checkForMentionTriggers = (text: string, cursorPos: number) => {
      if (!textareaRef.current) return;
      
      // Get text before cursor
      const textBeforeCursor = text.substring(0, cursorPos);
      
      // Check for @ mentions - find the last @ before cursor that's not part of a word
      const atMatch = /@(\S*)$/.exec(textBeforeCursor);
      
      // Check for /c/ community mentions
      const communityMatch = /\/c\/(\S*)$/.exec(textBeforeCursor);
      
      if (atMatch) {
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
        
        if (filtered.length > 0) {
          const position = calculatePopoverPosition();
          setPopoverPosition(position);
        }
      } else if (communityMatch) {
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
        
        if (filtered.length > 0) {
          const position = calculatePopoverPosition();
          setPopoverPosition(position);
        }
      } else {
        // No triggers found
        setShowSuggestions(false);
      }
    };

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      lastSelectionStart.current = cursorPos;
      
      onChange(newValue);
      checkForMentionTriggers(newValue, cursorPos);
    };

    // Handle selection change to update suggestions
    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const cursorPos = (e.target as HTMLTextAreaElement).selectionStart;
      lastSelectionStart.current = cursorPos;
      checkForMentionTriggers(value, cursorPos);
    };

    // Handle key presses for navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

    // Handle selection of a suggestion
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
      }, 0);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          suggestionsRef.current && 
          !suggestionsRef.current.contains(event.target as Node) && 
          textareaRef.current && 
          !textareaRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Recalculate position when window resizes
    useEffect(() => {
      const handleResize = () => {
        if (showSuggestions) {
          const position = calculatePopoverPosition();
          setPopoverPosition(position);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [showSuggestions]);

    return (
      <div className="relative w-full">
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
            ref={suggestionsRef}
          >
            <div className="w-56 bg-popover text-popover-foreground rounded-md border shadow-sm overflow-hidden">
              <div className="text-xs text-muted-foreground px-2 py-1.5">
                {suggestionType === 'user' ? 'Suggested Users' : 'Suggested Communities'}
                <span className="text-xs ml-1 opacity-60">(Tab to select)</span>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
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
        )}
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
