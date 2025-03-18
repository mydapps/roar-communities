
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, RefreshCw, Share2, TrendingUp, Heart, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export interface PostProps {
  username: string;
  community?: string;
  timeAgo: string;
  content: string;
  roarCount: number;
  commentCount: number;
  shareCount: number;
  images?: string[];
  video?: string;
}

export const Post = ({ 
  username, 
  community, 
  timeAgo, 
  content, 
  roarCount, 
  commentCount, 
  shareCount,
  images,
  video
}: PostProps) => {
  const [roared, setRoared] = useState(false);
  const [localRoarCount, setLocalRoarCount] = useState(roarCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<{user: string, text: string, timeAgo: string}[]>([]);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const { toast } = useToast();
  
  const handleRoar = () => {
    if (roared) {
      setLocalRoarCount(prev => prev - 1);
    } else {
      setLocalRoarCount(prev => prev + 1);
      // Trigger dopamine hit with toast notification for first roar
      if (!roared) {
        toast({
          title: "Roared!",
          description: "Your roar was heard across the savanna!",
          duration: 2000,
        });
      }
    }
    setRoared(!roared);
  };

  const handleCommentToggle = () => {
    setShowComments(!showComments);
    
    // Load dummy comments if none exist yet
    if (comments.length === 0) {
      setComments([
        { user: 'sarah', text: 'This is amazing! Thanks for sharing.', timeAgo: '5m' },
        { user: 'alex', text: 'I had a similar experience last week.', timeAgo: '12m' },
      ]);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Add the new comment
      setComments([
        { user: 'you', text: newComment, timeAgo: 'just now' },
        ...comments
      ]);
      
      // Clear the input
      setNewComment('');
      
      // Provide dopamine hit
      toast({
        title: "Comment added!",
        description: "Your thoughts are now live!",
        duration: 2000,
      });
    }
  };

  const handleShare = (platform: string) => {
    // Close the share menu
    setShareMenuOpen(false);
    
    // Show success toast (dopamine hit)
    toast({
      title: `Shared on ${platform}!`,
      description: "Your friends will love this post.",
      duration: 2000,
    });
  };

  const formatUsername = (name: string) => {
    // Remove any extensions like .eth, .lens, etc.
    return '@' + name.split('.')[0];
  };

  return (
    <Card className="border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden animate-scale-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20 hover:border-primary/50 transition-colors">
              <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${username}`} />
              <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{formatUsername(username)}</span>
                <span className="text-muted-foreground text-sm mx-1">·</span>
                <span className="text-muted-foreground text-sm">{timeAgo}</span>
              </div>
              {community && (
                <Badge variant="outline" className="mt-1 w-fit bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <span className="text-xs">{community}</span>
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm mt-2">{content}</p>
        
        {/* Display media content */}
        {images && images.length > 0 && (
          <div className="mt-3">
            {images.length === 1 ? (
              <img 
                src={images[0]} 
                alt={`Post attachment`} 
                className="rounded-md w-full h-auto object-cover max-h-[300px]" 
              />
            ) : (
              <Carousel className="w-full">
                <CarouselContent>
                  {images.map((img, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <img 
                          src={img} 
                          alt={`Post attachment ${index + 1}`} 
                          className="rounded-md w-full h-auto object-cover max-h-[300px]" 
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-3 bg-background/80 backdrop-blur-sm" />
                <CarouselNext className="-right-3 bg-background/80 backdrop-blur-sm" />
              </Carousel>
            )}
          </div>
        )}
        
        {video && (
          <div className="mt-3">
            <video 
              src={video} 
              controls 
              className="rounded-md w-full max-h-[300px]"
            />
          </div>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="py-3">
        <div className="flex justify-between w-full">
          <Button 
            variant={roared ? "default" : "ghost"} 
            size="sm"
            className={`flex gap-1.5 items-center ${roared ? "animate-roar bg-amber-500 hover:bg-amber-600" : ""} transition-all duration-200`}
            onClick={handleRoar}
          >
            <span className="text-lg" role="img" aria-label="lion">🦁</span>
            <span>{localRoarCount}</span>
          </Button>
          
          <Button 
            variant={showComments ? "default" : "ghost"} 
            size="sm"
            onClick={handleCommentToggle}
            className="flex gap-1.5 items-center transition-all duration-200"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length || commentCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="flex gap-1.5 items-center transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{shareCount}</span>
          </Button>
          
          <div className="relative">
            <Button 
              variant={shareMenuOpen ? "default" : "ghost"} 
              size="sm"
              onClick={() => setShareMenuOpen(!shareMenuOpen)}
              className="flex gap-1.5 items-center transition-all duration-200"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
            
            {shareMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 min-w-32 z-10">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleShare('Twitter')}>
                    Twitter
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleShare('Facebook')}>
                    Facebook
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleShare('Copy Link')}>
                    Copy Link
                  </Button>
                  <Separator className="my-1" />
                  <Button variant="ghost" size="sm" className="justify-start text-destructive" onClick={() => setShareMenuOpen(false)}>
                    <X className="h-3.5 w-3.5 mr-1.5" /> Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardFooter>
      
      {/* Comments section */}
      {showComments && (
        <div className="px-6 pb-4">
          <Separator className="mb-3" />
          
          {/* Comment input */}
          <div className="flex gap-2 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://api.dicebear.com/7.x/personas/svg?seed=you" />
              <AvatarFallback>Y</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea 
                placeholder="Add a comment..." 
                className="min-h-0 h-9 py-2 resize-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button 
                size="sm" 
                onClick={handleAddComment}
                className="h-9"
                disabled={!newComment.trim()}
              >
                Post
              </Button>
            </div>
          </div>
          
          {/* Comment list */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment, i) => (
              <div key={i} className="flex gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${comment.user}`} />
                  <AvatarFallback>{comment.user[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">{comment.user === 'you' ? 'you' : '@' + comment.user}</span>
                    <span className="text-muted-foreground text-xs">{comment.timeAgo}</span>
                  </div>
                  <p className="text-sm mt-0.5">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
