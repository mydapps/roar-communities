import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Cat, Send, Loader2 } from 'lucide-react';
import { CommentReply } from '@/utils/commentApi';
import { Link } from 'react-router-dom';
import { processTextContent } from '@/utils/textFormatting';

interface EnhancedCommentItemProps {
  comment: CommentReply;
  postAuthorHandle: string;
  level?: number;
  maxLevel?: number;
  onMeowChange: (commentId: number, newState: boolean) => void;
  onReply: (parentId: number, content: string) => Promise<void>;
  isAuthorReplying?: boolean;
  isMobile?: boolean;
  onOpenMobileReply?: (commentId: number, handle: string, avatar: string, content: string) => void;
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
  onOpenMobileReply
}: EnhancedCommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [meowAnimating, setMeowAnimating] = useState(false);
  
  const isPostAuthor = comment.handle === postAuthorHandle;
  
  const handleMeow = () => {
    // Only animate when adding a meow, not removing it
    if (!comment.has_meowed) {
      setMeowAnimating(true);
      setTimeout(() => setMeowAnimating(false), 1000);
    }
    
    onMeowChange(comment.id, !comment.has_meowed);
  };
  
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) return;
    
    setIsSending(true);
    
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleReplyClick = () => {
    if (isMobile && onOpenMobileReply) {
      onOpenMobileReply(comment.id, comment.handle, comment.avatar_url, comment.content);
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
          
          <div className="text-sm whitespace-pre-wrap break-words">
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
            
            {level < maxLevel && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReplyClick}
                className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
              >
                {isReplying && !isMobile ? 'Cancel' : 'Reply'}
              </Button>
            )}
          </div>
          
          {isReplying && !isMobile && (
            <form onSubmit={handleSubmitReply} className="mt-3 space-y-2">
              <Textarea 
                placeholder={`Reply to ${formatUsername(comment.handle)}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsReplying(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!replyContent.trim() || isSending}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};
