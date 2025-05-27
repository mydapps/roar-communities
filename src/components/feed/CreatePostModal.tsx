import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { XIcon, SendIcon, ImageIcon, VideoIcon, UsersIcon, BoldIcon, ItalicIcon, UnderlineIcon, Loader2, BarChartBigIcon, Trash2Icon, ImagePlusIcon, AlertTriangleIcon, Smile } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CommunitySelector } from './CommunitySelector';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Editor } from '@tiptap/react';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import EmojiPicker, { EmojiClickData, EmojiStyle, Categories } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- NEW IMPORTS FOR MENTIONS ---
import { MentionSuggestionsList, SuggestionItem } from '@/components/mentions/MentionSuggestionsList';
import { searchUsers, searchCommunities, SearchUserItem, SearchCommunityItem } from '@/utils/searchApi';
import { debounce } from 'lodash';
import { MentionState, getMentionsPlugin } from '../editor/mentionPlugin';

// REAL upload utility function
// Returns MediaUploadResponse on success, throws Error on failure.
async function uploadFileUtil(file: File): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append('media', file);
  console.log(`[uploadFileUtil] Starting upload for: ${file.name}`);
  try {
    const response = await fetch('/api/upload_media', {
      method: 'POST',
      body: formData,
      credentials: 'include', 
    });
    console.log(`[uploadFileUtil] Fetch response status: ${response.status}`);
    if (!response.ok) {
        let errorMsg = `Upload failed with status: ${response.status}`;
        try {
            const errorData = await response.json();
            console.error('[uploadFileUtil] Error response data:', errorData);
            errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) { console.error('[uploadFileUtil] Failed to parse error JSON:', e); }
        throw new Error(errorMsg);
    }

    const result = await response.json();
    console.log('[uploadFileUtil] Success response data:', result);

    if (!result || typeof result !== 'object' || !result.url || typeof result.success === 'undefined') { 
        console.error("[uploadFileUtil] Invalid response structure:", result);
        throw new Error('Invalid response structure from upload server.');
    }
    if(result.success === false) {
      console.error("[uploadFileUtil] Upload marked as failed by server:", result.error || result.message);
      throw new Error(result.error || result.message || 'Upload marked as failed by server.')
    }
    
    // Construct MediaUploadResponse only on success
    const finalResponse: MediaUploadResponse = {
        success: true,
        url: result.url, 
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'image', 
        originalUrl: result.originalUrl || result.url,
        displayUrl: result.displayUrl || result.url,
        markdown: result.markdown || `![](${result.url})`, 
        isProcessing: result.isProcessing || false,
        fileInfo: {
            name: file.name,
            originalName: file.name,
            size: file.size,
            type: file.type,
        },
    };
    console.log(`[uploadFileUtil] Successfully processed upload for ${file.name}, URL: ${finalResponse.url}`);
    return finalResponse;

  } catch (error: any) { // Catch fetch errors or errors thrown above
    console.error('Error in uploadFileUtil:', error);
    // Re-throw the caught error to be handled by the caller
    throw new Error(error.message || 'Unknown upload error');
  }
}

// --- POLL FEATURE TYPES ---
interface PollOptionInput {
  id: string;
  text: string;
  imageFile?: File | null;
  imageUrl?: string | null;
  imagePreviewUrl?: string | null; // For local preview before upload completes
  isUploadingImage?: boolean;
  imageUploadError?: string | null;
}

export interface CreatePostPayload {
  body: string; // This will be the poll question if is_poll is true
  community?: string;
  media?: MediaUploadResponse[]; // For regular posts with media attachments, not for poll option images
  is_poll?: boolean;
  poll_options?: Array<{
    text: string;
    imageUrl?: string; // Only include if image is successfully uploaded
  }>;
}
// --- END POLL FEATURE TYPES ---

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAvatarUrl: string;
  userHandle: string;
  communityName?: string;
  onPostSubmit: (payload: CreatePostPayload) => Promise<boolean>; // Updated signature
  initialContent?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  open,
  onOpenChange,
  userAvatarUrl,
  userHandle,
  communityName,
  onPostSubmit,
  initialContent = '',
}) => {
  const isMobile = useIsMobile();
  const [content, setContent] = useState(initialContent); // This will be the poll question if poll is active
  const [selectedCommunity, setSelectedCommunity] = useState(communityName || '');
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse[]>([]); // For regular post media
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // --- POLL STATE ---
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState<PollOptionInput[]>([]);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollOptionImageUploadRefs = useRef<Record<string, HTMLInputElement>>({}); // To trigger file inputs
  // --- END POLL STATE ---

  // --- NEW STATE FOR MENTIONS ---
  const [mentionState, setMentionState] = useState<MentionState>({
    show: false,
    query: '',
    type: null,
    items: [],
    loading: false,
    position: { top: 0, left: 0, visible: false },
    selectedIndex: 0,
    triggerPos: null,
  });
  const suggestionsListRef = useRef<HTMLDivElement>(null);
  // --- END NEW STATE FOR MENTIONS ---

  // --- Start Emoji Config ---
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
  // --- End Emoji Config ---

  useEffect(() => {
    if (open) {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.commands.setContent(initialContent || '');
        setTimeout(() => editorInstanceRef.current?.commands.focus(), 100);
      }
      setSelectedCommunity(communityName || '');
      setUploadedMedia([]);
      setError(null);
      // Reset mention state on open
      setMentionState({
        show: false,
        query: '',
        type: null,
        items: [],
        loading: false,
        position: { top: 0, left: 0, visible: false },
        selectedIndex: 0,
        triggerPos: null,
      });
      setIsPollMode(false); // Reset poll mode on open
      setPollOptions([]);    // Clear poll options
      setPollError(null);    // Clear poll errors
    } else {
        // Optional: Clear editor content when modal closes if desired
        // editorInstanceRef.current?.commands.clearContent();
    }
  }, [open, initialContent, communityName]); // Removed editorInstanceRef.current from deps as it can cause issues. Manage focus separately if needed.

  const handleContentChange = (htmlContent: string) => {
    setContent(htmlContent);
    // The new mention plugin will handle updating mentionState via onMentionStateChange
  };

  const handleMediaUploaded = (media: MediaUploadResponse) => {
    console.log('[handleMediaUploaded] Received media:', media);
    if (!media.success) {
      toast.error("Media upload failed."); 
      return;
    }
    console.log(`[handleMediaUploaded] Adding ${media.type} with URL: ${media.url} to state.`);
    // Add ALL successful uploads to state
    setUploadedMedia(prev => [...prev, media]);
    toast.success(`${media.type} added`);
    // Removed image insertion logic from here
  };

  // --- NEW MENTION HANDLING LOGIC ---
  const fetchSuggestionsDebounced = useCallback(
    debounce(async (type: 'user' | 'community', query: string, triggerPos: number) => {
      if (query.length < 1 && type !== 'community') { // For /c/ we might show recent/popular even with no query
          setMentionState(prev => ({ ...prev, show: false, items: [], loading: false }));
          return;
      }
      setMentionState(prev => ({ ...prev, loading: true, items: [] }));
      try {
        let fetchedSuggestions: SuggestionItem[] = [];
        if (type === 'user') {
          const response = await searchUsers(query, 1, 5);
          if (response.success && response.users) {
            fetchedSuggestions = response.users.items.map((user: SearchUserItem) => ({ 
                id: user.handle, 
                display: user.handle,
                subDisplay: (user as any).name || user.handle, 
                image: user.avatar_url,
                type: 'user'
            }));
          }
        } else { // type === 'community'
          const response = await searchCommunities(query, 1, 5);
          if (response.success && response.communities) {
            fetchedSuggestions = response.communities.items.map((comm: SearchCommunityItem) => {
                const communityId = (comm as any).slug || comm.name; // Prefer slug, fallback to name
                return {
                    id: communityId,
                    display: comm.name,
                    subDisplay: `c/${communityId}`,
                    image: (comm as any).image_url || (comm as any).image || (comm as any).avatar_url,
                    type: 'community'
                };
            });
          }
        }
        
        const uniqueSuggestions = fetchedSuggestions.filter(
          (suggestion, index, self) =>
            index === self.findIndex((s) => s.id === suggestion.id && s.type === suggestion.type)
        );
        setMentionState(prev => ({ ...prev, items: uniqueSuggestions, loading: false, show: uniqueSuggestions.length > 0, selectedIndex: 0 }));

      } catch (error) {
        console.error(`Error fetching ${type} suggestions:`, error);
        toast.error(`Failed to load ${type} suggestions.`);
        setMentionState(prev => ({ ...prev, show: false, loading: false }));
      }
    }, 300),
    []
  );
  
  const handleMentionStateChange = (newState: Partial<MentionState>) => {
    setMentionState(prev => {
      let newSelectedIndex = newState.selectedIndex !== undefined ? newState.selectedIndex : prev.selectedIndex;
      let itemsToUse = newState.items || prev.items; // Use new items if provided, else previous

      // Handle special selectedIndex values from plugin for Arrows
      if (newState.selectedIndex === -1) { // ArrowUp
        newSelectedIndex = (prev.selectedIndex - 1 + itemsToUse.length) % itemsToUse.length;
      } else if (newState.selectedIndex === -2) { // ArrowDown
        newSelectedIndex = (prev.selectedIndex + 1) % itemsToUse.length;
      }

      const updatedState: MentionState = {
        ...prev,
        ...newState,
        items: itemsToUse, // ensure items are updated if newState provides them
        selectedIndex: newSelectedIndex,
      };

      if (newState.show && newState.query !== prev.query && newState.type && newState.triggerPos !== null) {
        fetchSuggestionsDebounced(newState.type, newState.query, newState.triggerPos);
      } else if (!newState.show && prev.show) {
        // Handled by plugin sending show:false
      }

      // Handle selection triggered by plugin (e.g., Enter key)
      if (newState.triggerAction === 'select' && updatedState.items.length > 0 && updatedState.selectedIndex >= 0 && updatedState.selectedIndex < updatedState.items.length) {
        const selectedItem = updatedState.items[updatedState.selectedIndex];
        if (selectedItem) {
            handleSuggestionSelect(selectedItem); // This will also set show:false
        }
        // after selection, reset triggerAction and ensure suggestions are hidden
        // handleSuggestionSelect internally sets show:false, query:'', etc.
        // So, we just need to clear triggerAction from the state we are about to set.
        const { triggerAction, ...stateWithoutTrigger } = updatedState;
        return stateWithoutTrigger;
      }
      
      // If plugin signals close (e.g. Escape or after selection), ensure UI reflects it.
      // The plugin itself sends show:false for Escape.
      // For select, handleSuggestionSelect takes care of hiding.
      if (newState.triggerAction === 'close') {
        const { triggerAction, ...stateWithoutTrigger } = updatedState;
        return { ...stateWithoutTrigger, show: newState.show !== undefined ? newState.show : false}; // ensure show is false if closing
      }
      
      // Remove triggerAction before setting final state if not handled above
      const { triggerAction, ...finalStateToSet } = updatedState;
      return finalStateToSet;
    });
  };


  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    const editor = editorInstanceRef.current;
    // Use range from mentionState if available (should be set by the plugin)
    const rangeToReplace = mentionState.range;

    if (!editor || !rangeToReplace || mentionState.type === null) {
        console.warn('Editor, range, or mentionType missing for suggestion selection', { editor, rangeToReplace, mentionType: mentionState.type });
        // Fallback or error if range is not available, though plugin should always provide it
        // If rangeToReplace is missing, we might need to hide suggestions manually to prevent issues
        setMentionState(prev => ({ ...prev, show: false, query: '', type: null, selectedIndex: 0, triggerPos: null, range: undefined }));
        return;
    }

    const mentionText = suggestion.type === 'user' ? `@${suggestion.id} ` : `/c/${suggestion.id} `;
    
    editor.chain().focus()
      .insertContentAt(rangeToReplace, mentionText)
      .run();

    // Reset mention state completely after insertion
    setMentionState({
        show: false,
        query: '',
        type: null,
        items: [],
        loading: false,
        position: { top: 0, left: 0, visible: false },
        selectedIndex: 0,
        triggerPos: null,
        range: undefined, // Clear the range
    });
  };
  
  // Keyboard navigation for suggestions is now primarily handled by the plugin.
  // This useEffect can be removed or simplified if plugin handles all key events.
  useEffect(() => {
    // const editor = editorInstanceRef.current;
    // if (!editor || !mentionState.show || mentionState.items.length === 0) return;
    // The plugin (mentionPlugin.ts) now handles ArrowUp, ArrowDown, Enter, Escape.
    // CreatePostModal just needs to react to state changes from onStateChange.

    // If any specific key handling is still needed here (e.g. Tab for selection),
    // it could be added. For now, assuming plugin handles the core navigation.
    return () => {
      // Cleanup if any listeners were added here (none currently)
    };
  // Minimal dependencies now, mainly if we were to add specific handlers here.
  }, [mentionState.show, mentionState.items]); // Removed handleSuggestionSelect and mentionState.selectedIndex from deps
  
  // --- END NEW MENTION HANDLING LOGIC ---

  const handlePastedFile = async (file: File) => {
    if (!file || isPasting) return;
    setIsPasting(true);
    toast.info(`Uploading pasted image: ${file.name}`);
    console.log(`[handlePastedFile] Starting paste upload for: ${file.name}`);
    try {
      const response = await uploadFileUtil(file); // Throws on error
      console.log(`[handlePastedFile] Upload response for ${file.name}:`, response);
      // Add successful upload to state
      setUploadedMedia(prev => [...prev, response]);
      toast.success(`Pasted image uploaded!`);
      // Removed image insertion logic from here
    } catch (err: any) { 
      console.error("[handlePastedFile] CATCH block error:", err);
      toast.error(`Failed to upload pasted image: ${err.message}`);
    } finally {
      setIsPasting(false);
    }
  };

  const removeMedia = (urlToRemove: string) => {
    setUploadedMedia(prev => prev.filter(media => media.url !== urlToRemove));
  };

  const handleCommunitySelect = (community: string) => {
    setSelectedCommunity(community);
    setShowCommunitySelector(false);
    toast.info(`Selected community: ${community}`);
    // Optionally, refocus the editor after selection
    setTimeout(() => editorInstanceRef.current?.commands.focus(), 50);
  };

  // --- POLL LOGIC FUNCTIONS ---
  const handleTogglePollMode = () => {
    const newPollMode = !isPollMode;
    setIsPollMode(newPollMode);
    if (newPollMode) {
      initializePollOptions();
      setUploadedMedia([]); // Clear regular media when switching to poll mode
      setError(null); // Clear general errors
    } else {
      setPollOptions([]);
      setPollError(null);
    }
  };

  const initializePollOptions = () => {
    setPollOptions([
      { id: uuidv4(), text: '', imageFile: null, imageUrl: null, imagePreviewUrl: null, isUploadingImage: false, imageUploadError: null },
      { id: uuidv4(), text: '', imageFile: null, imageUrl: null, imagePreviewUrl: null, isUploadingImage: false, imageUploadError: null },
    ]);
    setPollError(null);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions(prev => [...prev, { id: uuidv4(), text: '', imageFile: null, imageUrl: null, imagePreviewUrl: null, isUploadingImage: false, imageUploadError: null }]);
      setPollError(null);
    }
  };

  const handleRemovePollOption = (optionId: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter(opt => opt.id !== optionId));
      setPollError(null);
    }
  };

  const handlePollOptionTextChange = (optionId: string, newText: string) => {
    setPollOptions(prev => prev.map(opt => opt.id === optionId ? { ...opt, text: newText } : opt));
  };

  const handlePollOptionImageSelected = async (optionId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed for poll options.');
      setPollOptions(prev => prev.map(opt => opt.id === optionId ? { ...opt, imageUploadError: 'Only images allowed.' } : opt));
      return;
    }

    setPollOptions(prev => prev.map(opt => opt.id === optionId ? {
      ...opt, 
      imageFile: file, 
      imagePreviewUrl: URL.createObjectURL(file),
      isUploadingImage: true, 
      imageUploadError: null,
      imageUrl: null // Clear previous imageUrl if re-uploading
    } : opt));

    try {
      const uploadResponse = await uploadFileUtil(file);
      // If uploadFileUtil resolves without error, it means success
      // uploadFileUtil should throw an error if response.success is false or HTTP fails
      setPollOptions(prev => prev.map(opt => opt.id === optionId ? {
        ...opt, 
        imageUrl: uploadResponse.url, // Assuming url is always present on success from uploadFileUtil
        isUploadingImage: false,
        imageFile: null
      } : opt));
      toast.success(`Image added to option.`);
    } catch (uploadError: any) {
      console.error('Poll option image upload error:', uploadError);
      const errorMessage = uploadError.message || 'Image upload failed.';
      setPollOptions(prev => prev.map(opt => opt.id === optionId ? {
        ...opt, 
        isUploadingImage: false, 
        imageUploadError: errorMessage,
        imagePreviewUrl: null
      } : opt));
      toast.error(errorMessage);
    }
  };

  const validatePoll = (): boolean => {
    if (pollOptions.length < 2) {
      setPollError('Polls require at least 2 options.');
      return false;
    }
    if (pollOptions.length > 4) {
      setPollError('Polls can have a maximum of 4 options.');
      return false;
    }
    if (pollOptions.some(opt => !opt.text.trim() && !opt.imageUrl)) {
      setPollError('Each poll option must have either text or an image.');
      return false;
    }
    // Image consistency: if one has an image, all must have an image.
    const hasAnyImage = pollOptions.some(opt => opt.imageUrl);
    if (hasAnyImage && pollOptions.some(opt => !opt.imageUrl)) {
      setPollError('If one poll option has an image, all options must have successfully uploaded images.');
      return false;
    }
    if (pollOptions.some(opt => opt.isUploadingImage)) {
        setPollError('Please wait for all images to finish uploading.');
        return false;
    }

    setPollError(null);
    return true;
  };

  // --- END POLL LOGIC FUNCTIONS ---

  const handleSubmit = async () => {
    const currentHtmlContent = editorInstanceRef.current?.getHTML() || '';
    const currentTextContent = editorInstanceRef.current?.getText() || '';
    
    if (!isPollMode && !currentTextContent.trim() && uploadedMedia.length === 0) {
      setError('Please enter some content or add media.');
      return;
    }
    if (isPollMode && !currentTextContent.trim()) {
        setError('Please enter a question for your poll.');
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setPollError(null);

    let payload: CreatePostPayload;

    if (isPollMode) {
      if (!validatePoll()) {
        setIsSubmitting(false);
        // pollError is already set by validatePoll
        return;
      }
      const pollOptionsPayload = pollOptions.map(opt => ({
        text: opt.text.trim(),
        ...(opt.imageUrl && { imageUrl: opt.imageUrl }),
      }));

      payload = {
        body: currentHtmlContent, // Poll question from rich text editor
        community: selectedCommunity || undefined,
        is_poll: true,
        poll_options: pollOptionsPayload,
        media: [] // No separate media attachments for polls
      };
    } else {
      // For regular posts, media URLs are often appended to the body by the parent or here.
      // The current onPostSubmit in CreatePostCard handles media URL appending. 
      // So, we just pass the raw body and the media array separately.
      payload = {
        body: currentHtmlContent,
        community: selectedCommunity || undefined,
        media: uploadedMedia,
        is_poll: false,
      };
    }
    
    console.log('Submitting post payload:', payload); // Added console log for debugging

    try {
      const success = await onPostSubmit(payload);
      if (success) {
        onOpenChange(false); // Close modal on successful submission
        // Reset states for next time (though useEffect on 'open' also does this)
        setContent('');
        if(editorInstanceRef.current) editorInstanceRef.current.commands.clearContent();
        setUploadedMedia([]);
        setSelectedCommunity(communityName || '');
        setIsPollMode(false);
        setPollOptions([]);
        setPollError(null);
      } else {
        // Error handling might be done by onPostSubmit or here if it returns a specific error signal
        // setError('Failed to create post. Please try again.'); // Generic error if not more specific
      }
    } catch (submissionError: any) {
      console.error('Post submission error:', submissionError);
      setError(submissionError.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBold = () => editorInstanceRef.current?.chain().focus().toggleBold().run();
  const toggleItalic = () => editorInstanceRef.current?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editorInstanceRef.current?.chain().focus().toggleUnderline().run();

  const onEmojiClickCreatePost = (emojiData: EmojiClickData) => {
    if (editorInstanceRef.current) {
      let emojiToInsert = '';
      if (emojiData.isCustom) {
        emojiToInsert = `:${emojiData.emoji}:`; 
      } else {
        emojiToInsert = emojiData.emoji;
      }
      editorInstanceRef.current.chain().focus().insertContent(emojiToInsert).run();
      setIsEmojiPickerOpen(false);
    }
  };

  const renderFormattingToolbar = () => (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-background rounded-t-md">
      <Button 
        variant={editorInstanceRef.current?.isActive('bold') ? 'secondary' : 'ghost'}
        size="icon" 
        onClick={toggleBold} 
        title="Bold"
      >
        <BoldIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant={editorInstanceRef.current?.isActive('italic') ? 'secondary' : 'ghost'}
        size="icon" 
        onClick={toggleItalic} 
        title="Italic"
      >
        <ItalicIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant={editorInstanceRef.current?.isActive('underline') ? 'secondary' : 'ghost'}
        size="icon" 
        onClick={toggleUnderline}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      {/* Emoji Picker Button */}
      <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant='ghost' // Keep consistent with other toolbar buttons
            size="icon" 
            onClick={() => setIsEmojiPickerOpen(prev => !prev)} // Toggle open state
            title="Add Emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 z-[100]" side="top" align="start">
          <EmojiPicker
            onEmojiClick={onEmojiClickCreatePost}
            autoFocusSearch={false}
            emojiStyle={EmojiStyle.NATIVE}
            height={350}
            customEmojis={customEmojisConfig}
            categories={emojiPickerCategoryConfig}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const renderActionToolbar = () => (
    <div className="flex items-center gap-2 p-2">
      {/* Image Upload for regular posts */}
      <MediaUpload 
        onMediaUploaded={handleMediaUploaded} 
        acceptedTypes="image"
        maxFiles={10}
        disabled={isPollMode || uploadedMedia.some(m => m.type === 'video') || uploadedMedia.length >= 10}
      >
        <Button variant="ghost" size="icon" title="Add Image to Post" 
                disabled={isPollMode || uploadedMedia.some(m => m.type === 'video') || uploadedMedia.length >= 10}
        >
            <ImageIcon className="h-5 w-5" />
          </Button>
        </MediaUpload>

      {/* Video Upload for regular posts */}
      <MediaUpload 
        onMediaUploaded={handleMediaUploaded}
        acceptedTypes="video"
        maxFiles={1}
        disabled={isPollMode || uploadedMedia.some(m => m.type === 'image') || uploadedMedia.length > 0}
      >
        <Button variant="ghost" size="icon" title="Add Video to Post" 
                disabled={isPollMode || uploadedMedia.some(m => m.type === 'image') || uploadedMedia.length > 0}
        >
            <VideoIcon className="h-5 w-5" />
          </Button>
        </MediaUpload>
      
      {/* Poll Icon with a dot */}
      <Button variant="ghost" size="icon" onClick={handleTogglePollMode} title={isPollMode ? "Switch to Standard Post" : "Create a Poll"} className={cn("relative", isPollMode && "bg-primary/10 text-primary")}>
        <BarChartBigIcon className="h-5 w-5" />
        {!isPollMode && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        )}
      </Button>
      
      <div className="flex-grow" /> {/* Spacer */}
      {isSubmitting && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting || (!isPollMode && !editorInstanceRef.current?.getText().trim() && uploadedMedia.length === 0) || (isPollMode && !editorInstanceRef.current?.getText().trim())}
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
      >
        Post <SendIcon className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  // --- NEW: Prominent Community Display/Selector Trigger ---
  const renderProminentCommunitySelector = () => {
    return (
      <div className="p-3 px-4 border-b text-sm flex items-center gap-2 bg-secondary/20">
        <span className="text-muted-foreground">Posting on:</span>
        {selectedCommunity ? (
          <>
            <Badge variant="outline" className="font-semibold text-base py-1 px-2 border-primary text-primary">
              {selectedCommunity}
            </Badge>
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setShowCommunitySelector(true)}>
              (Change)
            </Button>
            <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground" onClick={() => setSelectedCommunity('')}>
              (Post to Your Feed)
            </Button>
          </>
        ) : (
          <>
            <Badge variant="secondary" className="font-semibold text-base py-1 px-2">
              Your Feed
            </Badge>
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setShowCommunitySelector(true)}>
              (Choose a Community)
            </Button>
          </>
        )}
      </div>
    );
  };
  // --- END: Prominent Community Display/Selector Trigger ---

  const renderPollCreator = () => {
    if (!isPollMode) return null;
    return (
      <div className="p-4 border-t space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Poll Options (min 2, max 4)</h3>
        {pollOptions.map((option, index) => (
          <div key={option.id} className="flex items-start gap-2 p-2 border rounded-md bg-background">
            <span className="text-sm font-medium pt-2">{index + 1}.</span>
            <div className="flex-grow space-y-2">
                <Input 
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => handlePollOptionTextChange(option.id, e.target.value)}
                    className="text-sm"
                    maxLength={100} // Example max length
                    disabled={option.isUploadingImage}
                />
                {option.imagePreviewUrl && (
                    <div className="relative w-32 h-32 border rounded overflow-hidden">
                        <img src={option.imagePreviewUrl} alt={`Preview option ${index + 1}`} className="object-cover w-full h-full" />
                        {option.isUploadingImage && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                        )}
                    </div>
                )}
                {option.imageUrl && !option.imagePreviewUrl && ( // Show uploaded image if no longer previewing (e.g. after successful upload)
                    <div className="w-32 h-32 border rounded overflow-hidden">
                        <img src={option.imageUrl} alt={`Poll option ${index + 1}`} className="object-cover w-full h-full" />
                    </div>
                )}
                {option.imageUploadError && (
                    <p className="text-xs text-red-500 flex items-center"><AlertTriangleIcon className="h-4 w-4 mr-1" />{option.imageUploadError}</p>
                )}
                <input 
                    type="file"
                    accept="image/*"
                    ref={el => { if (el) pollOptionImageUploadRefs.current[option.id] = el; }}
                    onChange={(e) => e.target.files && e.target.files[0] && handlePollOptionImageSelected(option.id, e.target.files[0])}
                    className="hidden"
                    disabled={option.isUploadingImage}
                />
            </div>
            <div className="flex flex-col space-y-1 items-center pt-1">
                <Button 
                    variant="outline" size="icon" 
                    onClick={() => pollOptionImageUploadRefs.current[option.id]?.click()} 
                    title={option.imageUrl ? "Change Image" : "Add Image"}
                    disabled={option.isUploadingImage || pollOptions.some(o => o.isUploadingImage && o.id !== option.id)} // Disable if any other image is uploading for simplicity
                >
                    <ImagePlusIcon className="h-4 w-4" />
                </Button>
                {pollOptions.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePollOption(option.id)} title="Remove Option" className="text-muted-foreground hover:text-destructive">
                        <Trash2Icon className="h-4 w-4" />
                    </Button>
                )}
            </div>
          </div>
        ))}
        {pollOptions.length < 4 && (
          <Button variant="outline" onClick={handleAddPollOption} className="w-full mt-2">
            Add Option ({pollOptions.length}/4)
          </Button>
        )}
        {pollError && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>{pollError}</AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          The content you write above will be the poll question. Images in polls: if one option has an image, all options must have an image.
        </p>
      </div>
    );
  };

  // This is the main content rendering function, previously named ModalContent in my plan,
  // but named PostCreationForm in the actual code.
  const PostCreationForm = (
    // Main container for the modal content. Use h-full for drawer, max-h for dialog.
    <div className={cn("flex flex-col", isMobile ? "h-full" : "md:min-h-[450px] md:max-h-[90vh]")}>
      {!isMobile && (
        <DialogHeader className="p-4 border-b flex-shrink-0"> {/* flex-shrink-0 to prevent header from shrinking */}
          <DialogTitle className="text-lg font-semibold flex items-center">
            {isPollMode ? "Create Poll" : "Create Post"} {/* Dynamic Title */}
          </DialogTitle>
        </DialogHeader>
      )}
      
      {renderProminentCommunitySelector()} {/* This is also flex-shrink-0 implicitly or explicitly if needed */}
      
      {/* Formatting toolbar should be outside the scrollable content if it applies to fixed editor above poll options*/}
      {!isPollMode && renderFormattingToolbar()} {/* Show only if not poll mode, or if you want it for poll Q too */}

      {/* Scrollable area for editor, poll options, and media previews */}
      <div className={cn("flex-grow p-1 overflow-y-auto custom-scrollbar", {
        "pb-[calc(env(safe-area-inset-bottom)_+_70px)]": isMobile, // Padding for mobile toolbar + some space
      })} style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Container for Editor + Poll Options */}
        <div className="p-4"> 
          <div className="flex-1 min-w-0"> {/* This div might not strictly need flex-1/min-w-0 if it's the sole child now, but harmless */}
        <RichTextEditor
            onEditorCreated={(editor) => { editorInstanceRef.current = editor; }}
              content={content} // This is the state variable for editor content
              onChange={handleContentChange} // This updates the content state variable
              placeholder={isPollMode ? "Ask a question for your poll..." : "What's on your mind?"}
            onPastedFile={handlePastedFile}
            mentionPluginOptions={{
                onStateChange: handleMentionStateChange,
            }}
              className="min-h-[120px] text-base mb-3" // mb-3 to give some space before poll options start
        />
            {/* Poll Creator UI - now part of this scrollable column */}
            {isPollMode && renderPollCreator()}
          </div>
      </div>
      
        {/* Regular Media Preview Section (not for poll mode) */}
        {!isPollMode && uploadedMedia.length > 0 && (
          <div className="px-4 pb-2">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Attached Media:</h4>
          <div className="flex flex-wrap gap-2">
            {uploadedMedia.map((media) => (
              <div key={media.url} className="relative w-20 h-20"> 
                <MediaPreview media={media} onRemove={() => removeMedia(media.url)} />
              </div>
            ))}
          </div>
        </div>
      )}

        {error && (
          <Alert variant="destructive" className="m-2 rounded-md text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Mention suggestions list - ensure its positioning works with the new layout */}
      {mentionState.show && mentionState.items.length > 0 && (
         <div 
            ref={suggestionsListRef}
            className="absolute z-50" // Review positioning carefully
            style={isMobile ? 
                { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)', 
                  left: '10px', right: '10px', maxHeight: '150px' } : 
                (mentionState.position.visible ? 
                    { top: mentionState.position.top, left: mentionState.position.left, maxHeight: '200px', width: '250px' } : 
                    { display: 'none' }
                )
            }
         >
            <MentionSuggestionsList
                suggestions={mentionState.items}
                isLoading={mentionState.loading}
                onSelect={handleSuggestionSelect}
                mentionType={mentionState.type}
                highlightedIndex={mentionState.selectedIndex}
                onItemHover={(index) => setMentionState(prev => ({ ...prev, selectedIndex: index }))}
            />
        </div>
      )}

      {/* Action Toolbar at the bottom - should be outside the scrollable div and always visible */}
      <div className={cn(
        "border-t flex-shrink-0 bg-background z-10",
        isMobile ? "fixed bottom-0 left-0 right-0" : "mt-auto" // Fixed for mobile, mt-auto for desktop
      )}>
        {/* Formatting toolbar was moved above scrollable area, or could be here if preferred for poll Q too */}
        {/* {!isPollMode && renderFormattingToolbar()} */}
        {renderActionToolbar()} {/* Contains Post button */}
      </div>
    </div>
  );

  // Common elements needed for both Dialog and Drawer
  const communitySelectorDialogContent = (
    <DialogContent className="sm:max-w-md p-4">
      <DialogHeader>
        <DialogTitle>Select Community</DialogTitle>
      </DialogHeader>
      <div className="py-2">
        <CommunitySelector 
          onSelect={handleCommunitySelect} // Pass the handler
          selectedCommunity={selectedCommunity} // Pass current selection for highlighting
        />
      </div>
      {/* Footer with close button for community selector */}
      <DialogFooter className="sm:justify-start mt-4">
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
          <DrawerContent className="h-[95vh] mt-24 flex flex-col rounded-t-[10px]">
            <DrawerHeader className="p-3 border-b flex items-center justify-between sticky top-0 bg-background z-10 flex-shrink-0">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><XIcon className="h-5 w-5" /></Button>
              </DrawerClose>
              <DrawerTitle className="text-md font-semibold">Create Post</DrawerTitle>
              <Button 
                size="sm" 
                onClick={handleSubmit} 
                disabled={isSubmitting || (!isPollMode && !editorInstanceRef.current?.getText().trim() && uploadedMedia.length === 0) || (isPollMode && !editorInstanceRef.current?.getText().trim())}
                className="h-8 px-3 text-sm">
                 {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </DrawerHeader>
            {PostCreationForm} 
          </DrawerContent>
        </Drawer>
        {/* Separate Dialog for Community Selector on Mobile */}
        <Dialog open={showCommunitySelector} onOpenChange={setShowCommunitySelector}>
          {communitySelectorDialogContent}
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 gap-0 shadow-2xl rounded-lg overflow-hidden">
          {PostCreationForm}
        </DialogContent>
      </Dialog>
      {/* Separate Dialog for Community Selector on Desktop */}
      <Dialog open={showCommunitySelector} onOpenChange={setShowCommunitySelector}>
         {communitySelectorDialogContent}
      </Dialog>
    </>
  );
}; 