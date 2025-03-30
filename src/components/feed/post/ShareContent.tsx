
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Share2, Copy, CheckCircle2 } from 'lucide-react';
import { shareToSocialMedia, SharePlatform } from '@/utils/shareUtils';
import { useToast } from '@/hooks/use-toast';

interface ShareContentProps {
  username: string;
  timeAgo: string;
  content: string;
  images?: string[];
  video?: string;
  postCode?: string;
  community?: string;
  onClose: () => void;
  onShareSuccess?: (platform: string) => void;
  avatar?: string;
}

const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const ShareContent = ({ 
  username, 
  timeAgo, 
  content, 
  images, 
  video, 
  postCode,
  community,
  onClose,
  onShareSuccess,
  avatar
}: ShareContentProps) => {
  const { toast } = useToast();
  const [successPlatform, setSuccessPlatform] = useState<string | null>(null);
  const [shareAnimating, setShareAnimating] = useState(false);
  
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    if (community && postCode) {
      return `${baseUrl}/c/${community.toLowerCase().replace(/\s+/g, '-')}/${postCode}`;
    }
    return window.location.href;
  };
  
  const handleShare = async (platform: SharePlatform) => {
    setShareAnimating(true);
    const shareUrl = getShareUrl();
    const shareTitle = `${formatUsername(username)}'s post on Lion's Roar`;
    const shareText = truncateText(content, 100);
    
    const success = await shareToSocialMedia(platform, {
      url: shareUrl,
      title: shareTitle,
      text: shareText
    });
    
    if (success) {
      setSuccessPlatform(platform);
      
      // Show the confetti and success state for a moment
      setTimeout(() => {
        toast({
          title: "Shared successfully!",
          description: platform === 'copy' ? "Link copied to clipboard!" : `Post shared on ${platform}!`,
          variant: "default"
        });
        
        // Call the onShareSuccess callback if provided
        if (onShareSuccess) {
          onShareSuccess(platform);
        }
        
        // Reset after showing feedback
        setTimeout(() => {
          setSuccessPlatform(null);
          setShareAnimating(false);
        }, 2000);
      }, 500);
    } else {
      setShareAnimating(false);
      toast({
        title: "Sharing failed",
        description: "Could not share the post",
        variant: "destructive"
      });
    }
  };
  
  // Determine the avatar source correctly
  const getAvatarSource = () => {
    if (avatar) {
      return `https://img.dapps.co/avatar/${avatar}.svg`;
    }
    return `https://api.dicebear.com/7.x/personas/svg?seed=${username}`;
  };
  
  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-start gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getAvatarSource()} />
            <AvatarFallback>{username[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-medium">{formatUsername(username)}</span>
              <span className="text-muted-foreground text-sm mx-1">·</span>
              <span className="text-muted-foreground text-sm">{timeAgo}</span>
            </div>
            <p className="text-sm mt-1">{truncateText(content, 150)}</p>
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
              className={`flex flex-col h-20 gap-1 items-center justify-center relative overflow-hidden ${successPlatform === 'native' ? 'border-primary/50 bg-primary/5' : ''}`} 
              onClick={() => handleShare('native')}
              disabled={shareAnimating}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-full ${successPlatform === 'native' ? 'bg-primary/20' : 'bg-primary/10'}`}>
                {successPlatform === 'native' ? (
                  <CheckCircle2 className="h-4 w-4 text-primary animate-scale-in" />
                ) : (
                  <Share2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <span className="text-xs">{successPlatform === 'native' ? 'Shared!' : 'Share'}</span>
              {successPlatform === 'native' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
              )}
            </Button>
          )}
          <Button 
            variant="outline" 
            className={`flex flex-col h-20 gap-1 items-center justify-center relative overflow-hidden ${successPlatform === 'twitter' ? 'border-[#1DA1F2]/50 bg-[#1DA1F2]/5' : ''}`} 
            onClick={() => handleShare('twitter')}
            disabled={shareAnimating}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${successPlatform === 'twitter' ? 'bg-[#1DA1F2]/20' : 'bg-[#1DA1F2]/10'}`}>
              {successPlatform === 'twitter' ? (
                <CheckCircle2 className="h-4 w-4 text-[#1DA1F2] animate-scale-in" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#1DA1F2]">
                  <path fill="currentColor" d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              )}
            </div>
            <span className="text-xs">{successPlatform === 'twitter' ? 'Shared!' : 'X / Twitter'}</span>
            {successPlatform === 'twitter' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1DA1F2]/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className={`flex flex-col h-20 gap-1 items-center justify-center relative overflow-hidden ${successPlatform === 'facebook' ? 'border-[#1877F2]/50 bg-[#1877F2]/5' : ''}`} 
            onClick={() => handleShare('facebook')}
            disabled={shareAnimating}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${successPlatform === 'facebook' ? 'bg-[#1877F2]/20' : 'bg-[#1877F2]/10'}`}>
              {successPlatform === 'facebook' ? (
                <CheckCircle2 className="h-4 w-4 text-[#1877F2] animate-scale-in" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#1877F2]">
                  <path fill="currentColor" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                </svg>
              )}
            </div>
            <span className="text-xs">{successPlatform === 'facebook' ? 'Shared!' : 'Facebook'}</span>
            {successPlatform === 'facebook' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1877F2]/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className={`flex flex-col h-20 gap-1 items-center justify-center relative overflow-hidden ${successPlatform === 'farcaster' ? 'border-[#855DCD]/50 bg-[#855DCD]/5' : ''}`} 
            onClick={() => handleShare('farcaster')}
            disabled={shareAnimating}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${successPlatform === 'farcaster' ? 'bg-[#855DCD]/20' : 'bg-[#855DCD]/10'}`}>
              {successPlatform === 'farcaster' ? (
                <CheckCircle2 className="h-4 w-4 text-[#855DCD] animate-scale-in" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#855DCD]">
                  <path fill="currentColor" d="M11.8 1.6c-5.7 0-10.2 4.6-10.2 10.2 0 5.7 4.6 10.2 10.2 10.2 5.7 0 10.2-4.6 10.2-10.2 0-5.7-4.6-10.2-10.2-10.2zM3.9 11.8C3.9 7.2 7.5 3.4 12 3.4c2 0 3.9.7 5.4 2l-8.9 8.9c-2.6-2.2-4.6-2.5-4.6-2.5zm7.9 7.9c-2 0-3.9-.7-5.4-2l8.9-8.9c3.8 3.2 4.6 5.4 4.6 5.4-1.5 3.2-4.6 5.5-8.1 5.5z" />
                </svg>
              )}
            </div>
            <span className="text-xs">{successPlatform === 'farcaster' ? 'Shared!' : 'Farcaster'}</span>
            {successPlatform === 'farcaster' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#855DCD]/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className={`flex flex-col h-20 gap-1 items-center justify-center relative overflow-hidden ${successPlatform === 'telegram' ? 'border-[#0088cc]/50 bg-[#0088cc]/5' : ''}`} 
            onClick={() => handleShare('telegram')}
            disabled={shareAnimating}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${successPlatform === 'telegram' ? 'bg-[#0088cc]/20' : 'bg-[#0088cc]/10'}`}>
              {successPlatform === 'telegram' ? (
                <CheckCircle2 className="h-4 w-4 text-[#0088cc] animate-scale-in" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#0088cc]">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.2-.06-.06-.17-.04-.25-.02-.11.02-1.84 1.17-5.21 3.42-.49.33-.94.5-1.35.48-.44-.02-1.3-.25-1.93-.46-.78-.26-1.39-.4-1.34-.85.03-.22.32-.45.88-.68 3.44-1.57 5.75-2.58 6.9-3.06 3.27-1.36 3.96-1.6 4.4-1.6.1 0 .32.02.45.17.13.13.18.35.14.66z" />
                </svg>
              )}
            </div>
            <span className="text-xs">{successPlatform === 'telegram' ? 'Shared!' : 'Telegram'}</span>
            {successPlatform === 'telegram' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0088cc]/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className={`flex flex-col h-20 gap-1 items-center justify-center relative overflow-hidden ${successPlatform === 'copy' ? 'border-primary/50 bg-primary/5' : ''}`} 
            onClick={() => handleShare('copy')}
            disabled={shareAnimating}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${successPlatform === 'copy' ? 'bg-primary/20' : 'bg-muted'}`}>
              {successPlatform === 'copy' ? (
                <CheckCircle2 className="h-4 w-4 text-primary animate-scale-in" />
              ) : (
                <Copy className="h-4 w-4 text-foreground" />
              )}
            </div>
            <span className="text-xs">{successPlatform === 'copy' ? 'Copied!' : 'Copy Link'}</span>
            {successPlatform === 'copy' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
