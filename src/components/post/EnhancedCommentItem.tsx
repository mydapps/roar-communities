import React, { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Cat, Send, Loader2, ImageIcon, VideoIcon, Smile } from 'lucide-react';
import { CommentReply } from '@/utils/commentApi';
import { Link } from 'react-router-dom';
import { processTextContent } from '@/utils/textFormatting';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import { toast } from 'sonner';
import { MentionSuggestionsList, SuggestionItem } from '@/components/mentions/MentionSuggestionsList';
import { searchUsers, searchCommunities, SearchUserItem, SearchCommunityItem } from '@/utils/searchApi';
import { debounce } from 'lodash';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import EmojiPicker, { EmojiClickData, EmojiStyle, Categories } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EnhancedCommentItemProps {
  comment: CommentReply;
  postAuthorHandle: string;
  level?: number;
  maxLevel?: number;
  onMeowChange: (commentId: number, newState: boolean) => void;
  onReply: (parentId: number, content: string) => Promise<void>;
  isAuthorReplying?: boolean;
  isMobile?: boolean;
  onOpenMobileReply?: (commentId: number, handle: string, avatar: string, content: string, level2ParentId?: number) => void;
  level2ParentId?: number; // Track level 2 parent ID specifically
  optimisticToRealIdMap?: Record<number, number>; // Map from optimistic IDs to real IDs
  onInitiateMention?: (username: string) => void; // Added prop
}

export const EnhancedCommentItem = ({
  comment,
  postAuthorHandle,
  level = 1,
  maxLevel = 3,
  onMeowChange,
  onReply,
  isAuthorReplying = false,
  isMobile = false,
  onOpenMobileReply,
  level2ParentId,
  optimisticToRealIdMap = {},
  onInitiateMention
}: EnhancedCommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [meowAnimating, setMeowAnimating] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  
  // --- Mention State (for replies) ---
  const [mentionType, setMentionType] = useState<'user' | 'community' | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [mentionLoading, setMentionLoading] = useState<boolean>(false);
  const [activeTriggerPos, setActiveTriggerPos] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);
  // --- End Mention State ---
  
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  const isPostAuthor = comment.handle === postAuthorHandle;
  
  // Helper function to get real ID if available
  const getRealIdIfAvailable = (id: number): number => {
    return optimisticToRealIdMap[id] || id;
  };
  
  // Use real comment ID if this is an optimistic comment that's been mapped
  const commentRealId = getRealIdIfAvailable(comment.id);
  const currentLevel2ParentId = level === 2 ? commentRealId : level2ParentId;
  
  const handleMeow = () => {
    if (!comment.has_meowed) {
      setMeowAnimating(true);
      setTimeout(() => setMeowAnimating(false), 1000);
    }
    
    onMeowChange(comment.id, !comment.has_meowed);
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

  // Remove media
  const removeMedia = () => {
    setUploadedMedia(null);
  };
  
  // --- Mention Logic for Replies ---
  // Helper to get cursor position and text before it (copied from MobileCommentInput)
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

  const fetchReplySuggestionsDebounced = useCallback(
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
            // Assuming community 'name' is the correct field for mentions
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
        console.error(`Error fetching ${type} suggestions for reply:`, error);
        setShowSuggestions(false);
      } finally {
        setMentionLoading(false);
      }
    }, 300),
    []
  );

  const handleReplyContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setReplyContent(textarea.value);

    const triggerInfo = getTriggerInfo(textarea);

    if (triggerInfo) {
      const currentMentionType = triggerInfo.trigger === '@' ? 'user' : 'community';
      if (triggerInfo.query !== mentionQuery || currentMentionType !== mentionType) {
        setMentionType(currentMentionType);
        setMentionQuery(triggerInfo.query);
        setActiveTriggerPos(triggerInfo.startPos);
        setShowSuggestions(true);
        fetchReplySuggestionsDebounced(currentMentionType, triggerInfo.query);
      } else if (!showSuggestions && suggestions.length > 0) {
         setShowSuggestions(true);
      }
    } else {
      if(showSuggestions) {
         setShowSuggestions(false);
      }
    }
  };

  const handleReplySuggestionSelect = (suggestion: SuggestionItem) => {
    if (replyInputRef.current && activeTriggerPos !== null && mentionType) {
      const currentText = replyInputRef.current.value;
      
      const mentionId = suggestion.id; 
      const mentionText = mentionType === 'user' ? `@${mentionId} ` : `/c/${mentionId} `;
      
      const textBefore = currentText.substring(0, activeTriggerPos);

      const triggerCharLength = mentionType === 'user' ? 1 : 3;
      const endOfQueryToReplace = activeTriggerPos + triggerCharLength + mentionQuery.length;
      const textAfter = currentText.substring(endOfQueryToReplace);
      
      const newText = textBefore + mentionText + textAfter;
      setReplyContent(newText);
      
      const newCursorPos = activeTriggerPos + mentionText.length;
      setTimeout(() => {
          if(replyInputRef.current) {
            replyInputRef.current.focus();
            replyInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 0);

      setShowSuggestions(false);
      setMentionQuery('');
      setMentionType(null);
      setActiveTriggerPos(null);
      setHighlightedIndex(-1);
    }
  };

  // Keyboard navigation for reply suggestions
  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
          handleReplySuggestionSelect(suggestions[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
  };
  // --- End Mention Logic for Replies ---
  
  // --- Custom Emoji Config (can be moved to a shared util if used in more places) ---
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
  // --- End Custom Emoji Config ---
  
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() && !uploadedMedia) return;
    
    setIsSending(true);
    
    try {
      // Prepare content with media markdown if needed
      let finalContent = replyContent.trim();
      if (uploadedMedia && uploadedMedia.url) {
        // Ensure URL is properly formatted
        let mediaUrl = uploadedMedia.url;
        if (!mediaUrl.startsWith('http')) {
          if (mediaUrl.startsWith('//')) {
            mediaUrl = 'https:' + mediaUrl;
          } else if (mediaUrl.startsWith('/')) {
            mediaUrl = window.location.origin + mediaUrl;
          }
        }
        
        // Format the markdown - ensure there's proper spacing if there's already content
        const markdown = finalContent.length > 0 ? `\n\n![](${mediaUrl})` : `![](${mediaUrl})`;
        console.log('Adding media markdown to reply:', markdown);
        finalContent += markdown;
      }
      
      // If we're at level 3, use the level 2 parent ID as the target
      let targetId = commentRealId; // Default to replying directly to this comment
      
      if (level === 3 && level2ParentId) {
        // If we're at level 3, reply to the level 2 parent instead
        targetId = getRealIdIfAvailable(level2ParentId);
      }
      
      await onReply(targetId, finalContent);
      setReplyContent('');
      setUploadedMedia(null);
      setIsReplying(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleReplyClick = () => {
    if (isMobile && onOpenMobileReply) {
      // For level 3 comments on mobile, we need to pass level2ParentId
      if (level === 3 && level2ParentId) {
        // Pass the level 2 parent ID along with this comment's details
        onOpenMobileReply(comment.id, comment.handle, comment.avatar_url, comment.content, level2ParentId);
      } else {
      onOpenMobileReply(comment.id, comment.handle, comment.avatar_url, comment.content);
      }
    } else {
      setIsReplying(!isReplying);
    }
  };
  
  const getAvatarUrl = (avatarPath: string) => {
    if (avatarPath.includes('https://img.dapps.co/avatar/')) {
      return avatarPath;
    }
    return `https://img.dapps.co/avatar/${avatarPath}.svg`;
  };
  
  const formatUsername = (handle: string) => {
    return '@' + handle.split('.')[0];
  };

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation from Link
    e.stopPropagation();

    const usernameToMention = comment.handle.split('.')[0];

    if (isReplying && !isMobile && replyInputRef.current) {
      // Scenario A: Reply box within this item is open
      const currentReplyContent = replyInputRef.current.value;
      const mention = `@${usernameToMention} `;
      // Prepend if not already there, or handle smarter insertion if desired
      if (!currentReplyContent.startsWith(mention)) {
        setReplyContent(mention + currentReplyContent);
      }
      replyInputRef.current.focus();
      // Optionally move cursor after the mention
      setTimeout(() => {
        if (replyInputRef.current) {
          replyInputRef.current.setSelectionRange(mention.length, mention.length);
        }
      }, 0);
    } else {
      // Scenario B: Call parent to handle mention
      if (onInitiateMention) {
        onInitiateMention(usernameToMention);
      } else {
        console.log("Username clicked, parent handler (onInitiateMention) not provided.");
      }
    }
  };
  
  const onEmojiClickReply = (emojiData: EmojiClickData) => {
    if (replyInputRef.current) {
      const textarea = replyInputRef.current;
      const { selectionStart, selectionEnd } = textarea;
      const text = textarea.value;
      let emojiToInsert = '';
      if (emojiData.isCustom) {
        emojiToInsert = `:${emojiData.emoji}:`; 
      } else {
        emojiToInsert = emojiData.emoji;
      }
      const newText =
        text.substring(0, selectionStart) +
        emojiToInsert +
        text.substring(selectionEnd);
      setReplyContent(newText);
      const newCursorPosition = selectionStart + emojiToInsert.length;
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
      setIsEmojiPickerOpen(false);
    }
  };
  
  return (
    <div className={`${level > 1 ? 'ml-8 border-l-2 border-primary/10 pl-4' : ''}`}>
      <div className="flex gap-3">
        <Link to={`/u/${comment.handle.split('.')[0]}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={getAvatarUrl(comment.avatar_url)} />
            <AvatarFallback>{comment.handle[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              to={`/u/${comment.handle.split('.')[0]}`}
              className="font-medium text-sm hover:underline"
              onClick={handleUsernameClick}
            >
              {formatUsername(comment.handle)}
            </Link>
            
            {isPostAuthor && (
              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                OP
              </span>
            )}
            
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{comment.time_ago}</span>
          </div>
          
          <div 
            className="text-sm whitespace-pre-wrap break-words mt-1 prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-strong:font-semibold prose-em:italic"
          >
            {processTextContent(comment.content)}
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <Button 
              variant={comment.has_meowed ? "meow-active" : "meow"} 
              size="sm" 
              onClick={handleMeow}
              className="h-8 px-2 text-xs gap-1.5 rounded-full"
            >
              <div className="relative">
                <div className={`transition-all duration-300 ${meowAnimating ? 'scale-125' : ''}`}>
                  <Cat className={`h-3.5 w-3.5 ${comment.has_meowed ? 'text-amber-500' : ''}`} />
                </div>
                {meowAnimating && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping absolute h-5 w-5 rounded-full bg-amber-500/30"></div>
                    <div className="animate-ping delay-75 absolute h-7 w-7 rounded-full bg-amber-500/20"></div>
                  </div>
                )}
              </div>
              <span className={comment.has_meowed ? 'text-amber-500 font-medium' : ''}>
                {comment.meow_count}
              </span>
            </Button>
            
            {/* Always show the Reply button regardless of level */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReplyClick}
                className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
              >
                {isReplying && !isMobile ? 'Cancel' : 'Reply'}
              </Button>
          </div>
          
          {isReplying && !isMobile && (
            <form onSubmit={handleSubmitReply} className="mt-3 space-y-2">
              <div className="relative">
              <Textarea 
                  ref={replyInputRef}
                placeholder={`Reply to ${formatUsername(comment.handle)}...`}
                value={replyContent}
                  onChange={handleReplyContentChange}
                className="min-h-[60px] text-sm"
                  onKeyDown={handleReplyKeyDown}
                  onBlur={(e) => {
                    if (suggestionsContainerRef.current && 
                        !suggestionsContainerRef.current.contains(e.relatedTarget as Node | null)) {
                      setShowSuggestions(false);
                      setHighlightedIndex(-1);
                    }
                  }}
                  onFocus={(e) => {
                    const triggerInfo = getTriggerInfo(e.target);
                    if (triggerInfo && triggerInfo.query === mentionQuery && mentionType) {
                       if(suggestions.length > 0) setShowSuggestions(true);
                    }
                  }}
                />
                {showSuggestions && (
                  <div 
                    ref={suggestionsContainerRef}
                    className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg md:w-auto md:max-w-xs"
                  >
                    <MentionSuggestionsList
                      suggestions={suggestions}
                      isLoading={mentionLoading}
                      onSelect={handleReplySuggestionSelect}
                      mentionType={mentionType}
                      highlightedIndex={highlightedIndex}
                      onItemHover={setHighlightedIndex}
                    />
                  </div>
                )}
              </div>
              
              {/* Media Upload and Preview for inline reply */}
              {uploadedMedia && (
                <div className="mt-2">
                  <MediaPreview media={uploadedMedia} onRemove={removeMedia} />
                    </div>
              )}
              {/* Container for media buttons and submit button */}
              <div className="flex items-center justify-between pt-2">
                {/* Container for media icons + emoji icon */}
                <div className="flex items-center space-x-1">
                      <MediaUpload
                        onMediaUploaded={handleMediaUploaded}
                        acceptedTypes="image"
                    disabled={!!uploadedMedia || isSending}
                      >
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 h-8 w-8 disabled:opacity-50" disabled={!!uploadedMedia || isSending} title="Upload Image">
                      <ImageIcon className="h-4 w-4" />
                        </Button>
                      </MediaUpload>
                      <MediaUpload
                        onMediaUploaded={handleMediaUploaded}
                        acceptedTypes="video"
                    disabled={!!uploadedMedia || isSending}
                      >
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 h-8 w-8 disabled:opacity-50" disabled={!!uploadedMedia || isSending} title="Upload Video">
                      <VideoIcon className="h-4 w-4" />
                        </Button>
                      </MediaUpload>
                  <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 h-8 w-8" disabled={isSending} title="Add Emoji">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-0 z-50" side="top" align="end">
                      <EmojiPicker
                        onEmojiClick={onEmojiClickReply}
                        autoFocusSearch={false}
                        emojiStyle={EmojiStyle.NATIVE}
                        height={300}
                        customEmojis={customEmojisConfig}
                        categories={emojiPickerCategoryConfig}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Submit Button */}
                <Button type="submit" size="sm" disabled={isSending || (!replyContent.trim() && !uploadedMedia)} className="h-8">
                  {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                  Post
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {comment.sub_replies && comment.sub_replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.sub_replies.map(reply => (
            <EnhancedCommentItem 
              key={reply.id}
              comment={reply}
              postAuthorHandle={postAuthorHandle}
              level={level + 1}
              maxLevel={maxLevel}
              onMeowChange={onMeowChange}
              onReply={onReply}
              isAuthorReplying={reply.handle === postAuthorHandle}
              isMobile={isMobile}
              onOpenMobileReply={onOpenMobileReply}
              level2ParentId={currentLevel2ParentId}
              optimisticToRealIdMap={optimisticToRealIdMap}
              onInitiateMention={onInitiateMention}
            />
          ))}
        </div>
      )}
    </div>
  );
};
