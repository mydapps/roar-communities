import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, AlertTriangle } from 'lucide-react';
import { fetchFlagTypes, FlagType } from '@/utils/postApi'; // Reuse from postApi
import { hidePostAndWarn } from '@/utils/communityApi';
import { toast } from 'sonner';

interface HideWarnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postCode: string;
  communityName: string;
  onSuccess: () => void; // Callback on successful hide/warn
}

export function HideWarnModal({
  open,
  onOpenChange,
  postCode,
  communityName,
  onSuccess,
}: HideWarnModalProps) {
  const isMobile = useIsMobile();
  const [flagTypes, setFlagTypes] = useState<FlagType[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [warningDetails, setWarningDetails] = useState("");
  const [isLoadingReasons, setIsLoadingReasons] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch flag types when modal opens
  useEffect(() => {
    if (open) {
      const loadReasons = async () => {
        setIsLoadingReasons(true);
        setError(null);
        try {
          const response = await fetchFlagTypes();
          if (response.success && response.flagTypes) {
            setFlagTypes(response.flagTypes);
          } else {
            setError("Failed to load reasons for hiding.");
            toast.error("Failed to load reasons for hiding.");
          }
        } catch (err) {
          setError("An error occurred while loading reasons.");
          toast.error("An error occurred while loading reasons.");
        } finally {
          setIsLoadingReasons(false);
        }
      };
      loadReasons();
      // Reset form state when opening
      setSelectedReasonId("");
      setWarningDetails("");
      setIsSubmitting(false); 
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedReasonId) {
      toast.error("Please select a reason for hiding the post.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const reasonId = parseInt(selectedReasonId, 10);
      const result = await hidePostAndWarn(communityName, postCode, reasonId, warningDetails);

      if (result.success) {
        toast.success(result.message || "Post hidden and warning issued successfully.");
        onOpenChange(false); // Close modal
        onSuccess(); // Trigger success callback (for animation/state update)
      } else {
        setError(result.message || "Failed to hide post.");
        toast.error(result.message || "Failed to hide post.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      <DialogHeader className={isMobile ? 'text-left' : ''}>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Hide Post & Warn User
        </DialogTitle>
        <DialogDescription className="pt-2 pb-4">
          Select a reason for hiding this post. You can optionally add details for the warning sent to the user.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {isLoadingReasons ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">Loading reasons...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center">{error}</p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="reason-select">Reason *</Label>
            <Select 
              value={selectedReasonId}
              onValueChange={setSelectedReasonId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="reason-select">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {flagTypes.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id.toString()}>
                    {reason.name} - <span className="text-xs text-muted-foreground">{reason.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="warning-details">Warning Details (Optional)</Label>
          <Textarea
            id="warning-details"
            placeholder="Add any specific details for the user warning..."
            value={warningDetails}
            onChange={(e) => setWarningDetails(e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>
      </div>

      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
        </DialogClose>
        <Button
          variant="destructive"
          onClick={handleSubmit}
          disabled={isSubmitting || isLoadingReasons || !selectedReasonId}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {isSubmitting ? 'Submitting...' : 'Hide Post & Warn'}
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
      <DialogContent className="sm:max-w-md">
        {content}
      </DialogContent>
    </Dialog>
  );
} 