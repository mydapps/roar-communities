
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CommentReply } from '@/utils/commentApi';
import { Reply, Cat, Loader2 } from 'lucide-react';

interface EnhancedCommentItemProps {
  comment: CommentReply;
  level: number;
  onToggleMeow: (commentId: number) => void;
  onAddReply: (parentId: number, content: string) => Promise<void>;
  postAuthorHandle?: string;
}

export const EnhancedCommentItem = ({
  comment,
  level,
  onToggleMeow,
  onAddReply,
  postAuthorHandle
}: EnhancedCommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const hasReplies = comment.sub_replies && comment.sub_replies.length > 0;
  const isPostAuthor = postAuthorHandle && comment.handle === postAuthorHandle;
  
  const handleToggleMeow = () => {
    onToggleMeow(comment.id);
  };
  
  const handleReplyToggle = () => {
    setIsReplying(!isReplying);
    if (!isReplying) {
      setReplyContent('');
    }
  };
  
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      await onAddReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleToggleReplies = () => {
    setIsExpanded(!isExpanded);
  };
  
  const getIndentClass = () => {
    const levelIndent = level === 1 ? '' : 'ml-6';
    return levelIndent;
  };
  
  const formatUsername = (username: string) => {
    return '@' + username.split('.')[0];
  };

  const getUserProfileLink = (handle: string) => {
    return `/u/${handle.split('.')[0]}`;
  };
  
  return (
    <div className={`${getIndentClass()}`}>
      <div className={`flex gap-3 mb-4 ${level > 1 ? 'border-l-2 border-primary/20 pl-3' : ''}`}>
        <Link to={getUserProfileLink(comment.handle)}>
          <Avatar className="h-10 w-10 shrink-0 border border-muted/60 cursor-pointer hover:border-primary/60 transition-colors">
            <AvatarImage src={`https://img.dapps.co/avatar/${comment.avatar_url}.svg`} />
            <AvatarFallback>{comment.handle[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <Link 
              to={getUserProfileLink(comment.handle)}
              className="font-medium text-foreground hover:underline"
            >
              {formatUsername(comment.handle)}
            </Link>
            
            {isPostAuthor && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 font-medium text-xs px-2 py-0.5">
                OP
              </Badge>
            )}
            
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{comment.time_ago}</span>
          </div>
          
          <div className="text-sm break-words">
            {comment.content}
          </div>
          
          <div className="mt-2.5 flex items-center gap-3">
            <Button 
              variant={comment.has_meowed ? "outline" : "ghost"} 
              size="sm" 
              onClick={handleToggleMeow} 
              className={`h-8 px-2 text-xs gap-1.5 rounded-full 
                ${comment.has_meowed ? 'text-amber-500 border-amber-500/30 hover:bg-amber-500/10' : ''}`}
            >
              <Cat className={`h-3.5 w-3.5 ${comment.has_meowed ? 'text-amber-500' : ''}`} />
              <span>{comment.meow_count}</span>
            </Button>
            
            {level < 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReplyToggle} 
                className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
              >
                <Reply className="h-3.5 w-3.5" />
                <span>{isReplying ? 'Cancel' : 'Reply'}</span>
              </Button>
            )}
            
            {hasReplies && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleToggleReplies} 
                className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
              >
                <span>
                  {isExpanded ? 'Hide replies' : `Show ${comment.sub_replies?.length} ${comment.sub_replies?.length === 1 ? 'reply' : 'replies'}`}
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
                  onClick={handleReplyToggle} 
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
                      <Reply className="h-3.5 w-3.5" />
                      Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {hasReplies && isExpanded && (
        <div className="space-y-4 mt-2 pl-2 border-l-2 border-primary/10">
          {comment.sub_replies?.map(reply => (
            <EnhancedCommentItem 
              key={reply.id}
              comment={reply}
              level={level + 1}
              onToggleMeow={onToggleMeow}
              onAddReply={onAddReply}
              postAuthorHandle={postAuthorHandle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
