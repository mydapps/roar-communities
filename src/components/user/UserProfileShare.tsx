import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, CheckCircle2, Linkedin, Send } from 'lucide-react';
import { shareToSocialMedia, SharePlatform } from '@/utils/shareUtils';
import { toast } from "sonner";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

// WhatsApp Icon Component
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#25D366]">
    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
  </svg>
);

// Proper X Logo Icon
const XLogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"></path>
  </svg>
);

// Farcaster Icon Component
const FarcasterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#855DCD]">
    <path fill="currentColor" d="M11.8 1.6c-5.7 0-10.2 4.6-10.2 10.2 0 5.7 4.6 10.2 10.2 10.2 5.7 0 10.2-4.6 10.2-10.2 0-5.7-4.6-10.2-10.2-10.2zM3.9 11.8C3.9 7.2 7.5 3.4 12 3.4c2 0 3.9.7 5.4 2l-8.9 8.9c-2.6-2.2-4.6-2.5-4.6-2.5zm7.9 7.9c-2 0-3.9-.7-5.4-2l8.9-8.9c3.8 3.2 4.6 5.4 4.6 5.4-1.5 3.2-4.6 5.5-8.1 5.5z" />
  </svg>
);

interface UserProfileShareProps {
  handle: string;
  triggerComponent?: React.ReactNode;
}

export const UserProfileShare = ({ handle, triggerComponent }: UserProfileShareProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [successPlatform, setSuccessPlatform] = useState<string | null>(null);
  const [shareAnimating, setShareAnimating] = useState(false);
  const isMobile = useIsMobile();

  const handleShare = async (platform: SharePlatform) => {
    setShareAnimating(true);
    const url = window.location.href;
    const title = `@${handle}'s Profile on dapps.co`;
    const text = `Check out @${handle}'s profile on dapps.co!`;
    
    // Try native sharing first (mobile)
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        setIsOpen(false);
        return;
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
    
    // Fall back to platform-specific sharing
    const success = await shareToSocialMedia(platform, { url, title, text });
    
    if (success) {
      setSuccessPlatform(platform);
      
      // Show the confetti and success state for a moment
      setTimeout(() => {
        toast.success(platform === 'copy' 
          ? "Profile link copied to clipboard!" 
          : `Profile shared on ${platform}!`);
        
        // Reset after showing feedback
        setTimeout(() => {
          setSuccessPlatform(null);
          setShareAnimating(false);
        }, 2000);
      }, 500);
    } else {
      setShareAnimating(false);
      toast.error("Could not share the profile");
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  const defaultTrigger = (
    <Button 
      onClick={handleClick}
      size="icon"
      variant="ghost"
      className="h-9 w-9 rounded-full"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
  
  const shareContent = (
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
              <XLogoIcon />
            )}
          </div>
          <span className="text-xs">{successPlatform === 'twitter' ? 'Shared!' : 'X / Twitter'}</span>
          {successPlatform === 'twitter' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1DA1F2]/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          className={`flex flex-col h-20 gap-1 items-center justify-center relative overflow-hidden ${successPlatform === 'whatsapp' ? 'border-[#25D366]/50 bg-[#25D366]/5' : ''}`} 
          onClick={() => handleShare('whatsapp')}
          disabled={shareAnimating}
        >
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${successPlatform === 'whatsapp' ? 'bg-[#25D366]/20' : 'bg-[#25D366]/10'}`}>
            {successPlatform === 'whatsapp' ? (
              <CheckCircle2 className="h-4 w-4 text-[#25D366] animate-scale-in" />
            ) : (
              <WhatsAppIcon />
            )}
          </div>
          <span className="text-xs">{successPlatform === 'whatsapp' ? 'Shared!' : 'WhatsApp'}</span>
          {successPlatform === 'whatsapp' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#25D366]/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
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
              <FarcasterIcon />
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
              <Send className="h-4 w-4 text-[#0088cc]" />
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
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${successPlatform === 'copy' ? 'bg-primary/20' : 'bg-primary/10'}`}>
            {successPlatform === 'copy' ? (
              <CheckCircle2 className="h-4 w-4 text-primary animate-scale-in" />
            ) : (
              <Copy className="h-4 w-4 text-primary" />
            )}
          </div>
          <span className="text-xs">{successPlatform === 'copy' ? 'Copied!' : 'Copy Link'}</span>
          {successPlatform === 'copy' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
          )}
        </Button>
      </div>
    </div>
  );
  
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {triggerComponent || defaultTrigger}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Share @{handle}'s profile</DrawerTitle>
          </DrawerHeader>
          {shareContent}
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {triggerComponent || defaultTrigger}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Share @{handle}'s profile</SheetTitle>
        </SheetHeader>
        {shareContent}
      </SheetContent>
    </Sheet>
  );
};

export default UserProfileShare; 