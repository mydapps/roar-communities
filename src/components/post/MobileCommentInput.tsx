import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X, ImageIcon, VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';

interface MobileCommentInputProps {
  postCode: string;
  isReplyMode?: boolean;
  replyToComment?: {
    id: number;
    author: string;
    content: string;
  };
  onSubmit: (content: string, parentId?: number) => Promise<void>;
  onCancel?: () => void;
}

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
  }, [isExpanded]);

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
    if ((!content.trim() && !uploadedMedia) || isSubmitting || isSubmittingRef.current) return;

    setIsSubmitting(true);
    isSubmittingRef.current = true;
    
    let finalContent = content.trim();
    
    // Add media markdown if we have uploadedMedia
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
      console.log('Adding media markdown:', markdown);
      finalContent += markdown;
    }

    console.log('Submitting comment with final content:', finalContent);
    
    try {
      await onSubmit(finalContent, replyToComment?.id);
      
      // Clear content first
      setContent('');
      setUploadedMedia(null);
      
      // Always collapse after submission
      setIsExpanded(false);
      
      if (onCancel && isReplyMode) {
        onCancel();
      }
      
      toast(isReplyMode ? 'Reply posted' : 'Comment posted');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post your comment');
    } finally {
      // Make sure UI state is reset regardless of success/failure
      setIsSubmitting(false);
      
      // Add a small delay before allowing new submissions
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 500);
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
  };

  // Truncate comment content for reply preview
  const truncateContent = (text: string, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-background border-t border-border/60 transition-all duration-300 ease-in-out z-50',
        isExpanded ? 'h-auto pt-3 px-4' : 'h-16 p-3',
        isExpanded && uploadedMedia ? 'pb-28' : 'pb-16'
      )}
      style={{
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}
    >
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
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={`https://img.dapps.co/avatar/${userAvatar}.svg`} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 relative">
          {isExpanded ? (
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isReplyMode ? `Reply to @${replyToComment?.author.split('.')[0]}...` : "Add a comment..."}
              className="w-full min-h-[80px] p-3 rounded-lg border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-sm bg-background resize-none"
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
            <div className="mt-2 space-y-2">
              {/* Previews */}
              {uploadedMedia && (
                <div className="w-1/3 pr-2">
                  <MediaPreview
                    media={uploadedMedia}
                    onRemove={removeMedia}
                  />
                </div>
              )}
              
              {/* Upload Buttons (Icons) - Only show if no media uploaded */}
              {!uploadedMedia && (
                <div className="flex gap-2">
                  <MediaUpload
                    onMediaUploaded={handleMediaUploaded}
                    disabled={isSubmitting || !!uploadedMedia}
                    acceptedTypes="image"
                    maxFiles={1}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={isSubmitting || !!uploadedMedia}>
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                  </MediaUpload>
                  
                  <MediaUpload
                    onMediaUploaded={handleMediaUploaded}
                    disabled={isSubmitting || !!uploadedMedia}
                    acceptedTypes="video"
                    maxFiles={1}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={isSubmitting || !!uploadedMedia}>
                      <VideoIcon className="h-5 w-5" />
                    </Button>
                  </MediaUpload>
                </div>
              )}
            </div>
          )}
          
          {/* Send Button */}
          {isExpanded && (
            <div className="absolute bottom-3 right-3">
              <Button
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={handleSubmit}
                disabled={(!content.trim() && !uploadedMedia) || isSubmitting}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
