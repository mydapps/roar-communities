import React from 'react';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

interface ConversationModalsProps {
  isBlockModalOpen: boolean;
  otherUserHandle: string;
  isBlocking: boolean;
  onSetBlockModalOpen: (open: boolean) => void;
  onBlockUser: () => void;
}

const ConversationModals: React.FC<ConversationModalsProps> = ({
  isBlockModalOpen,
  otherUserHandle,
  isBlocking,
  onSetBlockModalOpen,
  onBlockUser,
}) => {
  return (
    <Dialog open={isBlockModalOpen} onOpenChange={onSetBlockModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-500" />
            Block User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to block <span className="font-semibold">@{otherUserHandle}</span>?
            <br /><br />
            Once blocked, you will no longer be able to message each other.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onSetBlockModalOpen(false)}
            disabled={isBlocking}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onBlockUser}
            disabled={isBlocking}
          >
            {isBlocking ? 'Blocking...' : 'Block User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationModals; 