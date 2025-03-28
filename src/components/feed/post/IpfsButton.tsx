
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { isMobile } from '@/utils/responsive';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, DrawerTrigger } from '@/components/ui/drawer';
import { IpfsContent } from './IpfsContent';

interface IpfsButtonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ipfsHash: string;
  onVerify: () => void;
}

export const IpfsButton = ({ open, onOpenChange, ipfsHash, onVerify }: IpfsButtonProps) => {
  const mobile = isMobile();
  
  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <ShieldCheck className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Freedom of Expression
            </DrawerTitle>
            <DrawerDescription>
              This post is stored on IPFS, a decentralized storage network. 
              This ensures that your content remains censorship-resistant and 
              permanently available.
            </DrawerDescription>
          </DrawerHeader>
          
          <IpfsContent ipfsHash={ipfsHash} />
          
          <DrawerFooter className="flex-row justify-between gap-2 p-4 border-t">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
            <Button 
              onClick={onVerify}
              className="gap-1.5"
            >
              <ExternalLink className="h-4 w-4" />
              Verify on IPFS
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
          <ShieldCheck className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Freedom of Expression
          </SheetTitle>
          <SheetDescription>
            This post is stored on IPFS, a decentralized storage network. 
            This ensures that your content remains censorship-resistant and 
            permanently available.
          </SheetDescription>
        </SheetHeader>
        
        <IpfsContent ipfsHash={ipfsHash} />
        
        <SheetFooter className="flex flex-row justify-between gap-2 mt-6">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button 
            onClick={onVerify}
            className="gap-1.5"
          >
            <ExternalLink className="h-4 w-4" />
            Verify on IPFS
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
