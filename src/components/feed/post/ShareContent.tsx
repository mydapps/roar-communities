
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Share2, Copy } from 'lucide-react';

interface ShareContentProps {
  username: string;
  timeAgo: string;
  content: string;
  images?: string[];
  video?: string;
  onShare: (platform: string) => void;
}

export const ShareContent = ({ username, timeAgo, content, images, video, onShare }: ShareContentProps) => {
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-start gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${username}`} />
            <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-medium">{formatUsername(username)}</span>
              <span className="text-muted-foreground text-sm mx-1">·</span>
              <span className="text-muted-foreground text-sm">{timeAgo}</span>
            </div>
            <p className="text-sm mt-1">{content}</p>
          </div>
        </div>
        
        {(images?.length || video) && (
          <div className="ml-12 mt-2">
            {images && images.length > 0 && (
              <img 
                src={images[0]} 
                alt="First image" 
                className="rounded-md h-20 w-auto object-cover"
              />
            )}
            {video && (
              <video 
                src={video} 
                className="rounded-md h-20 w-auto object-cover"
              />
            )}
            {images && images.length > 1 && (
              <span className="text-xs text-muted-foreground mt-1 block">
                +{images.length - 1} more {images.length === 2 ? 'image' : 'images'}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="mb-4 text-sm font-medium">Share via</h3>
        <div className="grid grid-cols-3 gap-2">
          {navigator.share && (
            <Button 
              variant="outline" 
              className="flex flex-col h-20 gap-1 items-center justify-center" 
              onClick={() => onShare('Web Share API')}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs">Share</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            className="flex flex-col h-20 gap-1 items-center justify-center" 
            onClick={() => onShare('Twitter')}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1DA1F2]/10">
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#1DA1F2]">
                <path fill="currentColor" d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
              </svg>
            </div>
            <span className="text-xs">X / Twitter</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-20 gap-1 items-center justify-center" 
            onClick={() => onShare('WhatsApp')}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#25D366]/10">
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#25D366]">
                <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className="text-xs">WhatsApp</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-20 gap-1 items-center justify-center" 
            onClick={() => onShare('Farcaster')}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#855DCD]/10">
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#855DCD]">
                <path fill="currentColor" d="M11.8 1.6c-5.7 0-10.2 4.6-10.2 10.2 0 5.7 4.6 10.2 10.2 10.2 5.7 0 10.2-4.6 10.2-10.2 0-5.7-4.6-10.2-10.2-10.2zM3.9 11.8C3.9 7.2 7.5 3.4 12 3.4c2 0 3.9.7 5.4 2l-8.9 8.9c-2.6-2.2-4.6-2.5-4.6-2.5zm7.9 7.9c-2 0-3.9-.7-5.4-2l8.9-8.9c3.8 3.2 4.6 5.4 4.6 5.4-1.5 3.2-4.6 5.5-8.1 5.5z" />
              </svg>
            </div>
            <span className="text-xs">Farcaster</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-20 gap-1 items-center justify-center" 
            onClick={() => onShare('Copy Link')}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
              <Copy className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-xs">Copy Link</span>
          </Button>
        </div>
      </div>
    </>
  );
};
