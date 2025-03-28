
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { createReply, fetchReplies, toggleMeow, CommentReply } from '@/utils/commentApi';
import { toast } from 'sonner';

interface EnhancedCommentsSectionProps {
  postCode: string;
  initialReplies?: CommentReply[];
  initialReplyCount?: number;
  postAuthorHandle: string;
}

export const EnhancedCommentsSection = ({
  postCode,
  initialReplies = [],
  initialReplyCount = 0,
  postAuthorHandle
}: EnhancedCommentsSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [replies, setReplies] = useState<CommentReply[]>(initialReplies);
  const [replyCount, setReplyCount] = useState(initialReplyCount);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadReplies = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetchReplies(postCode);
      
      if (response.success) {
        setReplies(response.replies);
        setReplyCount(response.total_count);
      }
    } catch (error) {
      console.error('Error loading replies:', error);
      toast.error('Failed to load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [postCode]);

  useEffect(() => {
    if (initialReplies.length === 0) {
      loadReplies();
    }
  }, [initialReplies.length, loadReplies]);

  const handleAddReply = async (parentId: number = 0, content: string) => {
    if (!content.trim()) return;
    
    setSubmitting(true);
    
    try {
      await createReply(postCode, content, parentId);
      
      if (parentId === 0) {
        setNewComment('');
      }
      
      await loadReplies();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMeowChange = async (commentId: number, newState: boolean) => {
    // Optimistically update UI
    setReplies(prev => updateMeowState(prev, commentId, newState));
    
    try {
      const response = await toggleMeow(commentId);
      
      if (!response.success) {
        // Revert change if unsuccessful
        setReplies(prev => updateMeowState(prev, commentId, !newState));
        toast.error('Failed to update reaction. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling meow:', error);
      // Revert change on error
      setReplies(prev => updateMeowState(prev, commentId, !newState));
      toast.error('Failed to update reaction. Please try again.');
    }
  };
  
  const updateMeowState = (comments: CommentReply[], targetId: number, newState: boolean): CommentReply[] => {
    return comments.map(comment => {
      if (comment.id === targetId) {
        return {
          ...comment,
          has_meowed: newState,
          meow_count: newState ? comment.meow_count + 1 : Math.max(0, comment.meow_count - 1)
        };
      }
      
      if (comment.sub_replies && comment.sub_replies.length > 0) {
        return {
          ...comment,
          sub_replies: updateMeowState(comment.sub_replies, targetId, newState)
        };
      }
      
      return comment;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddReply(0, newComment);
  };

  const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Comments ({replyCount})</h2>
      
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
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Comment
            </Button>
          </div>
        </div>
      </form>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : replies.length > 0 ? (
        <div className="space-y-6 divide-y divide-border/20">
          {replies.map(reply => (
            <div key={reply.id} className="pt-6 first:pt-0">
              <EnhancedCommentItem 
                comment={reply}
                postAuthorHandle={postAuthorHandle}
                onMeowChange={handleMeowChange}
                onReply={handleAddReply}
                isAuthorReplying={reply.handle === postAuthorHandle}
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
