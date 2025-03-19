
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { shareToSocialMedia, SharePlatform } from '@/utils/shareUtils';
import { Copy, Twitter, Facebook, Linkedin, Send } from 'lucide-react';
import { toast } from "sonner";

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
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          <Button variant="facebook" className="flex gap-2" onClick={() => handleShare('facebook')}>
            <Facebook className="h-4 w-4" />
            Facebook
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
