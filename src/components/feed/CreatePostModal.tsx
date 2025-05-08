import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { XIcon, SendIcon, ImageIcon, VideoIcon, UsersIcon, BoldIcon, ItalicIcon, UnderlineIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CommunitySelector } from './CommunitySelector';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Editor } from '@tiptap/react';

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

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAvatarUrl: string;
  userHandle: string;
  communityName?: string;
  onPostSubmit: (content: string, community: string | undefined, media: MediaUploadResponse[]) => Promise<boolean>;
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
  const [content, setContent] = useState(initialContent);
  const [selectedCommunity, setSelectedCommunity] = useState(communityName || '');
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const [isPasting, setIsPasting] = useState(false);

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
    } else {
        // Optional: Clear editor content when modal closes if desired
        // editorInstanceRef.current?.commands.clearContent();
    }
  }, [open, initialContent, communityName, editorInstanceRef.current]);

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

  const handleSubmit = async () => {
    const currentHtmlContent = editorInstanceRef.current?.getHTML() || '';
    const currentTextContent = editorInstanceRef.current?.getText() || '';
    const isEmpty = !currentTextContent.trim();
    
    // Use the full uploadedMedia array now
    if (isEmpty && uploadedMedia.length === 0) { 
      setError('Please write something or add media to your post.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // Pass the HTML content and the full media array
      // The receiving function (handleModalPostSubmit in CreatePostCard) needs to handle formatting
      const success = await onPostSubmit(currentHtmlContent, selectedCommunity || undefined, uploadedMedia);
      if (success) {
        onOpenChange(false); 
      }
    } catch (e: any) {
      setError(e.message || 'Failed to create post.');
      toast.error(e.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBold = () => editorInstanceRef.current?.chain().focus().toggleBold().run();
  const toggleItalic = () => editorInstanceRef.current?.chain().focus().toggleItalic().run();

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
        variant="ghost"
        size="icon" 
        onClick={() => console.warn('Underline needs Tiptap extension')} 
        title="Underline (Not Implemented)"
        disabled
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderActionToolbar = () => (
    <div className="flex items-center justify-between p-2 border-t border-border">
      <div className="flex items-center gap-1">
        <MediaUpload onMediaUploaded={handleMediaUploaded} acceptedTypes="image" maxFiles={5} disabled={isPasting || isSubmitting}>
          <Button variant="ghost" size="icon" title="Upload Image" disabled={isPasting || isSubmitting}>
            <ImageIcon className="h-5 w-5" />
          </Button>
        </MediaUpload>
        <MediaUpload onMediaUploaded={handleMediaUploaded} acceptedTypes="video" maxFiles={1} disabled={isPasting || isSubmitting}>
          <Button variant="ghost" size="icon" title="Upload Video" disabled={isPasting || isSubmitting}>
            <VideoIcon className="h-5 w-5" />
          </Button>
        </MediaUpload>
      </div>
      <Button 
        onClick={handleSubmit} 
        disabled={isPasting || isSubmitting || ( !(editorInstanceRef.current?.getText().trim()) && uploadedMedia.length === 0 )}
        className="gap-2"
      >
        {isPasting || isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
        {isPasting ? 'Uploading...' : isSubmitting ? 'Posting...' : 'Post'}
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

  const PostCreationForm = (
    <div className={cn("flex flex-col", isMobile ? "h-full" : "max-h-[80vh]")}>
      {!isMobile && (
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={userAvatarUrl} />
              <AvatarFallback>{userHandle?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            Create Post
          </DialogTitle>
           <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
      )}
      
      {renderProminentCommunitySelector()}

      {renderFormattingToolbar()}
      
      <div className={cn("flex-grow p-1 overflow-y-auto relative", isMobile ? "" : "custom-scrollbar")} style={{ WebkitOverflowScrolling: 'touch' }}>
        <RichTextEditor
            onEditorCreated={(editor) => { editorInstanceRef.current = editor; }}
            content={content}
            onChange={handleContentChange}
            placeholder={selectedCommunity ? `Share with ${selectedCommunity}...` : "What\'s happening?"}
            onPastedFile={handlePastedFile}
            // --- PASS MENTION PLUGIN CONFIG ---
            mentionPluginOptions={{
                onStateChange: handleMentionStateChange,
                // We will need to pass fetchSuggestions or similar if plugin handles fetching
            }}
            // --- END PASS MENTION PLUGIN CONFIG ---
        />
      </div>
      
      {/* --- Media Preview Section (Show ALL media) --- */} 
      {uploadedMedia.length > 0 && (
        <div className="p-2 border-t max-h-[150px] overflow-y-auto custom-scrollbar flex-shrink-0">
          <p className="text-xs text-muted-foreground mb-1">Attached media:</p>
          <div className="flex flex-wrap gap-2">
            {/* Iterate over the full uploadedMedia array */}
            {uploadedMedia.map((media) => (
              <div key={media.url} className="relative w-20 h-20"> 
                <MediaPreview media={media} onRemove={() => removeMedia(media.url)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- RENDER MENTION SUGGESTIONS --- */}
      {mentionState.show && mentionState.items.length > 0 && (
         <div 
            ref={suggestionsListRef}
            className="absolute z-50" // Will need dynamic styling for position
            style={isMobile ? 
                { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)', /* Above action toolbar roughly */
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
      {/* --- END RENDER MENTION SUGGESTIONS --- */}

      {error && (
        <Alert variant="destructive" className="m-2 mt-0 rounded-md text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {renderActionToolbar()}
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
                disabled={isPasting || isSubmitting || ( !(editorInstanceRef.current?.getText().trim()) && uploadedMedia.length === 0 )}
                className="h-8 px-3 text-sm">
                 {isPasting ? 'Uploading...' : isSubmitting ? 'Posting...' : 'Post'}
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