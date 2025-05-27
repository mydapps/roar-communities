import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X, ImageIcon, VideoIcon, Loader2, AtSign, Hash, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import { MentionSuggestionsList, SuggestionItem } from '@/components/mentions/MentionSuggestionsList';
import { searchUsers, searchCommunities, SearchUserItem, SearchCommunityItem } from '@/utils/searchApi';
import { debounce } from 'lodash';
import EmojiPicker, { EmojiClickData, EmojiStyle, Categories } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MobileCommentInputProps {
  postCode: string;
  isReplyMode?: boolean;
  replyToComment?: {
    id: number;
    author: string;
    avatar: string;
    content: string;
    level2ParentId?: number;
  };
  onSubmit: (content: string, parentId?: number) => Promise<void>;
  onCancel?: () => void;
}

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
  } else if (lastSlashC > lastAt && lastSlashC + 2 < cursorPos) { // Ensure /c/ is valid trigger start
    triggerPos = lastSlashC;
    trigger = '/c/';
  } else if (lastSlashC === lastAt && lastAt !== -1) { // Handle case where one might be prefix of other (less likely but possible)
      triggerPos = lastAt;
      trigger = '@';
  }
  
  if (triggerPos === -1) return null;
  
  const triggerLength = trigger === '@' ? 1 : 3; // Length of '@' or '/c/'
  const queryStartPos = triggerPos + triggerLength;
  
  // Ensure cursor is actually after the trigger pattern
  if(cursorPos < queryStartPos) return null;

  // Check for space immediately after trigger only if query is empty
  if (cursorPos === queryStartPos && text.charAt(queryStartPos) === ' ') {
      return null;
  }
  
  const query = text.substring(queryStartPos, cursorPos);
  
  // Check if query contains newline or space 
  if (query.match(/\s/) || query.match(/\n/)) {
    return null;
  }
  
  // Minimum query length check
  if (query.length < 2) {
    // Keep showing suggestions=false but don't clear type/pos yet 
    // to allow user to continue typing
    return null;
  }

  return { trigger, query, startPos: triggerPos };
};

const customEmojisConfig = [
  { id: 'angry', names: ['angry'], imgUrl: '/emojis/angry.png' },
  { id: 'bitcoin', names: ['bitcoin'], imgUrl: '/emojis/bitcoin.png' },
  { id: 'cool', names: ['cool'], imgUrl: '/emojis/cool.png' },
  { id: 'ethereum', names: ['ethereum'], imgUrl: '/emojis/ethereum.png' },
  { id: 'happy', names: ['happy'], imgUrl: '/emojis/happy.png' },
  { id: 'mindblown', names: ['mindblown'], imgUrl: '/emojis/mindblown.png' },
  { id: 'party', names: ['party'], imgUrl: '/emojis/party.png' },
  { id: 'sad', names: ['sad'], imgUrl: '/emojis/sad.png' },
  { id: 'scared', names: ['scared'], imgUrl: '/emojis/scared.png' },
  { id: 'sleepy', names: ['sleepy'], imgUrl: '/emojis/sleepy.png' },
  { id: 'solana', names: ['solana'], imgUrl: '/emojis/solana.png' },
  { id: 'thinking', names: ['thinking'], imgUrl: '/emojis/thinking.png' },
  { id: 'angelic', names: ['angelic'], imgUrl: '/emojis/angelic.png' },
  { id: 'devilish', names: ['devilish'], imgUrl: '/emojis/devilish.png' },
  { id: 'inlove', names: ['inlove'], imgUrl: '/emojis/inlove.png' },
  { id: 'pleading', names: ['pleading'], imgUrl: '/emojis/pleading.png' },
  { id: 'surprised', names: ['surprised'], imgUrl: '/emojis/surprised.png' },
];

const emojiPickerCategoryConfig = [
  { category: Categories.SUGGESTED, name: 'Suggested' },
  { category: Categories.CUSTOM, name: 'Roar Emojis' },
  { category: Categories.SMILEYS_PEOPLE, name: 'Smileys & People' },
  { category: Categories.ANIMALS_NATURE, name: 'Animals & Nature' },
  { category: Categories.FOOD_DRINK, name: 'Food & Drink' },
  { category: Categories.TRAVEL_PLACES, name: 'Travel & Places' },
  { category: Categories.ACTIVITIES, name: 'Activities' },
  { category: Categories.OBJECTS, name: 'Objects' },
  { category: Categories.SYMBOLS, name: 'Symbols' },
  { category: Categories.FLAGS, name: 'Flags' },
];

export const MobileCommentInput: React.FC<MobileCommentInputProps> = ({
  postCode,
  isReplyMode = false,
  replyToComment,
  onSubmit,
  onCancel
}) => {
  const [isExpanded, setIsExpanded] = useState(isReplyMode);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  // --- Mention State ---
  const [mentionType, setMentionType] = useState<'user' | 'community' | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [mentionLoading, setMentionLoading] = useState<boolean>(false);
  const [activeTriggerPos, setActiveTriggerPos] = useState<number | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  // --- End Mention State ---

  // Get user info from localStorage
  const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
  const isLoggedIn = !!localStorage.getItem('dapps_user_id');

  // Update expanded state when isReplyMode changes
  useEffect(() => {
    setIsExpanded(isReplyMode);
  }, [isReplyMode]);

  useEffect(() => {
    // Auto-focus the textarea when expanded
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
    // Close suggestions if input loses focus or collapses
    if (!isExpanded) {
        setShowSuggestions(false);
    }
  }, [isExpanded]);

  // --- Mention Logic ---
  const fetchSuggestionsDebounced = useCallback(
    debounce(async (type: 'user' | 'community', query: string) => {
      if (query.length < 2) {
          setShowSuggestions(false); // Hide if query becomes too short
          return;
      }
      setMentionLoading(true);
      setSuggestions([]); // Clear previous suggestions
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
        // Filter for unique suggestions before setting state
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
    setContent(textarea.value);

    const triggerInfo = getTriggerInfo(textarea);

    if (triggerInfo) {
      const currentMentionType = triggerInfo.trigger === '@' ? 'user' : 'community';
      // Only update state and fetch if query/type actually changed
      if (triggerInfo.query !== mentionQuery || currentMentionType !== mentionType) {
        setMentionType(currentMentionType);
        setMentionQuery(triggerInfo.query);
        setActiveTriggerPos(triggerInfo.startPos);
        setShowSuggestions(true); 
        fetchSuggestionsDebounced(currentMentionType, triggerInfo.query);
      } else if (!showSuggestions && suggestions.length > 0) {
          // Re-show suggestions if user types matching previous query without closing
          setShowSuggestions(true);
      }
    } else {
      if(showSuggestions) {
         // If no valid trigger/query at cursor, hide suggestions
         setShowSuggestions(false);
      }
      // Optionally clear query/type immediately or wait for suggestions to hide
      // setMentionQuery(''); 
      // setMentionType(null);
      // setActiveTriggerPos(null);
    }
  };

  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    if (inputRef.current && activeTriggerPos !== null && mentionType) {
      const currentText = inputRef.current.value;
      const currentCursorPos = inputRef.current.selectionStart;
      
      // Use handle for community if available for the mention text itself
      const mentionId = suggestion.type === 'community' && suggestion.id.includes('/') ? suggestion.id.split('/')[1] : suggestion.id;
      const mentionText = mentionType === 'user' ? `@${mentionId} ` : `/c/${mentionId} `;
      
      const textBefore = currentText.substring(0, activeTriggerPos);
      const textAfter = currentText.substring(currentCursorPos);
      
      const newText = textBefore + mentionText + textAfter;
      setContent(newText);
      
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
    }
  };
  // --- End Mention Logic ---

  // Handle when users click on the input area
  const handleInputClick = () => {
    if (!isLoggedIn) {
      toast.info('Login Required', {
        description: 'You need to be logged in to join the conversation',
        action: {
          label: 'Login',
          onClick: () => navigate('/index'),
        },
      });
      return;
    }
    setIsExpanded(true);
  };

  // Handle successful media upload
  const handleMediaUploaded = (media: MediaUploadResponse) => {
    if (uploadedMedia) {
      toast.error("You can only attach one image or video per reply.");
      return;
    }
    if (!media || typeof media !== 'object' || !media.type || !media.url) {
      console.error("Invalid media object received:", media);
      toast.error('Invalid media data received from server');
      return;
    }
    setUploadedMedia(media);
    toast.success(`${media.type === 'image' ? 'Image' : 'Video'} added`);
  };

  // Remove media item by index
  const removeMedia = () => {
    setUploadedMedia(null);
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!content.trim() && !uploadedMedia) return;
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    let finalContent = content.trim();
    if (uploadedMedia && uploadedMedia.markdown) {
      finalContent += (finalContent.length > 0 ? "\n\n" : "") + uploadedMedia.markdown;
    }

    try {
      const parentId = replyToComment?.level2ParentId || replyToComment?.id;
      if (parentId && parentId < 0) {
        toast.error("Cannot reply to this comment yet. Please wait for it to be saved.");
        throw new Error("Cannot reply to an optimistic comment with ID: " + parentId);
      }
      await onSubmit(finalContent, parentId);
      setContent('');
      setUploadedMedia(null);
      setIsExpanded(false);
      if (onCancel && isReplyMode) onCancel();
      setShowSuggestions(false); // Hide suggestions on submit
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post your comment');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  // Handle cancel (for reply mode)
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setIsExpanded(false);
    }
    setContent('');
    setUploadedMedia(null);
    setShowSuggestions(false);
  };

  // Truncate comment content for reply preview
  const truncateContent = (text: string, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      const { selectionStart, selectionEnd } = textarea;
      const text = textarea.value;

      let emojiToInsert = '';
      if (emojiData.isCustom) {
        // For custom emojis, use the :id: format, emojiData.emoji contains the id for custom ones
        emojiToInsert = `:${emojiData.emoji}:`; 
      } else {
        // For standard emojis, use the emoji character itself
        emojiToInsert = emojiData.emoji;
      }

      const newText =
        text.substring(0, selectionStart) +
        emojiToInsert +
        text.substring(selectionEnd);
      setContent(newText);

      // Move cursor to after the inserted emoji
      const newCursorPosition = selectionStart + emojiToInsert.length;
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
      setIsEmojiPickerOpen(false); // Close the picker
    }
  };

  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-background border-t border-border/60 transition-all duration-300 ease-in-out z-50',
        isExpanded ? 'h-auto pt-3' : 'h-16 p-3'
      )}
      style={{
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}
    >
      {/* Container for Suggestions - positioned absolutely above the input area */} 
      <div ref={suggestionContainerRef} className="absolute bottom-full left-0 right-0 z-[60] mb-1 px-4">
        {showSuggestions && (
          <MentionSuggestionsList 
            suggestions={suggestions}
            isLoading={mentionLoading}
            onSelect={handleSuggestionSelect}
            mentionType={mentionType}
          />
        )}
      </div>

      {isReplyMode && isExpanded && replyToComment && (
        <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
          <div>
            <span className="font-medium">Replying to @{replyToComment.author.split('.')[0]}: </span>
            <span>{truncateContent(replyToComment.content)}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6" 
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex gap-3 items-start">
        <Avatar className={cn("flex-shrink-0", isExpanded ? "h-8 w-8 mt-1" : "h-8 w-8")}>
          <AvatarImage src={`https://img.dapps.co/avatar/${userAvatar}.svg`} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 relative">
          {isExpanded ? (
            <textarea
              ref={inputRef}
              value={content}
              onChange={handleContentChange}
              placeholder={isReplyMode ? `Reply to @${replyToComment?.author.split('.')[0]}...` : "Add a comment..."}
              className="w-full min-h-[60px] max-h-[180px] p-3 rounded-lg border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-sm bg-background resize-none"
              rows={2}
            />
          ) : (
            <div 
              className="w-full p-3 rounded-lg border border-border/60 bg-background text-muted-foreground text-sm cursor-pointer flex items-center h-10"
              onClick={handleInputClick}
            >
              Join the conversation
            </div>
          )}
          
          {/* Media Upload Area (only when expanded) */}
          {isExpanded && (
            <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-1">
              {!uploadedMedia && (
                        <>
                  <MediaUpload
                    onMediaUploaded={handleMediaUploaded}
                    acceptedTypes="image"
                    disabled={!!uploadedMedia || isSubmitting}
                  >
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 disabled:opacity-50 w-9 h-9 p-0" disabled={!!uploadedMedia || isSubmitting} title="Upload Image">
                                <ImageIcon className="h-5 w-5" />
                    </Button>
                  </MediaUpload>
                  <MediaUpload
                    onMediaUploaded={handleMediaUploaded}
                    acceptedTypes="video"
                    disabled={!!uploadedMedia || isSubmitting}
                  >
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 disabled:opacity-50 w-9 h-9 p-0" disabled={!!uploadedMedia || isSubmitting} title="Upload Video">
                                <VideoIcon className="h-5 w-5" />
                    </Button>
                  </MediaUpload>
                        </>
                    )}
                  {/* Emoji Picker Popover - Moved outside the !uploadedMedia condition */}
                  <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 disabled:opacity-50 w-9 h-9 p-0" disabled={isSubmitting} title="Add Emoji">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-0" side="top" align="end">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        autoFocusSearch={false}
                        emojiStyle={EmojiStyle.NATIVE}
                        height={300} 
                        customEmojis={customEmojisConfig}
                        categories={emojiPickerCategoryConfig}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={(!content.trim() && !uploadedMedia) || isSubmitting}
                  size="sm"
                  className="gap-1.5 h-8"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </Button>
            </div>
          )}
          
          {isExpanded && uploadedMedia && (
             <div className="mt-2 pb-1">
                 <MediaPreview media={uploadedMedia} onRemove={removeMedia} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
