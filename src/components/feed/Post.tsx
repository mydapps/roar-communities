
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, RefreshCw, Share2, TrendingUp, Copy, Heart, X } from 'lucide-react';
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
  const [roarAnimation, setRoarAnimation] = useState(false);
  const { toast } = useToast();
  
  const handleRoar = () => {
    if (roared) {
      setLocalRoarCount(prev => prev - 1);
    } else {
      setLocalRoarCount(prev => prev + 1);
      // Trigger roar animation
      setRoarAnimation(true);
      setTimeout(() => setRoarAnimation(false), 700);
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
    }
  };

  const handleShare = (platform: string) => {
    // Close the share menu
    setShareMenuOpen(false);
  };

  const formatUsername = (name: string) => {
    // Remove any extensions like .eth, .lens, etc. and add @
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
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {images.map((_, index) => (
                    <div 
                      key={index} 
                      className={`h-1.5 rounded-full transition-all ${
                        index === 0 ? "w-4 bg-primary" : "w-1.5 bg-primary/40"
                      }`} 
                    />
                  ))}
                </div>
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
          <div className="relative">
            <Button 
              variant={roared ? "default" : "ghost"} 
              size="sm"
              className={`flex gap-1.5 items-center ${roared ? "bg-amber-500 hover:bg-amber-600" : ""} transition-all duration-200`}
              onClick={handleRoar}
            >
              <div className={`relative ${roarAnimation ? "animate-roar" : ""}`}>
                <span className="text-lg" role="img" aria-label="lion">🦁</span>
                {roarAnimation && (
                  <div className="absolute -top-3 -right-8 animate-fade-out">
                    <span className="text-xs font-bold text-amber-500">ROAR!</span>
                  </div>
                )}
              </div>
              <span>{localRoarCount}</span>
            </Button>
          </div>
          
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
              <div className="absolute bottom-full right-0 mb-2 rounded-lg shadow-lg z-10 animate-slide-up overflow-hidden">
                <div className="bg-card border border-border p-0 rounded-lg">
                  <div className="flex flex-col">
                    <Button variant="ghost" size="sm" className="justify-start rounded-none gap-2 py-3 px-4 hover:bg-accent" onClick={() => handleShare('Twitter')}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#1DA1F2]">
                        <path fill="currentColor" d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                      </svg>
                      X / Twitter
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start rounded-none gap-2 py-3 px-4 hover:bg-accent" onClick={() => handleShare('WhatsApp')}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#25D366]">
                        <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start rounded-none gap-2 py-3 px-4 hover:bg-accent" onClick={() => handleShare('Farcaster')}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#855DCD]">
                        <path fill="currentColor" d="M11.8 1.6c-5.7 0-10.2 4.6-10.2 10.2 0 5.7 4.6 10.2 10.2 10.2 5.7 0 10.2-4.6 10.2-10.2 0-5.7-4.6-10.2-10.2-10.2zM3.9 11.8C3.9 7.2 7.5 3.4 12 3.4c2 0 3.9.7 5.4 2l-8.9 8.9c-2.6-2.2-4.6-2.5-4.6-2.5zm7.9 7.9c-2 0-3.9-.7-5.4-2l8.9-8.9c3.8 3.2 4.6 5.4 4.6 5.4-1.5 3.2-4.6 5.5-8.1 5.5z" />
                      </svg>  
                      Farcaster
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start rounded-none gap-2 py-3 px-4 hover:bg-accent" onClick={() => handleShare('Copy Link')}>
                      <Copy className="h-4 w-4 text-muted-foreground" />
                      Copy Link
                    </Button>
                    <Separator className="my-1" />
                    <Button variant="ghost" size="sm" className="justify-start rounded-none text-destructive py-3 px-4 hover:bg-accent" onClick={() => setShareMenuOpen(false)}>
                      <X className="h-3.5 w-3.5 mr-1.5" /> Close
                    </Button>
                  </div>
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
