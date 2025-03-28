
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reply } from '@/utils/postApi';
import { RefreshCw, Send, Loader2 } from 'lucide-react';
import { fetchReplies, createReply, toggleMeow } from '@/utils/commentApi';
import { toast } from 'sonner';
import { EnhancedCommentItem } from './EnhancedCommentItem';

interface EnhancedCommentsSectionProps {
  postCode: string;
  initialReplies?: Reply[];
  initialReplyCount?: number;
}

export const EnhancedCommentsSection = ({
  postCode,
  initialReplies = [],
  initialReplyCount = 0
}: EnhancedCommentsSectionProps) => {
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [replyCount, setReplyCount] = useState(initialReplyCount);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load comments from API
  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchReplies(postCode);
      
      if (response.success && response.replies) {
        setReplies(response.replies);
        setReplyCount(response.total_count || response.replies.length);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [postCode]);

  // Handle refresh button click
  const handleRefresh = () => {
    if (!loading) {
      loadComments();
    }
  };

  // Handle adding a new top-level comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      // Get user avatar and handle for optimistic update
      const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
      const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
      
      // Create optimistic comment
      const tempId = Date.now();
      const optimisticComment: Reply = {
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
      
      // Add optimistic comment to the list
      setReplies(prev => [optimisticComment, ...prev]);
      setReplyCount(prev => prev + 1);
      setNewComment('');
      
      // Make API call
      const response = await createReply(postCode, newComment);
      
      if (response.success) {
        // Update the optimistic comment with real data
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
        // Remove optimistic comment if API call fails
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

  // Handle adding a reply to a comment
  const handleAddReply = async (parentId: number, content: string) => {
    if (!content.trim()) return;
    
    try {
      const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
      const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
      
      // Generate temporary ID for optimistic update
      const tempId = Date.now();
      
      // Create optimistic reply
      const optimisticReply: Reply = {
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
      
      // Add optimistic reply to the appropriate parent
      setReplies(prev => 
        prev.map(reply => {
          if (reply.id === parentId) {
            // Add to parent's sub_replies
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
      
      // Make API call
      const response = await createReply(postCode, content, parentId);
      
      if (response.success) {
        // Update the optimistic reply with real data
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

  // Handle toggling meow on a comment
  const handleToggleMeow = async (commentId: number) => {
    // Find the comment to update (could be a top-level comment or a reply)
    const updateReplies = (repliesList: Reply[]): Reply[] => {
      return repliesList.map(reply => {
        if (reply.id === commentId) {
          // Update this reply
          return {
            ...reply,
            has_meowed: !reply.has_meowed,
            meow_count: reply.has_meowed ? reply.meow_count - 1 : reply.meow_count + 1
          };
        } else if (reply.sub_replies && reply.sub_replies.length > 0) {
          // Look for the comment in sub_replies
          return {
            ...reply,
            sub_replies: updateReplies(reply.sub_replies)
          };
        }
        return reply;
      });
    };
    
    // Update optimistically
    setReplies(prev => updateReplies(prev));
    
    // Make API call
    try {
      await toggleMeow(commentId);
    } catch (error) {
      console.error('Error toggling meow:', error);
      
      // Revert changes if API call fails
      setReplies(prev => updateReplies(prev));
      toast.error('Failed to update meow. Please try again.');
    }
  };

  // Load comments on initial render
  useEffect(() => {
    if (initialReplies.length === 0) {
      loadComments();
    }
  }, [initialReplies.length, loadComments]);

  // Get user avatar from localStorage
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
