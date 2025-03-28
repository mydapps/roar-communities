
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reply } from '@/utils/postApi';
import { CommentItem } from './CommentItem';
import { Send, RefreshCw } from 'lucide-react';

interface CommentsSectionProps {
  postCode: string;
  replies: Reply[];
  replyCount: number;
  onAddReply: (parentId: number, content: string) => Promise<void>;
  onRefresh: () => void;
  loading?: boolean;
}

export const CommentsSection = ({
  postCode,
  replies,
  replyCount,
  onAddReply,
  onRefresh,
  loading = false
}: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      // Parent ID 0 means top-level comment
      await onAddReply(0, newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get user avatar from localStorage
  const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Comments ({replyCount})</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-3 bg-muted/20 p-4 rounded-lg border border-border/40">
        <Avatar className="h-10 w-10 shrink-0 border border-muted/60">
          <AvatarImage src={`https://img.dapps.co/avatar/${userAvatar}.svg`} />
          <AvatarFallback>Y</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea 
            placeholder="Add a comment..." 
            className="resize-none bg-background min-h-[80px]"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!newComment.trim() || submitting}
              className="gap-1.5"
            >
              <Send className="h-4 w-4" />
              Comment
            </Button>
          </div>
        </div>
      </form>
      
      {replies.length > 0 ? (
        <div className="space-y-6 pt-4 divide-y divide-border/20">
          {replies.map(reply => (
            <div key={reply.id} className="pt-6 first:pt-0">
              <CommentItem 
                comment={reply}
                level={1}
                postCode={postCode}
                onAddReply={onAddReply}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/20 rounded-lg border border-border/40">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};
