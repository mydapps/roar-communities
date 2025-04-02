import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { shareToSocialMedia, SharePlatform } from '@/utils/shareUtils';
import { Copy, Linkedin, Send } from 'lucide-react';
import { toast } from "sonner";

// WhatsApp Icon Component
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#25D366]">
    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
  </svg>
);

// Proper X Icon
const XLogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"></path>
  </svg>
);

interface ShareDialogProps {
  children: React.ReactNode;
  postTitle: string;
  communityName: string;
}

export const ShareDialog = ({ children, postTitle, communityName }: ShareDialogProps) => {
  const handleShare = async (platform: SharePlatform) => {
    const url = window.location.href;
    const title = `${postTitle} | ${communityName} Community`;
    const text = `Check out this post in the ${communityName} community on ROAR!`;
    
    const success = await shareToSocialMedia(platform, { url, title, text });
    
    if (success && platform === 'copy') {
      toast.success("Link copied to clipboard!");
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button variant="twitter" className="flex gap-2" onClick={() => handleShare('twitter')}>
            <XLogoIcon />
            X
          </Button>
          <Button variant="whatsapp" className="flex gap-2" onClick={() => handleShare('whatsapp')}>
            <WhatsAppIcon />
            WhatsApp
          </Button>
          <Button variant="linkedin" className="flex gap-2" onClick={() => handleShare('linkedin')}>
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
          <Button variant="telegram" className="flex gap-2" onClick={() => handleShare('telegram')}>
            <Send className="h-4 w-4" />
            Telegram
          </Button>
          <Button variant="outline" className="flex gap-2 col-span-2" onClick={() => handleShare('copy')}>
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
