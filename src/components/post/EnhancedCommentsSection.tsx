import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw, Send, Loader2 } from 'lucide-react';
import { fetchReplies, toggleMeow, createReply, CommentReply } from '@/utils/commentApi';
import { toast } from 'sonner';
import { EnhancedCommentItem } from './EnhancedCommentItem';

interface EnhancedCommentsSectionProps {
  postCode: string;
  initialReplies?: CommentReply[];
  initialReplyCount?: number;
}

export const EnhancedCommentsSection = ({
  postCode,
  initialReplies = [],
  initialReplyCount = 0
}: EnhancedCommentsSectionProps) => {
  const [replies, setReplies] = useState<CommentReply[]>(initialReplies);
  const [replyCount, setReplyCount] = useState(initialReplyCount);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchReplies(postCode);
      
      if (response.success && response.replies) {
        setReplies(response.replies as unknown as CommentReply[]);
        setReplyCount(response.total_count || response.replies.length);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [postCode]);

  const handleRefresh = () => {
    if (!loading) {
      loadComments();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
      const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
      
      const tempId = Date.now();
      const optimisticComment: CommentReply = {
        id: tempId,
        uid: 0,
        handle: userHandle,
        avatar_url: userAvatar,
        content: newComment,
        created_on: new Date().toISOString(),
        time_ago: 'just now',
        upvotes: 0,
        meow_count: 0,
        has_meowed: false
      };
      
      setReplies(prev => [optimisticComment, ...prev]);
      setReplyCount(prev => prev + 1);
      setNewComment('');
      
      const response = await createReply(postCode, newComment);
      
      if (response.success) {
        setReplies(prev => 
          prev.map(reply => 
            reply.id === tempId 
              ? {
                  ...reply,
                  id: response.reply_id,
                  created_on: response.created_on,
                  avatar_url: response.avatar_url || reply.avatar_url
                }
              : reply
          )
        );
        
        toast.success('Comment added successfully');
      } else {
        setReplies(prev => prev.filter(reply => reply.id !== tempId));
        setReplyCount(prev => prev - 1);
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentId: number, content: string) => {
    if (!content.trim()) return;
    
    try {
      const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
      const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
      
      const tempId = Date.now();
      
      const optimisticReply: CommentReply = {
        id: tempId,
        uid: 0,
        handle: userHandle,
        avatar_url: userAvatar,
        content: content,
        created_on: new Date().toISOString(),
        time_ago: 'just now',
        upvotes: 0,
        meow_count: 0,
        has_meowed: false
      };
      
      setReplies(prev => 
        prev.map(reply => {
          if (reply.id === parentId) {
            return {
              ...reply,
              sub_replies: reply.sub_replies 
                ? [...reply.sub_replies, optimisticReply]
                : [optimisticReply]
            };
          }
          return reply;
        })
      );
      
      const response = await createReply(postCode, content, parentId);
      
      if (response.success) {
        setReplies(prev => 
          prev.map(reply => {
            if (reply.id === parentId && reply.sub_replies) {
              return {
                ...reply,
                sub_replies: reply.sub_replies.map(subReply => 
                  subReply.id === tempId 
                    ? {
                        ...subReply,
                        id: response.reply_id,
                        created_on: response.created_on,
                        avatar_url: response.avatar_url || subReply.avatar_url
                      }
                    : subReply
                )
              };
            }
            return reply;
          })
        );
        
        toast.success('Reply added successfully');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply. Please try again.');
    }
  };

  const handleToggleMeow = async (commentId: number) => {
    const updateReplies = (repliesList: CommentReply[]): CommentReply[] => {
      return repliesList.map(reply => {
        if (reply.id === commentId) {
          return {
            ...reply,
            has_meowed: !reply.has_meowed,
            meow_count: reply.has_meowed ? reply.meow_count - 1 : reply.meow_count + 1
          };
        } else if (reply.sub_replies && reply.sub_replies.length > 0) {
          return {
            ...reply,
            sub_replies: updateReplies(reply.sub_replies)
          };
        }
        return reply;
      });
    };
    
    setReplies(prev => updateReplies(prev));
    
    try {
      await toggleMeow(commentId);
    } catch (error) {
      console.error('Error toggling meow:', error);
      
      setReplies(prev => updateReplies(prev));
      toast.error('Failed to update meow. Please try again.');
    }
  };

  useEffect(() => {
    if (initialReplies.length === 0) {
      loadComments();
    }
  }, [initialReplies.length, loadComments]);

  const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Comments ({replyCount})</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
      
      <form onSubmit={handleAddComment} className="flex gap-3 bg-muted/20 p-4 rounded-lg border border-border/40">
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
      
      {loading && replies.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : replies.length > 0 ? (
        <div className="space-y-6 pt-4 divide-y divide-border/20">
          {replies.map(reply => (
            <div key={reply.id} className="pt-6 first:pt-0">
              <EnhancedCommentItem 
                comment={reply}
                level={1}
                onToggleMeow={handleToggleMeow}
                onAddReply={handleAddReply}
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
