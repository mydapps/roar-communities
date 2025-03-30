
import React, { useState, useCallback, useEffect } from 'react';
import { CommentReply, toggleMeow } from '@/utils/commentApi';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { MobileCommentInput } from './MobileCommentInput';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileCommentsSectionProps {
  postCode: string;
  postAuthorHandle: string;
  replies: CommentReply[];
  onAddComment: (content: string, parentId?: number) => Promise<void>;
  onRefresh: () => void;
}

export const MobileCommentsSection: React.FC<MobileCommentsSectionProps> = ({
  postCode,
  postAuthorHandle,
  replies,
  onAddComment,
  onRefresh
}) => {
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    author: string;
    content: string;
  } | null>(null);
  const [meowedComments, setMeowedComments] = useState<Record<number, boolean>>({});
  const [localReplies, setLocalReplies] = useState<CommentReply[]>(replies);
  const isMobile = useIsMobile();

  // Update local replies when prop changes
  useEffect(() => {
    setLocalReplies(replies);
  }, [replies]);

  // Handle meow (like) on a comment
  const handleMeowChange = async (commentId: number, newState: boolean) => {
    try {
      // Update optimistically in UI first
      setMeowedComments(prev => ({
        ...prev,
        [commentId]: newState
      }));
      
      // Update comment's meow count in local state
      setLocalReplies(prevReplies => {
        const updateMeowCount = (comments: CommentReply[]): CommentReply[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                has_meowed: newState,
                meow_count: newState ? comment.meow_count + 1 : Math.max(0, comment.meow_count - 1)
              };
            }
            if (comment.sub_replies) {
              return {
                ...comment,
                sub_replies: updateMeowCount(comment.sub_replies)
              };
            }
            return comment;
          });
        };
        return updateMeowCount(prevReplies);
      });
      
      // API call to update meow state
      await toggleMeow(commentId);
    } catch (error) {
      console.error('Error toggling meow:', error);
      // Revert optimistic update on error
      setMeowedComments(prev => ({
        ...prev,
        [commentId]: !newState
      }));
      
      // Revert the count update too
      setLocalReplies(prevReplies => {
        const revertMeowCount = (comments: CommentReply[]): CommentReply[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                has_meowed: !newState,
                meow_count: !newState ? comment.meow_count + 1 : Math.max(0, comment.meow_count - 1)
              };
            }
            if (comment.sub_replies) {
              return {
                ...comment,
                sub_replies: revertMeowCount(comment.sub_replies)
              };
            }
            return comment;
          });
        };
        return revertMeowCount(prevReplies);
      });
      
      toast.error('Failed to update reaction');
    }
  };

  // Open reply input for a specific comment
  const handleOpenReply = useCallback((commentId: number, handle: string, content: string) => {
    setReplyingTo({
      id: commentId,
      author: handle,
      content
    });
    // Scroll to make sure the reply input is visible
    setTimeout(() => {
      window.scrollTo({ 
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }, []);

  // Cancel reply mode
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Main comment submission handler
  const handleSubmit = async (content: string, parentId?: number) => {
    if (!content.trim()) return;
    
    try {
      // Create temporary comment for immediate feedback
      const newReplyId = Date.now(); // Temporary ID
      const userHandle = localStorage.getItem('dapps_user_handle') || 'You';
      const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
      
      const newComment: CommentReply = {
        id: newReplyId,
        uid: 0, // Will be replaced with actual UID when refreshed
        handle: userHandle,
        avatar_url: userAvatar,
        content: content,
        created_on: new Date().toISOString(),
        time_ago: 'just now',
        upvotes: 0,
        meow_count: 0,
        has_meowed: false
      };
      
      // Update UI immediately
      if (parentId && parentId > 0) {
        // Add as a sub-reply
        setLocalReplies(prevReplies => {
          const addSubReply = (comments: CommentReply[]): CommentReply[] => {
            return comments.map(comment => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  sub_replies: comment.sub_replies 
                    ? [...comment.sub_replies, newComment] 
                    : [newComment]
                };
              }
              if (comment.sub_replies) {
                return {
                  ...comment,
                  sub_replies: addSubReply(comment.sub_replies)
                };
              }
              return comment;
            });
          };
          return addSubReply(prevReplies);
        });
      } else {
        // Add as a top-level reply - CHANGED: now adding to the bottom
        setLocalReplies(prevReplies => [...prevReplies, newComment]);
      }
      
      // Actually submit to API
      await onAddComment(content, parentId);
      
      // Clear reply mode after successful submission
      setReplyingTo(null);
      
      // Toast notification
      toast.success('Comment posted successfully');
      
      // No need to refresh immediately - let the optimistic UI update stay
      // We'll get the server-assigned IDs on next app refresh
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to post comment. Please try again.');
      throw error; // Let the input component handle the error
    }
  };

  // Modified to match the expected function signature
  const handleReplySubmit = useCallback((parentId: number, content: string) => {
    return handleSubmit(content, parentId);
  }, []);

  // Handle a reply to comment by opening the drawer
  const handleOpenMobileReply = useCallback((id: number, handle: string, content: string) => {
    handleOpenReply(id, handle, content);
  }, [handleOpenReply]);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Comments list */}
      <div className="space-y-6 mb-24">
        {localReplies.length > 0 ? (
          <div className="space-y-6 divide-y divide-border/20">
            {localReplies.map(reply => (
              <div key={reply.id} className="pt-6 first:pt-0">
                <EnhancedCommentItem 
                  comment={reply}
                  postAuthorHandle={postAuthorHandle}
                  onMeowChange={handleMeowChange}
                  onReply={handleReplySubmit}
                  isMobile={true}
                  onOpenMobileReply={handleOpenMobileReply}
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
      
      {/* Floating comment input */}
      <MobileCommentInput
        postCode={postCode}
        isReplyMode={!!replyingTo}
        replyToComment={replyingTo || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancelReply}
      />
    </>
  );
};
