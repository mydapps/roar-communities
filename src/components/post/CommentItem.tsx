import React, { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Reply } from '@/utils/postApi';
import { Cat, Send, ChevronDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleMeow } from '@/utils/commentApi';
import { processTextContent } from '@/utils/textFormatting';
import { useImageViewer } from '@/components/contexts/ImageViewerContext';
import { useLocation } from 'react-router-dom';

interface CommentItemProps {
  comment: Reply;
  level: number;
  postCode: string;
  onAddReply: (parentId: number, content: string) => Promise<void>;
}

export const CommentItem = ({ 
  comment, 
  level, 
  postCode,
  onAddReply 
}: CommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [localMeowed, setLocalMeowed] = useState(comment.has_meowed);
  const [localMeowCount, setLocalMeowCount] = useState(comment.meow_count);
  const [meowAnimating, setMeowAnimating] = useState(false);
  const [meowWavesAnimation, setMeowWavesAnimation] = useState(false);
  
  // Image viewer hook
  const { openImageViewer } = useImageViewer();
  
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
  
  const handleToggleMeow = async () => {
    // Update UI immediately
    const newMeowedState = !localMeowed;
    setLocalMeowed(newMeowedState);
    setLocalMeowCount(prev => newMeowedState ? prev + 1 : prev - 1);
    
    // Add animation when meowing (not when un-meowing)
    if (newMeowedState) {
      setMeowWavesAnimation(true);
      setMeowAnimating(true);
      setTimeout(() => setMeowWavesAnimation(false), 1000);
      setTimeout(() => setMeowAnimating(false), 1300);
    }
    
    try {
      await toggleMeow(comment.id);
    } catch (error) {
      // Revert on error
      setLocalMeowed(!newMeowedState);
      setLocalMeowCount(prev => !newMeowedState ? prev + 1 : prev - 1);
      toast.error('Failed to update. Please try again.');
    }
  };
  
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) return;
    
    setSubmitting(true);
    
    try {
      await onAddReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
      toast.success('Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Max comment depth is 3
  const canReply = level < 3;
  
  // Format avatar URL
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
  
  // Format username
  const formatUsername = (handle: string | null | undefined) => {
    if (!handle) return '@unknown';
    return '@' + handle.split('.')[0];
  };
  
  // Share comment functionality
  const handleShareComment = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Get the current URL and add the comment hash
      const baseUrl = window.location.origin + location.pathname;
      const commentUrl = `${baseUrl}#comment-${comment.id}`;
      
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
        const commentUrl = `${baseUrl}#comment-${comment.id}`;
        
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
  
  return (
    <div 
      id={`comment-${comment.id}`}
      className="animate-in fade-in duration-300 scroll-mt-4"
    >
      <div className={`flex gap-3 group ${level > 1 ? 'border-l-2 border-primary/20 pl-3' : ''}`}>
        <Avatar className="h-10 w-10 shrink-0 border border-muted/60">
          <AvatarImage src={getAvatarUrl(comment.avatar)} />
          <AvatarFallback>{comment.handle?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-medium text-foreground">
              {formatUsername(comment.handle)}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{comment.time_ago}</span>
          </div>
          
          <p className="text-sm text-foreground break-words whitespace-pre-line">
            {processTextContent(comment.content, handleImageClick)}
          </p>
          
          <div className="mt-2.5 flex items-center gap-3">
            <Button 
              variant={localMeowed ? "meow-active" : "meow"} 
              size="sm" 
              onClick={handleToggleMeow} 
              className="h-8 px-2 text-xs gap-1.5 rounded-full"
            >
              <div className="relative">
                <div className={`transition-all duration-300 ${meowAnimating ? 'scale-125' : ''}`}>
                  <Cat className={`h-3.5 w-3.5 ${localMeowed ? 'text-amber-500' : ''}`} />
                </div>
                {meowWavesAnimation && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping absolute h-5 w-5 rounded-full bg-amber-500/30"></div>
                    <div className="animate-ping delay-75 absolute h-7 w-7 rounded-full bg-amber-500/20"></div>
                  </div>
                )}
              </div>
              <span className={`${localMeowed ? 'text-amber-500 font-medium' : ''}`}>
                {localMeowCount}
              </span>
            </Button>
            
            {canReply && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsReplying(!isReplying)} 
                className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </Button>
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
            
            {comment.replies && comment.replies.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReplies(!showReplies)} 
                className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showReplies ? 'rotate-180' : ''}`} />
                <span>
                  {showReplies ? 'Hide replies' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                </span>
              </Button>
            )}
          </div>
          
          {isReplying && (
            <div className="mt-3 space-y-2 bg-muted/30 p-3 rounded-lg border border-border/40">
              <Textarea 
                placeholder={`Reply to @${comment.handle}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] text-sm bg-background"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsReplying(false)} 
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSubmitReply} 
                  disabled={!replyContent.trim() || submitting} 
                  className="h-8 text-xs gap-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <div className="space-y-4 mt-4 ml-6">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id}
              comment={reply}
              level={level + 1}
              postCode={postCode}
              onAddReply={onAddReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
