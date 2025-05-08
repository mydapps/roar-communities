import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { CommentReply, createReply } from '@/utils/commentApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { MentionSuggestionsList, SuggestionItem } from '@/components/mentions/MentionSuggestionsList';
import { searchUsers, searchCommunities, SearchUserItem, SearchCommunityItem } from '@/utils/searchApi';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  user: string;
  text: string;
  timeAgo: string;
  avatarUrl?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ user, text, timeAgo, avatarUrl }) => {
  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={avatarUrl || `https://img.dapps.co/avatar/default.svg`} />
        <AvatarFallback>{user[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">{user}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm mt-1">{text}</p>
      </div>
    </div>
  );
};

interface CommentSectionProps {
  comments: CommentReply[];
  postCode: string;
  onAddComment: (comment: string | CommentReply) => void;
  username?: string;
  community?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  comments, 
  postCode,
  onAddComment,
  username,
  community
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  // --- Mention State ---
  const [mentionType, setMentionType] = useState<'user' | 'community' | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [mentionLoading, setMentionLoading] = useState<boolean>(false);
  const [activeTriggerPos, setActiveTriggerPos] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1); // For desktop
  // --- End Mention State ---

  // --- Mention Logic ---
  // Helper to get cursor position and text before it
  const getTriggerInfo = (textarea: HTMLTextAreaElement): { trigger: '@' | '/c/' | null; query: string; startPos: number } | null => {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    const textBeforeCursor = text.substring(0, cursorPos);
    
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const lastSlashC = textBeforeCursor.lastIndexOf('/c/');
    
    let triggerPos = -1;
    let trigger: '@' | '/c/' | null = null;
    
    if (lastAt > lastSlashC) {
      triggerPos = lastAt;
      trigger = '@';
    } else if (lastSlashC > lastAt && lastSlashC + 2 < cursorPos) { 
      triggerPos = lastSlashC;
      trigger = '/c/';
    } else if (lastSlashC === lastAt && lastAt !== -1) { 
        triggerPos = lastAt;
        trigger = '@';
    }
    
    if (triggerPos === -1) return null;
    
    const triggerLength = trigger === '@' ? 1 : 3; 
    const queryStartPos = triggerPos + triggerLength;
    
    if(cursorPos < queryStartPos) return null;

    if (cursorPos === queryStartPos && text.charAt(queryStartPos) === ' ') {
        return null;
    }
    
    const query = text.substring(queryStartPos, cursorPos);
    
    if (query.match(/\s/) || query.match(/\n/)) {
      return null;
    }
    
    if (query.length < 2) {
      return null;
    }

    return { trigger, query, startPos: triggerPos };
  };

  const fetchSuggestionsDebounced = useCallback(
    debounce(async (type: 'user' | 'community', query: string) => {
      if (query.length < 2) {
        setShowSuggestions(false);
        return;
      }
      setMentionLoading(true);
      setSuggestions([]);
      try {
        let fetchedSuggestions: SuggestionItem[] = [];
        if (type === 'user') {
          const response = await searchUsers(query, 1, 5);
          if (response.success && response.users) {
            fetchedSuggestions = response.users.items.map((user: SearchUserItem) => ({
              id: user.handle,
              display: user.handle,
              image: user.avatar_url,
              type: 'user'
            }));
          }
        } else { // type === 'community'
          const response = await searchCommunities(query, 1, 5);
          if (response.success && response.communities) {
            fetchedSuggestions = response.communities.items.map((comm: SearchCommunityItem) => ({
              id: comm.name, 
              display: comm.name,
              subDisplay: `c/${comm.name}`,
              image: comm.image,
              type: 'community'
            }));
          }
        }
        const uniqueSuggestions = fetchedSuggestions.filter(
          (suggestion, index, self) =>
            index === self.findIndex((s) => s.id === suggestion.id && s.type === suggestion.type)
        );
        setSuggestions(uniqueSuggestions);
        setShowSuggestions(uniqueSuggestions.length > 0);
      } catch (error) {
        console.error(`Error fetching ${type} suggestions:`, error);
        setShowSuggestions(false);
      } finally {
        setMentionLoading(false);
      }
    }, 300),
    []
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setNewComment(textarea.value);

    const triggerInfo = getTriggerInfo(textarea);

    if (triggerInfo) {
      const currentMentionType = triggerInfo.trigger === '@' ? 'user' : 'community';
      if (triggerInfo.query !== mentionQuery || currentMentionType !== mentionType) {
        setMentionType(currentMentionType);
        setMentionQuery(triggerInfo.query);
        setActiveTriggerPos(triggerInfo.startPos);
        setShowSuggestions(true);
        setHighlightedIndex(-1); // Reset highlight when query changes
        fetchSuggestionsDebounced(currentMentionType, triggerInfo.query);
      } else if (!showSuggestions && suggestions.length > 0 && triggerInfo.query.length >=2) {
          // If query is same but suggestions were hidden, re-show them.
          setShowSuggestions(true);
      }
    } else {
      if(showSuggestions) {
         setShowSuggestions(false);
         setHighlightedIndex(-1);
      }
    }
  };

  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    if (inputRef.current && activeTriggerPos !== null && mentionType) {
      const currentText = inputRef.current.value;
      
      const mentionId = suggestion.id;
      const mentionText = mentionType === 'user' ? `@${mentionId} ` : `/c/${mentionId} `;
      
      const textBefore = currentText.substring(0, activeTriggerPos);
      
      const triggerCharLength = mentionType === 'user' ? 1 : 3;
      const endOfQueryToReplace = activeTriggerPos + triggerCharLength + mentionQuery.length;
      const textAfter = currentText.substring(endOfQueryToReplace);

      const newText = textBefore + mentionText + textAfter;
      setNewComment(newText);
      
      const newCursorPos = activeTriggerPos + mentionText.length;
      setTimeout(() => {
          if(inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 0);

      setShowSuggestions(false);
      setMentionQuery('');
      setMentionType(null);
      setActiveTriggerPos(null);
      setHighlightedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMobile) return; // Keyboard nav only for desktop

    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[highlightedIndex]);
        } else {
            // If no suggestion highlighted, but Enter is pressed with suggestions open
            // default to submitting the form if content is valid.
            // This might need adjustment based on desired UX.
            // For now, let form submit handle it if no suggestion selected.
             handleSubmit(e as any); // Or just let the form submit normally
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
  };
  // --- End Mention Logic ---
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      const response = await createReply(postCode, newComment);
      
      // Check if user is not part of the community
      if (!response.success && response.errCode === "004" && response.communityName) {
        // Show the not in community modal
        setCommunityName(response.communityName);
        setNotInCommunitySheetOpen(true);
        setSubmitting(false);
        return;
      }
      
      if (response.success) {
        const newCommentData: CommentReply = {
          id: response.reply_id || 0,
          handle: response.handle || 'you',
          content: newComment,
          time_ago: response.created_on || 'just now',
          avatar_url: response.avatar_url || 'https://img.dapps.co/avatar/default.svg',
          created_on: response.created_on || new Date().toISOString(),
          uid: 0, // Default value
          upvotes: 0,
          meow_count: 0,
          has_meowed: false
        };
        
        onAddComment(newCommentData);
        setNewComment('');
        // toast.success('Comment added successfully');
      } else {
        toast.error('Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleViewAllComments = () => {
    if (postCode) {
      if (community) {
        navigate(`/c/${community}/${postCode}`);
      } else if (username) {
        // Handle user post - navigate to /:handle/:postId
        const handle = username.split('.')[0]; // Remove domain part if present
        navigate(`/${handle}/${postCode}`);
      } else {
        // Fallback to generic post route
        navigate(`/post/${postCode}`);
      }
    }
  };
  
  return (
    <div className="space-y-3 mt-2 relative">
      {/* Mobile Suggestions (above input) */}
      {isMobile && showSuggestions && (
        <div 
          ref={suggestionsContainerRef}
          className="absolute bottom-full left-0 right-0 z-[60] mb-1 px-0 w-full"
        >
          <MentionSuggestionsList 
            suggestions={suggestions}
            isLoading={mentionLoading}
            onSelect={handleSuggestionSelect}
            mentionType={mentionType}
          />
        </div>
      )}
      
      {comments.length > 0 && (
        <div className="space-y-1 divide-y divide-border/30">
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id}
              user={comment.handle}
              text={comment.content}
              timeAgo={comment.time_ago}
              avatarUrl={comment.avatar_url}
            />
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 items-end mt-3 relative">
        {/* Desktop Suggestions (popover style, below input) */}
        {!isMobile && showSuggestions && (
          <div 
            ref={suggestionsContainerRef}
            className="absolute bottom-[calc(100%+5px)] left-0 z-10 w-full md:w-auto md:max-w-xs bg-background border border-border rounded-lg shadow-lg"
          >
            <MentionSuggestionsList
              suggestions={suggestions}
              isLoading={mentionLoading}
              onSelect={handleSuggestionSelect}
              mentionType={mentionType}
              highlightedIndex={highlightedIndex}
              onItemHover={setHighlightedIndex}
            />
          </div>
        )}
        <Textarea 
          ref={inputRef}
          placeholder="Add a comment..." 
          className="min-h-[60px] text-sm"
          value={newComment}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            const triggerInfo = getTriggerInfo(e.target as HTMLTextAreaElement);
            if (triggerInfo && triggerInfo.query === mentionQuery && mentionType && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={(e) => {
            if (!isMobile) {
              if (suggestionsContainerRef.current && 
                  !suggestionsContainerRef.current.contains(e.relatedTarget as Node | null)) {
                setShowSuggestions(false); 
                setHighlightedIndex(-1);
              }
            } else {
              // Simpler blur for mobile, or could also use ref if suggestion list is interactive on blur
              setTimeout(() => setShowSuggestions(false), 150);
            }
          }}
        />
        <Button 
          type="submit" 
          size="sm"
          className="shrink-0"
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      
      {comments.length > 0 && (
        <div className="text-center">
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={handleViewAllComments}
          >
            View all comments
          </Button>
        </div>
      )}
      
      {/* Modal that shows when user is not part of the community */}
      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </div>
  );
};
