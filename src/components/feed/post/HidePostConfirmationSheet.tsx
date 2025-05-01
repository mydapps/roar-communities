import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, AlertTriangle } from 'lucide-react';

interface HidePostConfirmationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isHiding: boolean;
}

export function HidePostConfirmationSheet({
  open,
  onOpenChange,
  onConfirm,
  isHiding,
}: HidePostConfirmationSheetProps) {
  const isMobile = useIsMobile();

  const content = (
    <>
      <DialogHeader className={isMobile ? 'text-left' : ''}>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Hide Post Confirmation
        </DialogTitle>
        <DialogDescription className="py-4">
          Are you sure you want to hide this post? This action is irreversible from the platform's view.
          <br /><br />
          While we'll remove it from display here, we cannot guarantee its removal from decentralized storage like IPFS. Other users might still be able to access it through direct links or alternative interfaces.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className={isMobile ? 'pt-4' : ''}>
        <DrawerClose asChild>
          <Button variant="outline" disabled={isHiding}>Cancel</Button>
        </DrawerClose>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isHiding}
          className="flex items-center gap-2"
        >
          {isHiding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {isHiding ? 'Hiding...' : 'Confirm Hide'}
        </Button>
      </DialogFooter>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm p-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {content}
      </DialogContent>
    </Dialog>
  );
} 