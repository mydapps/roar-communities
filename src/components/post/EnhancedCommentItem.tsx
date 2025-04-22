import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Cat, Send, Loader2, ImageIcon, VideoIcon } from 'lucide-react';
import { CommentReply } from '@/utils/commentApi';
import { Link } from 'react-router-dom';
import { processTextContent } from '@/utils/textFormatting';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import { toast } from 'sonner';

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
  optimisticToRealIdMap = {}
}: EnhancedCommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [meowAnimating, setMeowAnimating] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse | null>(null);
  
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
              onClick={(e) => e.stopPropagation()}
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
          
          <div className="text-sm whitespace-pre-wrap break-words mt-1">
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
              <Textarea 
                placeholder={`Reply to ${formatUsername(comment.handle)}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              
              {/* Media Upload and Preview */}
              <div className="flex items-start justify-between">
                <div className="flex gap-1 items-center">
                  {uploadedMedia ? (
                    <div className="w-16 h-16 relative">
                      <MediaPreview
                        media={uploadedMedia}
                        onRemove={removeMedia}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <MediaUpload
                        onMediaUploaded={handleMediaUploaded}
                        disabled={isSending}
                        acceptedTypes="image"
                        maxFiles={1}
                      >
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          disabled={isSending}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </Button>
                      </MediaUpload>
                      
                      <MediaUpload
                        onMediaUploaded={handleMediaUploaded}
                        disabled={isSending}
                        acceptedTypes="video"
                        maxFiles={1}
                      >
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          disabled={isSending}
                        >
                          <VideoIcon className="h-3.5 w-3.5" />
                        </Button>
                      </MediaUpload>
                    </div>
                  )}
                </div>
                
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                      setUploadedMedia(null);
                    }}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                    disabled={(!replyContent.trim() && !uploadedMedia) || isSending}
                  className="text-xs h-8 gap-1.5"
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Reply
                </Button>
                </div>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};
