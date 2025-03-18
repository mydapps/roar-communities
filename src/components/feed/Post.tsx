
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, RefreshCw, Share2, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Custom Lion icon for the Roar button
const LionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 15C8.5 13.5 10 12 12 12C14 12 15.5 13.5 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8.5 9C8.5 9.82843 7.82843 10.5 7 10.5C6.17157 10.5 5.5 9.82843 5.5 9C5.5 8.17157 6.17157 7.5 7 7.5C7.82843 7.5 8.5 8.17157 8.5 9Z" fill="currentColor"/>
    <path d="M18.5 9C18.5 9.82843 17.8284 10.5 17 10.5C16.1716 10.5 15.5 9.82843 15.5 9C15.5 8.17157 16.1716 7.5 17 7.5C17.8284 7.5 18.5 8.17157 18.5 9Z" fill="currentColor"/>
  </svg>
);

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
  
  const handleRoar = () => {
    if (roared) {
      setLocalRoarCount(prev => prev - 1);
    } else {
      setLocalRoarCount(prev => prev + 1);
    }
    setRoared(!roared);
  };

  return (
    <Card className="border border-border/40 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 animate-scale-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${username}`} />
              <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-medium">{username}</span>
                <span className="text-muted-foreground text-sm mx-1">·</span>
                <span className="text-muted-foreground text-sm">{timeAgo}</span>
              </div>
              {community && (
                <Badge variant="outline" className="mt-1 w-fit">
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
          <div className={`grid gap-2 mt-3 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {images.map((img, index) => (
              <img 
                key={index} 
                src={img} 
                alt={`Post attachment ${index + 1}`} 
                className="rounded-md w-full h-auto object-cover max-h-[300px]" 
              />
            ))}
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
            className={`flex gap-1 items-center ${roared ? "animate-roar" : ""}`}
            onClick={handleRoar}
          >
            <span className="text-lg" role="img" aria-label="lion">🦁</span>
            <span>{localRoarCount}</span>
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />
            <span>{commentCount}</span>
          </Button>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            <span>{shareCount}</span>
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
