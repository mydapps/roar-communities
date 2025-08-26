import React, { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Cat, Send, Loader2, ImageIcon, VideoIcon, Smile, Share2, MoreHorizontal, MessageSquare, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { CommentReply } from '@/utils/commentApi';
import { Link, useLocation } from 'react-router-dom';
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
import { GifPicker } from '@/components/ui/gif-picker';
import { AnimatedGifIcon } from '@/components/ui/animated-gif-icon';
import { useImageViewer } from '@/components/contexts/ImageViewerContext';
import { TipButton } from '@/components/tip/TipButton';
import { TipSheet } from '@/components/tip/TipSheet';
import { useTip } from '@/contexts/TipContext';

interface EnhancedCommentItemProps {
  comment: CommentReply;
  postAuthorHandle: string;
  postCode?: string; // Add postCode for comment tipping
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
  readOnly?: boolean;
}

export const EnhancedCommentItem = ({
  comment,
  postAuthorHandle,
  postCode,
  level = 1,
  maxLevel = 3,
  onMeowChange,
  onReply,
  isAuthorReplying = false,
  isMobile = false,
  onOpenMobileReply,
  level2ParentId,
  optimisticToRealIdMap = {},
  onInitiateMention,
  readOnly = false
}: EnhancedCommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [meowAnimating, setMeowAnimating] = useState(false);
  const [isTogglingMeow, setIsTogglingMeow] = useState(false); // NEW: Prevent multiple clicks
  const [meowStage, setMeowStage] = useState<'idle' | 'preparing' | 'meowing' | 'celebrating'>('idle'); // NEW: Animation stages
  const [showMeowText, setShowMeowText] = useState(false); // NEW: Show "Meow!" text
  const [showParticles, setShowParticles] = useState(false); // NEW: Particle effects
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
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [selectedGif, setSelectedGif] = useState<{ url: string; alt?: string } | null>(null);
  
  // Image viewer hook
  const { openImageViewer } = useImageViewer();
  
  // Tip functionality
  const { openTipSheet } = useTip();
  
  // Location hook for sharing
  const location = useLocation();
  
  // Extract images from comment content for the image viewer
  const extractImagesFromContent = useCallback((content: string): string[] => {
    const imageMarkdownRegex = /!\[\]\(([^)]+)\)/g;
    const images: string[] = [];
    let match;
    while ((match = imageMarkdownRegex.exec(content)) !== null) {
      const imageUrl = match[1].trim();
      if (imageUrl && !images.includes(imageUrl)) {
        // Check if it's an image by extension
        const extension = imageUrl.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
          images.push(imageUrl);
        }
      }
    }
    return images;
  }, []);
  
  // Handle image click to open in viewer
  const handleImageClick = useCallback((clickedImageUrl: string) => {
    const allImages = extractImagesFromContent(comment.content);
    const selectedIndex = allImages.findIndex(img => img === clickedImageUrl);
    openImageViewer(allImages, selectedIndex >= 0 ? selectedIndex : 0);
  }, [comment.content, extractImagesFromContent, openImageViewer]);
  
  const isPostAuthor = comment.handle === postAuthorHandle;
  
  // Helper function to get real ID if available
  const getRealIdIfAvailable = (id: number): number => {
    return optimisticToRealIdMap[id] || id;
  };
  
  // Use real comment ID if this is an optimistic comment that's been mapped
  const commentRealId = getRealIdIfAvailable(comment.id);
  const currentLevel2ParentId = level === 2 ? commentRealId : level2ParentId;
  
  // 🐱 SPECTACULAR MEOW ANIMATION SYSTEM
  const triggerMeowAnimation = useCallback(() => {
    // Stage 1: Preparing (cat gets ready)
    setMeowStage('preparing');
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => {
      // Stage 2: Meowing (the main event!)
      setMeowStage('meowing');
      setShowMeowText(true);
      setShowParticles(true);
    }, 200);
    
    setTimeout(() => {
      // Stage 3: Celebrating
      setMeowStage('celebrating');
    }, 800);
    
    setTimeout(() => {
      // Stage 4: Return to normal
      setMeowStage('idle');
      setShowMeowText(false);
      setShowParticles(false);
    }, 1800);
  }, []);
  
  const handleMeow = useCallback(async () => {
    // 🛡️ PREVENT MULTIPLE CLICKS
    if (isTogglingMeow) return;
    
    setIsTogglingMeow(true);
    const wasAlreadyMeowed = comment.has_meowed;
    
    try {
      // 🚀 INSTANT VISUAL FEEDBACK (only animate when meowing, not un-meowing)
      if (!wasAlreadyMeowed) {
        triggerMeowAnimation();
      }
      
      // 🎯 API CALL
      await onMeowChange(comment.id, !comment.has_meowed);
      
    } catch (error) {
      console.error('Meow failed:', error);
      // Reset animation state on error
      setMeowStage('idle');
      setShowMeowText(false);
      setShowParticles(false);
    } finally {
      // 🔓 RE-ENABLE BUTTON
      setIsTogglingMeow(false);
    }
  }, [comment.has_meowed, comment.id, isTogglingMeow, onMeowChange, triggerMeowAnimation]);
  
  // 🎨 GET ANIMATION CLASSES
  const getCatAnimationClasses = () => {
    switch (meowStage) {
      case 'preparing':
        return 'scale-110 -rotate-6 transition-all duration-200';
      case 'meowing':
        return 'scale-150 rotate-12 transition-all duration-300';
      case 'celebrating':
        return 'scale-125 -rotate-3 transition-all duration-200';
      default:
        return 'transition-all duration-200';
    }
  };
  
  // 🎊 PARTICLE ANIMATION COMPONENT
  const MeowParticles = () => {
    if (!showParticles) return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Heart particles */}
        <div className="absolute top-1 left-1 animate-bounce text-red-400 text-xs">💖</div>
        <div className="absolute top-0 right-1 animate-bounce delay-150 text-amber-400 text-xs">🐾</div>
        <div className="absolute bottom-1 left-0 animate-bounce delay-300 text-pink-400 text-xs">✨</div>
        
        {/* Ripple effects */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-ping absolute h-6 w-6 rounded-full bg-amber-500/40"></div>
          <div className="animate-ping delay-75 absolute h-8 w-8 rounded-full bg-amber-400/30"></div>
          <div className="animate-ping delay-150 absolute h-10 w-10 rounded-full bg-amber-300/20"></div>
        </div>
      </div>
    );
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
    
    if (!replyContent.trim() && !uploadedMedia && !selectedGif) return;
    
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
      
      // Add GIF if selected
      if (selectedGif && selectedGif.url) {
        const gifMarkdown = finalContent.length > 0 ? `\n\n![GIF](${selectedGif.url})` : `![GIF](${selectedGif.url})`;
        finalContent += gifMarkdown;
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
      setSelectedGif(null);
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
  
  const getAvatarUrl = (avatarPath: string | null | undefined) => {
    // Handle null, undefined, or empty values
    if (!avatarPath || avatarPath === 'null' || avatarPath === 'undefined') {
      return `https://img.dapps.co/avatar/default.svg`;
    }
    
    // Check if it's already a full URL
    if (avatarPath.includes('https://img.dapps.co/avatar/')) {
      return avatarPath;
    }
    
    return `https://img.dapps.co/avatar/${avatarPath}.svg`;
  };
  
  const formatUsername = (handle: string | null | undefined) => {
    if (!handle) return '@unknown';
    return '@' + handle.split('.')[0];
  };

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation from Link
    e.stopPropagation();

    const usernameToMention = comment.handle?.split('.')[0] || 'unknown';

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
        emojiToInsert = ` :${emojiData.emoji}: `; 
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

  const onGifSelect = (gifUrl: string) => {
    // Set the selected GIF for preview (don't modify text)
    setSelectedGif({ url: gifUrl, alt: 'Selected GIF' });
    setIsGifPickerOpen(false);
    toast.success('GIF added to your reply!');
    
    // Focus back to textarea
    if (replyInputRef.current) {
      replyInputRef.current.focus();
    }
  };

  const removeSelectedGif = () => {
    setSelectedGif(null);
  };
  
  // Share comment functionality
  const handleShareComment = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Get the current URL and add the comment hash
      const baseUrl = window.location.origin + location.pathname;
      const commentUrl = `${baseUrl}#comment-${commentRealId}`;
      
      // Try to use native share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: `Comment by ${formatUsername(comment.handle)}`,
          text: comment.content.length > 100 ? 
            comment.content.substring(0, 100) + '...' : 
            comment.content,
          url: commentUrl
        });
        return;
      }
      
      // Fallback to clipboard
      await navigator.clipboard.writeText(commentUrl);
      toast.success('Comment link copied to clipboard!');
    } catch (error) {
      // If clipboard fails, create a temporary textarea
      try {
        const baseUrl = window.location.origin + location.pathname;
        const commentUrl = `${baseUrl}#comment-${commentRealId}`;
        
        const textArea = document.createElement('textarea');
        textArea.value = commentUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast.success('Comment link copied to clipboard!');
      } catch (fallbackError) {
        toast.error('Failed to copy comment link');
      }
    }
  };
  
  // Check if this is a system message
  const isSystemMessage = comment.is_system_message || comment.handle === 'System';

  return (
    <div 
      id={`comment-${commentRealId}`}
      className={`${level > 1 ? 'ml-8 border-l-2 border-primary/10 pl-4' : ''} scroll-mt-4`}
    >
      {isSystemMessage ? (
        // System message layout - stylish design with panache
        <div className="relative">
          {/* Subtle glow background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 rounded-xl blur-sm"></div>
          
          <div className="relative flex gap-4 bg-gradient-to-r from-amber-50/30 via-orange-50/20 to-amber-50/30 dark:from-amber-900/10 dark:via-orange-900/10 dark:to-amber-900/10 rounded-xl p-4 border border-amber-200/30 dark:border-amber-800/30 shadow-sm">
            {/* Celebration icon with enhanced styling */}
            <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-full flex items-center justify-center shadow-sm border border-amber-200/50 dark:border-amber-700/50">
              <span className="text-xl animate-pulse">🎉</span>
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              {/* Timestamp with subtle styling */}
              <div className="flex items-center">
                <span className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium bg-amber-100/50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                  {comment.time_ago}
                </span>
              </div>
              
              {/* Message content with enhanced typography */}
              <div className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-relaxed">
                {comment.content}
              </div>
            </div>
            
            {/* Decorative accent line */}
            <div className="absolute left-4 right-4 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 dark:via-amber-600/40 to-transparent"></div>
          </div>
        </div>
      ) : (
        // Regular comment layout
        <div className="flex gap-3 group">
          <Link to={`/u/${comment.handle?.split('.')[0] || 'unknown'}`} onClick={(e) => e.stopPropagation()}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={getAvatarUrl(comment.avatar_url)} />
              <AvatarFallback>{comment.handle?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                to={`/u/${comment.handle?.split('.')[0] || 'unknown'}`}
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
              {processTextContent(comment.content, handleImageClick)}
            </div>
            
            <div className="flex items-center gap-3 mt-2">
              <Button 
                variant={comment.has_meowed ? "meow-active" : "meow"} 
                size="sm" 
                onClick={handleMeow}
                disabled={readOnly || isTogglingMeow}
                className={`h-8 px-2 text-xs gap-1.5 rounded-full relative overflow-hidden ${
                  isTogglingMeow ? 'cursor-wait opacity-80' : ''
                }`}
              >
                <div className="relative">
                  {/* 🐱 SPECTACULAR CAT ANIMATION */}
                  <div className={`${getCatAnimationClasses()}`}>
                    <Cat className={`h-3.5 w-3.5 ${
                      comment.has_meowed || meowStage !== 'idle' ? 'text-amber-500' : ''
                    }`} />
                  </div>
                  
                  {/* 🎊 AMAZING PARTICLE EFFECTS */}
                  <MeowParticles />
                </div>
                
                {/* 📝 DYNAMIC TEXT WITH PERSONALITY */}
                <span className={`transition-all duration-300 ${
                  comment.has_meowed ? 'text-amber-500 font-medium' : ''
                } ${showMeowText ? 'text-amber-500 font-bold animate-pulse' : ''}`}>
                  {showMeowText ? 'Meow! 🐱' : (isTogglingMeow ? '...' : comment.meow_count)}
                </span>
              </Button>
              
              {/* Always show the Reply button regardless of level, but disable in read-only mode */}
              {!readOnly && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleReplyClick}
                  className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
                >
                  {isReplying && !isMobile ? 'Cancel' : 'Reply'}
                </Button>
              )}
              
              {/* Tip button - only show for non-system messages and non-read-only mode */}
              {!isSystemMessage && !readOnly && (
                <TipButton
                  postCode={postCode || ''}
                  receiverHandle={comment.handle || ''}
                  onTipClick={() => openTipSheet({
                    postCode: postCode || '',
                    receiverHandle: comment.handle || '',
                    receiverAvatar: comment.avatar_url,
                    replyId: comment.id,
                    tipType: 'reply'
                  })}
                  tipCount={0} // TODO: Add tip count to comment data
                  hasUserTipped={false} // TODO: Add user tip status to comment data
                  className="h-8 px-2 text-xs gap-1.5 rounded-full"
                />
              )}
              
              {/* Share button - only visible on hover/focus */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShareComment}
                className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Share comment"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            {isReplying && !isMobile && !readOnly && (
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
                {/* GIF Preview for inline reply */}
                {selectedGif && (
                  <div className="mt-2">
                    <div className="relative max-w-xs">
                      <img 
                        src={selectedGif.url} 
                        alt={selectedGif.alt || 'Selected GIF'} 
                        className="rounded-md object-cover w-full h-auto border border-border/20"
                        loading="lazy"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                        onClick={removeSelectedGif}
                        title="Remove GIF"
                      >
                        ✕
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        GIF
                      </div>
                    </div>
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
                    <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 h-8 w-8" disabled={isSending} title="Add GIF">
                          <AnimatedGifIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-0 z-50" side="top" align="start">
                        <GifPicker onGifSelect={onGifSelect} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Submit Button */}
                  <Button type="submit" size="sm" disabled={isSending || (!replyContent.trim() && !uploadedMedia && !selectedGif)} className="h-8">
                    {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                    Post
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {comment.sub_replies && comment.sub_replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.sub_replies.map(reply => (
            <EnhancedCommentItem 
              key={reply.id}
              comment={reply}
              postAuthorHandle={postAuthorHandle}
              postCode={postCode}
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
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
};
