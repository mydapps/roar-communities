import React, { useState, useCallback, useEffect, useRef, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
import { CommentReply, toggleMeow, createReply } from '@/utils/commentApi';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { MobileCommentInput, MobileCommentInputRef } from './MobileCommentInput';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';
import { debounce } from '@/utils/helpers'; // Import debounce utility or create if needed

interface MobileCommentsSectionProps {
  postCode: string;
  postAuthorHandle: string;
  replies: CommentReply[];
  onAddComment: (content: string, parentId?: number) => Promise<{
    success: boolean;
    reply_id?: number;
    parent_id?: number;
    handle?: string;
    avatar_url?: string;
    created_on?: string;
    message?: string;
  }>;
  onRefresh: () => void;
  readOnly?: boolean;
}

export interface MobileCommentsSectionRef {
  triggerCommentInput: () => void;
}

// Memoized comment item to prevent unnecessary renders
const MemoizedCommentItem = React.memo(({
  comment,
  postAuthorHandle,
  postCode,
  onMeowChange,
  onReply,
  onOpenMobileReply,
  optimisticToRealIdMap,
  readOnly = false
}: {
  comment: CommentReply;
  postAuthorHandle: string;
  postCode?: string;
  onMeowChange: (commentId: number, newState: boolean) => void;
  onReply: (parentId: number, content: string) => Promise<void>;
  onOpenMobileReply: (id: number, handle: string, avatar: string, content: string, level2ParentId?: number) => void;
  optimisticToRealIdMap: Record<number, number>;
  readOnly?: boolean;
}) => (
  <div key={comment.id} className="pt-6 first:pt-0">
    <EnhancedCommentItem 
      comment={comment}
      postAuthorHandle={postAuthorHandle}
      postCode={postCode}
      onMeowChange={onMeowChange}
      onReply={onReply}
      isMobile={true}
      onOpenMobileReply={onOpenMobileReply}
      optimisticToRealIdMap={optimisticToRealIdMap}
      readOnly={readOnly}
    />
  </div>
));

export const MobileCommentsSection = forwardRef<MobileCommentsSectionRef, MobileCommentsSectionProps>(({
  postCode,
  postAuthorHandle,
  replies,
  onAddComment,
  onRefresh,
  readOnly
}, ref) => {
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    author: string;
    avatar: string;
    content: string;
    level2ParentId?: number;
  } | null>(null);
  
  // Use refs for data that doesn't need to trigger re-renders
  const meowedCommentsRef = useRef<Record<number, boolean>>({});
  const [localReplies, setLocalReplies] = useState<CommentReply[]>(replies);
  const isMobile = useIsMobile();
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");
  
  // Map for tracking optimistic IDs to real IDs
  const optimisticToRealIdMapRef = useRef<Record<number, number>>({});
  const [optimisticToRealIdMap, setOptimisticToRealIdMap] = useState<Record<number, number>>({});
  
  // Store a reference to the previous replies for comparison
  const previousRepliesRef = useRef<CommentReply[]>(replies);
  
  // Ref for the comment input
  const commentInputRef = useRef<MobileCommentInputRef>(null);
  
  // Helper function to get real ID if available, or return original ID
  const getRealIdIfAvailable = useCallback((id: number): number => {
    return optimisticToRealIdMap[id] || id;
  }, [optimisticToRealIdMap]);

  // Update local replies when prop changes - optimized to prevent unnecessary updates
  useEffect(() => {
    // Only update if the replies have actually changed
    if (JSON.stringify(previousRepliesRef.current) !== JSON.stringify(replies)) {
      previousRepliesRef.current = replies;
      setLocalReplies(replies);
    }
  }, [replies]);

  useImperativeHandle(ref, () => ({
    triggerCommentInput: () => {
      if (commentInputRef.current) {
        commentInputRef.current.triggerExpand();
      }
    }
  }));

  // Debounced function to update local replies to improve performance
  const debouncedSetLocalReplies = useRef(
    debounce((updater: (prevReplies: CommentReply[]) => CommentReply[]) => {
      setLocalReplies(updater);
    }, 100)
  ).current;

  // Handle meow (like) on a comment - optimized with useCallback
  const handleMeowChange = useCallback(async (commentId: number, newState: boolean) => {
    try {
      // Use real ID if this is an optimistic comment that's been saved
      const realCommentId = getRealIdIfAvailable(commentId);
      
      // Verify we have a valid numeric ID before proceeding
      if (!realCommentId || isNaN(realCommentId) || realCommentId <= 0) {
        console.error(`Invalid comment ID for meow toggle in mobile: ${realCommentId}`);
        toast.error('Cannot update reaction: Invalid comment ID');
        return;
      }
      
      // Update refs immediately without re-rendering
      meowedCommentsRef.current = {
        ...meowedCommentsRef.current,
        [commentId]: newState
      };
      
      // Update optimistically in UI using debounced function
      debouncedSetLocalReplies((prevReplies) => {
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
      const response = await toggleMeow(realCommentId);
      
      if (!response.success) {
        throw new Error(`Server returned success=false for meow toggle`);
      }
    } catch (error) {
      console.error(`Error toggling meow for comment ID ${commentId}:`, error);
      
      // Revert optimistic update on error
      meowedCommentsRef.current = {
        ...meowedCommentsRef.current,
        [commentId]: !newState
      };
      
      // Revert the count update too
      debouncedSetLocalReplies((prevReplies) => {
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
  }, [getRealIdIfAvailable, debouncedSetLocalReplies]);

  // Handle opening the reply form - optimized with useCallback
  const handleOpenReply = useCallback((
    id: number, 
    handle: string, 
    avatar: string, 
    content: string,
    level2ParentId?: number
  ) => {
    // Get real IDs if these are optimistic comments
    const realId = getRealIdIfAvailable(id);
    const realLevel2ParentId = level2ParentId ? getRealIdIfAvailable(level2ParentId) : undefined;
    
    setReplyingTo({
      id: realId,
      author: handle,
      avatar,
      content,
      level2ParentId: realLevel2ParentId
    });
  }, [getRealIdIfAvailable]);

  // Cancel reply mode - optimized with useCallback
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Main comment submission handler - optimized with useCallback
  const handleSubmit = useCallback(async (content: string, parentId?: number): Promise<void> => {
    // Basic validation before passing up
    if (!content.trim()) {
      toast.error('Comment cannot be empty.');
      return Promise.reject(new Error('Comment cannot be empty'));
    }
    
    // If parentId is provided, get the real ID if this is an optimistic comment
    const realParentId = parentId ? getRealIdIfAvailable(parentId) : undefined;
      
    // Generate optimistic ID (negative to identify it as optimistic)
    const optimisticId = -Date.now();
    
    try {
      // Create an optimistic comment/reply
      const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
      const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
      
      // Create optimistic reply object
      const optimisticReply: CommentReply = {
        id: optimisticId,
        uid: Number(localStorage.getItem('dapps_user_id') || '0'),
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
                
      // Update UI optimistically, finding the correct parent using realParentId
      if (realParentId) {
        // This is a reply to an existing comment
        setLocalReplies(prevReplies => {
          const addReplyToComment = (comments: CommentReply[]): CommentReply[] => {
            return comments.map(comment => {
              // Check both the actual ID and any mapped optimistic ID
              const commentRealId = getRealIdIfAvailable(comment.id);
              
              if (commentRealId === realParentId) {
                return {
                  ...comment,
                  sub_replies: comment.sub_replies 
                    ? [...comment.sub_replies, optimisticReply] 
                    : [optimisticReply]
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
        setLocalReplies(prevReplies => [...prevReplies, optimisticReply]);
      }
      
      // Call the parent handler to process the actual API call
      const result = await onAddComment(content, realParentId);
      
      // Handle successful API response
      if (result.success && result.reply_id) {
        // Store mapping in ref first to avoid re-renders
        optimisticToRealIdMapRef.current = {
          ...optimisticToRealIdMapRef.current,
          [optimisticId]: result.reply_id
        };
        
        // Then update state for components that need it
        setOptimisticToRealIdMap(prev => ({
          ...prev,
          [optimisticId]: result.reply_id
        }));
        
        // Update the optimistic comment with the real ID
        setLocalReplies(prevReplies => {
          const updateCommentId = (comments: CommentReply[]): CommentReply[] => {
            return comments.map(comment => {
              if (comment.id === optimisticId) {
                return {
                  ...comment,
                  id: result.reply_id as number
                };
              } else if (comment.sub_replies) {
                return {
                  ...comment,
                  sub_replies: updateCommentId(comment.sub_replies)
                };
              }
              return comment;
            });
          };
          
          return updateCommentId(prevReplies);
        });
      }
      
      // Clear reply mode after successful submission
      setReplyingTo(null);
      
      return Promise.resolve();
      
    } catch (error) {
      console.error('Error submitting comment via parent:', error);
      
      // Remove optimistic comment in case of failure
      setLocalReplies(prevReplies => {
        const removeOptimisticReply = (comments: CommentReply[]): CommentReply[] => {
          return comments.filter(comment => comment.id >= 0 || comment.id !== optimisticId).map(comment => {
            if (comment.sub_replies) {
              return {
                ...comment,
                sub_replies: removeOptimisticReply(comment.sub_replies)
              };
            }
            return comment;
          });
        };
        
        return removeOptimisticReply(prevReplies);
      });
      throw error; // Re-throw to allow input component to handle isSubmitting state
    }
  }, [getRealIdIfAvailable, onAddComment]);

  // Memoized function to find comment depth and level 2 parent
  const findCommentDepthAndLevel2Parent = useCallback((
    comments: CommentReply[], 
    id: number, 
    depth = 1, 
    level2ParentId?: number
  ): { depth: number; level2ParentId?: number } => {
    for (const comment of comments) {
      // Use the real ID for comparison if available
      const commentRealId = getRealIdIfAvailable(comment.id);
      
      if (commentRealId === id) {
        return { depth, level2ParentId };
      }
      
      // If this is a level 2 comment, pass its ID as the level2ParentId to children
      const nextLevel2ParentId = depth === 2 ? commentRealId : level2ParentId;
      
      if (comment.sub_replies && comment.sub_replies.length > 0) {
        const result = findCommentDepthAndLevel2Parent(
          comment.sub_replies,
          id,
          depth + 1,
          nextLevel2ParentId
        );
        
        if (result.depth > 0) { // Found the comment
          return result;
        }
      }
    }
    
    return { depth: 0, level2ParentId: undefined };
  }, [getRealIdIfAvailable]);

  // Modified to match the expected function signature - optimized with useCallback
  const handleReplySubmit = useCallback((parentId: number, content: string) => {
    // Get real ID if this is an optimistic comment
    const realParentId = getRealIdIfAvailable(parentId);
    
    // Check if this is a level 3 comment, if so, use its level 2 parent ID instead
    const { depth, level2ParentId } = findCommentDepthAndLevel2Parent(localReplies, realParentId);
    
    if (depth === 3 && level2ParentId) {
      return handleSubmit(content, level2ParentId);
    }
    
    // Normal case - level 1 or 2 comment
    return handleSubmit(content, realParentId);
  }, [handleSubmit, localReplies, getRealIdIfAvailable, findCommentDepthAndLevel2Parent]);

  // Handle a reply to comment by opening the drawer - optimized with useCallback
  const handleOpenMobileReply = useCallback((
    id: number, 
    handle: string, 
    avatar: string, 
    content: string,
    level2ParentId?: number
  ) => {
    // Get real IDs if these are optimistic comments
    const realId = getRealIdIfAvailable(id);
    const realLevel2ParentId = level2ParentId ? getRealIdIfAvailable(level2ParentId) : undefined;
    
    handleOpenReply(realId, handle, avatar, content, realLevel2ParentId);
  }, [handleOpenReply, getRealIdIfAvailable]);

  // Create a memoized list of comment components
  const commentsList = useMemo(() => {
    if (localReplies.length === 0) {
      return (
        <div className="text-center py-8 bg-muted/20 rounded-lg border border-border/40">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 divide-y divide-border/20">
        {localReplies.map(reply => (
          <MemoizedCommentItem
            key={reply.id}
            comment={reply}
            postAuthorHandle={postAuthorHandle}
            postCode={postCode}
            onMeowChange={handleMeowChange}
            onReply={handleReplySubmit}
            onOpenMobileReply={handleOpenMobileReply}
            optimisticToRealIdMap={optimisticToRealIdMap}
            readOnly={readOnly}
          />
        ))}
      </div>
    );
  }, [localReplies, postAuthorHandle, handleMeowChange, handleReplySubmit, handleOpenMobileReply, optimisticToRealIdMap, readOnly]);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Comments list */}
      <div className="space-y-6 mb-24">
        {commentsList}
      </div>
      
      {/* Floating comment input - only show if not in read-only mode */}
      {!readOnly && (
        <MobileCommentInput
          postCode={postCode}
          isReplyMode={!!replyingTo}
          replyToComment={replyingTo || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancelReply}
          ref={commentInputRef}
        />
      )}

      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </>
  );
});
