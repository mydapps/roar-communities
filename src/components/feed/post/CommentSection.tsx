import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Cat, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { fetchReplies, toggleMeow, createReply, Reply } from '@/utils/commentApi';

interface CommentSectionProps {
  comments: Array<{
    id: string;
    user: string;
    text: string;
    timeAgo: string;
  }>;
  postCode: string;
  onAddComment: (text: string) => void;
}

// Helper component for the meow button to avoid state in map function
const MeowButton = ({ 
  comment, 
  onMeow 
}: { 
  comment: Reply, 
  onMeow: (commentId: number) => void 
}) => {
  const [meowAnimating, setMeowAnimating] = useState(false);
  const [meowWavesAnimation, setMeowWavesAnimation] = useState(false);
  const [meowTextAnimating, setMeowTextAnimating] = useState(false);
  
  const handleMeowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show animation when adding a meow, not removing it
    if (!comment.has_meowed) {
      setMeowWavesAnimation(true);
      setMeowAnimating(true);
      setMeowTextAnimating(true);
      
      setTimeout(() => setMeowWavesAnimation(false), 1000);
      setTimeout(() => setMeowAnimating(false), 1200);
      setTimeout(() => setMeowTextAnimating(false), 1500);
    } else {
      // Immediately update visual state when unmeowing
      setMeowWavesAnimation(false);
      setMeowAnimating(false);
      setMeowTextAnimating(false);
    }
    
    // Call the onMeow handler
    onMeow(comment.id);
  };
  
  return (
    <Button 
      variant={comment.has_meowed ? "meow-active" : "meow"} 
      size="sm" 
      onClick={handleMeowClick}
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
      <span className={comment.has_meowed ? 'text-amber-500 font-medium' : ''}>
        {meowTextAnimating ? "Meow!" : comment.meow_count}
      </span>
    </Button>
  );
};

// Separate component for rendering a comment to avoid state in map function
const CommentItem = ({ 
  comment, 
  onMeow 
}: { 
  comment: Reply, 
  onMeow: (commentId: number) => void 
}) => {
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  // Fix the avatar URL
  const getAvatarUrl = (avatarPath: string) => {
    // If the path already includes the full URL, return just the avatar ID
    if (avatarPath.includes('https://img.dapps.co/avatar/')) {
      const parts = avatarPath.split('https://img.dapps.co/avatar/');
      return parts[parts.length - 1].replace('.svg.svg', '.svg');
    }
    return avatarPath;
  };
  
  return (
    <div key={comment.id} className="flex gap-3 w-full mb-4">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={`https://img.dapps.co/avatar/${getAvatarUrl(comment.avatar_url)}`} />
        <AvatarFallback>{comment.handle[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {comment.handle === 'you' ? 'you' : formatUsername(comment.handle)}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-muted-foreground text-xs">{comment.time_ago}</span>
        </div>
        <p className="text-sm">{comment.content}</p>
        
        <div className="mt-2 flex items-center gap-2">
          <MeowButton comment={comment} onMeow={onMeow} />
        </div>
        
        {/* Render nested replies */}
        {comment.sub_replies && comment.sub_replies.length > 0 && (
          <div className="ml-4 mt-3 border-l-2 border-primary/10 pl-4 space-y-4">
            {comment.sub_replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} onMeow={onMeow} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentSection = ({ comments: initialComments, postCode, onAddComment }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiComments, setApiComments] = useState<Reply[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Load comments from API when the component mounts
  useEffect(() => {
    if (postCode) {
      loadCommentsFromApi();
    }
  }, [postCode]);
  
  const loadCommentsFromApi = async () => {
    if (!postCode) return;
    
    setLoading(true);
    try {
      const response = await fetchReplies(postCode);
      
      if (response.success && response.replies) {
        setApiComments(response.replies);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Could not load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // Get user avatar from localStorage
    const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
    const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
    
    // Optimistically add the comment locally first for better UX
    const tempId = Date.now();
    
    const tempComment: Reply = {
      id: tempId,
      uid: 0,
      handle: userHandle,
      avatar_url: userAvatar, // Already storing just the ID
      content: newComment,
      created_on: new Date().toISOString(),
      time_ago: 'just now',
      upvotes: 0,
      meow_count: 0,
      has_meowed: false,
    };
    
    // Add new comment at the bottom (after existing comments)
    setApiComments(prev => [...prev, tempComment]);
    setNewComment('');
    setSubmittingComment(true);
    
    // Then send to API in the background
    try {
      const response = await createReply(postCode, newComment);
      
      if (response.success) {
        // Update the temporary comment with the real data
        setApiComments(prev => prev.map(comment => 
          comment.id === tempId 
            ? {
                ...comment,
                id: response.reply_id,
                time_ago: 'just now',
                created_on: response.created_on,
                avatar_url: response.avatar_url,
              }
            : comment
        ));
        
        // Call the parent callback
        onAddComment(newComment);
        
        toast.success('Comment added');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Could not post your comment. Please try again later.');
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const handleMeow = async (commentId: number) => {
    // Optimistically update the UI first
    setApiComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          has_meowed: !comment.has_meowed,
          meow_count: comment.has_meowed ? comment.meow_count - 1 : comment.meow_count + 1
        };
      }
      
      // Also handle nested replies
      if (comment.sub_replies && comment.sub_replies.length > 0) {
        return {
          ...comment,
          sub_replies: comment.sub_replies.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                has_meowed: !reply.has_meowed,
                meow_count: reply.has_meowed ? reply.meow_count - 1 : reply.meow_count + 1
              };
            }
            return reply;
          })
        };
      }
      
      return comment;
    }));
    
    // Then call the API
    try {
      const response = await toggleMeow(commentId);
      
      if (response.success) {
        // Update with the actual count from the server
        setApiComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              meow_count: response.meow_count
            };
          }
          
          // Also handle nested replies
          if (comment.sub_replies && comment.sub_replies.length > 0) {
            return {
              ...comment,
              sub_replies: comment.sub_replies.map(reply => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    meow_count: response.meow_count
                  };
                }
                return reply;
              })
            };
          }
          
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error meowing comment:', error);
      
      // Revert the optimistic update on error
      setApiComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            has_meowed: !comment.has_meowed,
            meow_count: comment.has_meowed ? comment.meow_count + 1 : comment.meow_count - 1
          };
        }
        
        // Also handle nested replies
        if (comment.sub_replies && comment.sub_replies.length > 0) {
          return {
            ...comment,
            sub_replies: comment.sub_replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  has_meowed: !reply.has_meowed,
                  meow_count: reply.has_meowed ? reply.meow_count + 1 : reply.meow_count - 1
                };
              }
              return reply;
            })
          };
        }
        
        return comment;
      }));
      
      toast.error('Failed to update meow. Please try again later.');
    }
  };
  
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  // Get user avatar from localStorage - don't need to transform it
  const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
  
  return (
    <div className="space-y-4 mt-4 w-full">
      <h3 className="font-medium text-lg">Comments ({loading ? '...' : apiComments.length})</h3>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : apiComments.length > 0 ? (
        <div className="space-y-4 w-full">
          {apiComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} onMeow={handleMeow} />
          ))}
        </div>
      ) : (
        <Card className="p-4 text-center w-full">
          <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="mt-4 w-full">
        <div className="flex gap-3 w-full">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={`https://img.dapps.co/avatar/${userAvatar}.svg`} />
            <AvatarFallback>Y</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 w-full">
            <Textarea 
              placeholder="Write a comment..." 
              className="min-h-[80px] resize-none w-full"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="sm" 
                disabled={!newComment.trim() || submittingComment} 
                className="gap-1.5"
              >
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Comment
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
