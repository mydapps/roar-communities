import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, PinIcon, PinOffIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PinPostConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  postCode: string | undefined;
  isCurrentlyPinned: boolean;
  communityName?: string; // Optional: for more context in the modal
  onConfirmPinUnpin: (action: 'pin' | 'unpin') => Promise<void>; // Renamed for clarity
  onSuccess: () => void; // Callback after successful pin/unpin
}

export const PinPostConfirmationModal: React.FC<PinPostConfirmationModalProps> = ({
  isOpen,
  onOpenChange,
  postCode,
  isCurrentlyPinned,
  communityName,
  onConfirmPinUnpin, // This function will now be passed from Post.tsx and Post.tsx will handle API call and state update
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionText = isCurrentlyPinned ? 'unpin' : 'pin';
  const titleText = isCurrentlyPinned ? 'Unpin Post' : 'Pin Post';
  const descriptionText = isCurrentlyPinned
    ? `Are you sure you want to unpin this post${communityName ? ` from ${communityName}` : ''}? It will no longer be highlighted at the top of the feed.`
    : `Are you sure you want to pin this post${communityName ? ` to ${communityName}` : ''}? It will be highlighted at the top of the feed.`;

  useEffect(() => {
    if (isOpen) {
      setError(null); // Reset error when modal opens
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!postCode) {
      setError('Post identifier is missing. Cannot proceed.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // The actual API call is now expected to be handled by the onConfirmPinUnpin prop
      // which is managed in the parent component (Post.tsx)
      await onConfirmPinUnpin(actionText);
      // onSuccess callback will be called by parent if API call was successful there
      // toast.success(`Post successfully ${actionText}ned.`); // Toast handled by parent
      // onOpenChange(false); // Closing handled by parent or via onSuccess
    } catch (e: any) {
      const errorMessage = e.message || `Failed to ${actionText} post.`;
      setError(errorMessage);
      // toast.error(errorMessage); // Toast handled by parent
    } finally {
      setIsLoading(false);
      // Do not close modal on error, let user see the message
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading) onOpenChange(open); // Prevent closing while loading
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isCurrentlyPinned ? <PinOffIcon className="mr-2 h-5 w-5 text-destructive" /> : <PinIcon className="mr-2 h-5 w-5 text-primary" />}
            {titleText}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {descriptionText}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2 mb-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isLoading} variant={isCurrentlyPinned ? 'destructive' : 'default'}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isCurrentlyPinned ? (
              <PinOffIcon className="mr-2 h-4 w-4" />
            ) : (
              <PinIcon className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Processing...' : titleText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 