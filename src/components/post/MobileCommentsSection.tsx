import React, { useState, useCallback, useEffect } from 'react';
import { CommentReply, toggleMeow, createReply } from '@/utils/commentApi';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { MobileCommentInput } from './MobileCommentInput';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';

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
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");

  // Update local replies when prop changes
  useEffect(() => {
    setLocalReplies(replies);
  }, [replies]);

  // Handle meow (like) on a comment
  const handleMeowChange = async (commentId: number, newState: boolean) => {
    try {
      // Verify we have a valid numeric ID before proceeding
      if (!commentId || isNaN(commentId) || commentId <= 0) {
        console.error(`Invalid comment ID for meow toggle in mobile: ${commentId}`);
        toast.error('Cannot update reaction: Invalid comment ID');
        return;
      }
      
      console.log(`Mobile - Toggling meow for comment ID: ${commentId} to ${newState}`);
      
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
      const response = await toggleMeow(commentId);
      
      if (!response.success) {
        throw new Error(`Server returned success=false for meow toggle`);
      }
    } catch (error) {
      console.error(`Error toggling meow for comment ID ${commentId}:`, error);
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
    // Removed the scrolling behavior that was causing poor UX
  }, []);

  // Cancel reply mode
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Main comment submission handler
  const handleSubmit = async (content: string, parentId?: number) => {
    if (!content.trim()) return;
    
    try {
      console.log(`Mobile - Submitting ${parentId ? 'reply' : 'comment'} with content: ${content}`);
      
      // API call to create the reply/comment
      const response = await createReply(postCode, content, parentId || 0);
      
      // Check if user is not part of the community
      if (!response.success && response.errCode === "004" && response.communityName) {
        // Show the not in community modal
        setCommunityName(response.communityName);
        setNotInCommunitySheetOpen(true);
        return;
      }
      
      if (!response.success || !response.reply_id) {
        console.error('API returned success=false or missing reply_id:', response);
        throw new Error('Failed to create comment/reply');
      }
      
      console.log(`Mobile - Created ${parentId ? 'reply' : 'comment'} with server ID: ${response.reply_id}`);
      
      // Create the new comment/reply object
      const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
      const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
      
      // Immediately update UI with the new comment before notifying parent
      if (parentId) {
        // This is a reply to a comment
        setLocalReplies(prevReplies => {
          const addReplyToComment = (comments: CommentReply[]): CommentReply[] => {
            return comments.map(comment => {
              if (comment.id === parentId) {
                // Add reply to this comment
                const newReply: CommentReply = {
                  id: response.reply_id,
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
                
                return {
                  ...comment,
                  sub_replies: comment.sub_replies 
                    ? [...comment.sub_replies, newReply] 
                    : [newReply]
                };
              } else if (comment.sub_replies) {
                return {
                  ...comment,
                  sub_replies: addReplyToComment(comment.sub_replies)
                };
              }
              return comment;
            });
          };
          
          return addReplyToComment(prevReplies);
        });
      } else {
        // This is a top-level comment
        const newComment: CommentReply = {
          id: response.reply_id,
          uid: 0,
          handle: userHandle,
          avatar_url: userAvatar,
          content: content,
          created_on: new Date().toISOString(),
          time_ago: 'just now',
          upvotes: 0,
          meow_count: 0,
          has_meowed: false,
          sub_replies: []
        };
        
        setLocalReplies(prevReplies => [...prevReplies, newComment]);
      }
      
      // Notify parent component about the new comment (for state consistency)
      // but we don't need to wait for this to update our UI
      onAddComment(content, parentId).catch(error => {
        console.error('Error notifying parent about new comment:', error);
      });
      
      // Clear reply mode after successful submission
      setReplyingTo(null);
      
      // Toast notification
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to post comment. Please try again.');
      throw error; // Let the input component handle the error
    }
  };

  // Modified to match the expected function signature
  const handleReplySubmit = useCallback((parentId: number, content: string) => {
    return handleSubmit(content, parentId);
  }, [handleSubmit]);

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

      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </>
  );
};
