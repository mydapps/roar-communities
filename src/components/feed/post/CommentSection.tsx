
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Cat, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Reply {
  id: number;
  uid: number;
  handle: string;
  avatar_url: string;
  content: string;
  created_on: string;
  time_ago: string;
  upvotes: number;
  meow_count: number;
  has_meowed: boolean;
  sub_replies?: Reply[];
}

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

export const CommentSection = ({ comments: initialComments, postCode, onAddComment }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiComments, setApiComments] = useState<Reply[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const { toast } = useToast();
  
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
      const userKey = localStorage.getItem('dapps_user_key');
      if (!userKey) {
        console.error('No user key found for loading comments');
        return;
      }
      
      const response = await fetch(`https://api.dapps.co/get_replies?postCode=${postCode}&limit=3`, {
        method: 'GET',
        headers: {
          'x-user-key': userKey,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }
      
      const data = await response.json();
      
      if (data.success && data.replies) {
        setApiComments(data.replies);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Failed to load comments",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // Optimistically add the comment locally first for better UX
    const tempId = Date.now();
    const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
    
    const tempComment: Reply = {
      id: tempId,
      uid: 0,
      handle: userHandle,
      avatar_url: `https://api.dicebear.com/7.x/personas/svg?seed=${userHandle}`,
      content: newComment,
      created_on: new Date().toISOString(),
      time_ago: 'just now',
      upvotes: 0,
      meow_count: 0,
      has_meowed: false,
    };
    
    setApiComments(prev => [tempComment, ...prev]);
    setNewComment('');
    setSubmittingComment(true);
    
    // Then send to API in the background
    try {
      const userKey = localStorage.getItem('dapps_user_key');
      if (!userKey) {
        console.error('No user key found for posting comment');
        return;
      }
      
      const response = await fetch('https://api.dapps.co/create_reply', {
        method: 'POST',
        headers: {
          'x-user-key': userKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postCode: postCode,
          content: newComment
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the temporary comment with the real data
        setApiComments(prev => prev.map(comment => 
          comment.id === tempId 
            ? {
                ...comment,
                id: data.reply_id,
                time_ago: 'just now',
                created_on: data.created_on,
              }
            : comment
        ));
        
        // Call the parent callback
        onAddComment(newComment);
        
        toast({
          title: "Comment added",
          description: "Your comment has been added to the post"
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Failed to post comment",
        description: "Your comment will be displayed locally only",
        variant: "destructive"
      });
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const handleMeow = async (commentId: number, hasAlreadyMeowed: boolean) => {
    // Optimistically update the UI first
    setApiComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          has_meowed: !hasAlreadyMeowed,
          meow_count: hasAlreadyMeowed ? comment.meow_count - 1 : comment.meow_count + 1
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
                has_meowed: !hasAlreadyMeowed,
                meow_count: hasAlreadyMeowed ? reply.meow_count - 1 : reply.meow_count + 1
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
      const userKey = localStorage.getItem('dapps_user_key');
      if (!userKey) {
        console.error('No user key found for meowing comment');
        return;
      }
      
      const response = await fetch('https://api.dapps.co/meow_reply', {
        method: 'POST',
        headers: {
          'x-user-key': userKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replyId: commentId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to meow comment');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update with the actual count from the server
        setApiComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              meow_count: data.meow_count
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
                    meow_count: data.meow_count
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
            has_meowed: hasAlreadyMeowed,
            meow_count: hasAlreadyMeowed ? comment.meow_count + 1 : comment.meow_count - 1
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
                  has_meowed: hasAlreadyMeowed,
                  meow_count: hasAlreadyMeowed ? reply.meow_count + 1 : reply.meow_count - 1
                };
              }
              return reply;
            })
          };
        }
        
        return comment;
      }));
      
      toast({
        title: "Failed to update meow",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  const renderComment = (comment: Reply) => {
    const [meowAnimating, setMeowAnimating] = useState(false);
    const [meowWavesAnimation, setMeowWavesAnimation] = useState(false);
    const [meowTextAnimating, setMeowTextAnimating] = useState(false);
    
    const handleMeowClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setMeowWavesAnimation(true);
      setMeowAnimating(true);
      setMeowTextAnimating(true);
      
      setTimeout(() => handleMeow(comment.id, comment.has_meowed), 10);
      setTimeout(() => setMeowWavesAnimation(false), 1000);
      setTimeout(() => setMeowAnimating(false), 1200);
      setTimeout(() => setMeowTextAnimating(false), 1500);
    };
    
    return (
      <div key={comment.id} className="flex gap-3 w-full mb-4">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${comment.handle}`} />
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
              <span className={`${comment.has_meowed || meowTextAnimating ? 'text-amber-500 font-medium' : ''}`}>
                {meowTextAnimating ? "Meow!" : comment.meow_count}
              </span>
            </Button>
          </div>
          
          {/* Render nested replies */}
          {comment.sub_replies && comment.sub_replies.length > 0 && (
            <div className="ml-4 mt-3 border-l-2 border-primary/10 pl-4 space-y-4">
              {comment.sub_replies.map(reply => renderComment(reply))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4 mt-4 w-full">
      <h3 className="font-medium text-lg">Comments ({loading ? '...' : apiComments.length})</h3>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : apiComments.length > 0 ? (
        <div className="space-y-4 w-full">
          {apiComments.map(comment => renderComment(comment))}
        </div>
      ) : (
        <Card className="p-4 text-center w-full">
          <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="mt-4 w-full">
        <div className="flex gap-3 w-full">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src="https://api.dicebear.com/7.x/personas/svg?seed=you" />
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
