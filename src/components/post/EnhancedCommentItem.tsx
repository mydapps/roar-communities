import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Cat, Send, ChevronDown, Loader2 } from 'lucide-react';
import { CommentReply } from '@/utils/commentApi';

interface EnhancedCommentItemProps {
  comment: CommentReply;
  level: number;
  onToggleMeow: (commentId: number) => Promise<void>;
  onAddReply: (parentId: number, content: string) => Promise<void>;
}

export const EnhancedCommentItem = ({
  comment,
  level,
  onToggleMeow,
  onAddReply
}: EnhancedCommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  
  const [meowAnimating, setMeowAnimating] = useState(false);
  const [meowWavesAnimation, setMeowWavesAnimation] = useState(false);
  
  const handleToggleMeow = async () => {
    if (!comment.has_meowed) {
      setMeowWavesAnimation(true);
      setMeowAnimating(true);
      
      setTimeout(() => setMeowWavesAnimation(false), 1000);
      setTimeout(() => setMeowAnimating(false), 1300);
    }
    
    await onToggleMeow(comment.id);
  };
  
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      await onAddReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const canReply = level < 3;
  
  const formatUsername = (handle: string) => {
    return handle === 'you' ? 'you' : `@${handle.split('.')[0]}`;
  };
  
  const getAvatarUrl = (avatarPath: string) => {
    if (typeof avatarPath === 'string' && avatarPath.includes('https://img.dapps.co/avatar/')) {
      const parts = avatarPath.split('https://img.dapps.co/avatar/');
      return parts[parts.length - 1].replace('.svg.svg', '.svg');
    }
    return avatarPath;
  };
  
  return (
    <div className="animate-in fade-in duration-300">
      <div className={`flex gap-3 ${level > 1 ? 'border-l-2 border-primary/20 pl-3' : ''}`}>
        <Avatar className="h-10 w-10 shrink-0 border border-muted/60">
          <AvatarImage src={`https://img.dapps.co/avatar/${getAvatarUrl(comment.avatar_url)}`} />
          <AvatarFallback>{comment.handle[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-medium text-foreground">
              {formatUsername(comment.handle)}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{comment.time_ago}</span>
          </div>
          
          <div className="text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </div>
          
          <div className="mt-2.5 flex items-center gap-3">
            <Button 
              variant={comment.has_meowed ? "meow-active" : "meow"} 
              size="sm" 
              onClick={handleToggleMeow} 
              className="h-8 px-2 text-xs gap-1.5 rounded-full"
            >
              <div className="relative">
                <div className={`transition-all duration-300 ${meowAnimating ? 'scale-125' : ''}`}>
                  <Cat className={`h-3.5 w-3.5 ${comment.has_meowed ? 'text-amber-500' : ''}`} />
                </div>
                {meowWavesAnimation && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping absolute h-5 w-5 rounded-full bg-amber-500/30"></div>
                    <div className="animate-ping delay-75 absolute h-7 w-7 rounded-full bg-amber-500/20"></div>
                  </div>
                )}
              </div>
              <span className={`${comment.has_meowed ? 'text-amber-500 font-medium' : ''}`}>
                {comment.meow_count}
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
            
            {comment.sub_replies && comment.sub_replies.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReplies(!showReplies)} 
                className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showReplies ? 'rotate-180' : ''}`} />
                <span>
                  {showReplies ? 'Hide replies' : `Show ${comment.sub_replies.length} ${comment.sub_replies.length === 1 ? 'reply' : 'replies'}`}
                </span>
              </Button>
            )}
          </div>
          
          {isReplying && (
            <div className="mt-3 space-y-2 bg-muted/30 p-3 rounded-lg border border-border/40">
              <Textarea 
                placeholder={`Reply to ${formatUsername(comment.handle)}...`}
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
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {comment.sub_replies && comment.sub_replies.length > 0 && showReplies && (
        <div className="space-y-4 mt-4 ml-6">
          {comment.sub_replies.map(reply => (
            <EnhancedCommentItem 
              key={reply.id}
              comment={reply}
              level={level + 1}
              onToggleMeow={onToggleMeow}
              onAddReply={onAddReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
