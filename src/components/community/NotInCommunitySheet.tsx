import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertCircle, ChevronRight, MessageCircle } from 'lucide-react';

interface NotInCommunitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityName: string;
}

export const NotInCommunitySheet = ({
  open,
  onOpenChange,
  communityName,
}: NotInCommunitySheetProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleJoinCommunity = () => {
    onOpenChange(false);
    navigate(`/c/${communityName}`);
  };

  const Content = () => (
    <div className="space-y-6 py-6">
      <div className="flex justify-center mb-2">
        <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
          <span className="text-4xl" role="img" aria-label="lion">🦁</span>
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">You're not a member of this community</h3>
        <p className="text-sm text-muted-foreground">
          To interact with posts in <span className="font-medium text-foreground">{communityName}</span>, 
          you need to join the community first.
        </p>
      </div>
      
      <div className="px-4 py-3 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="text-sm">
            <p>Each community requires membership to interact with its content. 
            Joining is easy and unlocks the ability to roar, comment, and mirror posts.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return isMobile ? (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="border-b pb-4 relative flex-shrink-0">
          <DrawerTitle>Community Membership Required</DrawerTitle>
          <DrawerDescription>
            You need to join this community to interact
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <Content />
        </div>
        <DrawerFooter className="pt-2 pb-6 flex-shrink-0">
          <Button onClick={handleJoinCommunity} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium">
            Visit {communityName} Community
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ) : (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Community Membership Required</SheetTitle>
          <SheetDescription>
            You need to join this community to interact
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Content />
        </div>
        <div className="pt-4 pb-6">
          <Button onClick={handleJoinCommunity} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium">
            Visit {communityName} Community
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}; 