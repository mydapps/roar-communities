
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface Comment {
  id: string;
  user: string;
  text: string;
  timeAgo: string;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
}

export const CommentSection = ({ comments, onAddComment }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };
  
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  return (
    <div className="space-y-4 mt-4">
      <h3 className="font-medium text-lg">Comments ({comments.length})</h3>
      
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${comment.user}`} />
                <AvatarFallback>{comment.user[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.user === 'you' ? 'you' : formatUsername(comment.user)}
                  </span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-muted-foreground text-xs">{comment.timeAgo}</span>
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://api.dicebear.com/7.x/personas/svg?seed=you" />
            <AvatarFallback>Y</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea 
              placeholder="Write a comment..." 
              className="min-h-[80px] resize-none"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!newComment.trim()} className="gap-1.5">
                <Send className="h-4 w-4" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
