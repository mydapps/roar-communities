
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

interface ImageViewerProps {
  image: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImageViewer = ({ image, open, onOpenChange }: ImageViewerProps) => {
  if (!image) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
        <div className="relative w-full">
          <DialogClose className="absolute right-4 top-4 z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 text-white rounded-full hover:bg-black/70">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          <img 
            src={image} 
            alt="Full size" 
            className="w-full max-h-[80vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
