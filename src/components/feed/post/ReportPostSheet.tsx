import React, { useState, useEffect, useCallback } from 'react';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchFlagTypes, flagPost, FlagType, FlagPostPayload } from '@/utils/postApi';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportPostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postCode: string;
  onReportSuccess: () => void; // Callback on successful report
}

export function ReportPostSheet({
  open,
  onOpenChange,
  postCode,
  onReportSuccess,
}: ReportPostSheetProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [flagTypes, setFlagTypes] = useState<FlagType[]>([]);
  const [selectedFlagTypeId, setSelectedFlagTypeId] = useState<string | null>(null); // RadioGroup value is string
  const [notes, setNotes] = useState('');
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFlagTypes = useCallback(async () => {
    setIsLoadingTypes(true);
    setError(null);
    const response = await fetchFlagTypes();
    if (response.success) {
      setFlagTypes(response.flagTypes);
    } else {
      setError('Failed to load report reasons. Please try again.');
      toast({ title: "Error", description: "Could not load report reasons.", variant: "destructive" });
    }
    setIsLoadingTypes(false);
  }, [toast]);

  useEffect(() => {
    if (open) {
      // Reset state when opening
      setSelectedFlagTypeId(null);
      setNotes('');
      setError(null);
      // Load types if not already loaded
      if (flagTypes.length === 0) {
        loadFlagTypes();
      }
    }
  }, [open, flagTypes.length, loadFlagTypes]);

  const handleSubmit = async () => {
    if (!selectedFlagTypeId) {
      toast({ title: "Selection Required", description: "Please select a reason for reporting.", variant: "destructive" });
      return;
    }
    if (!postCode) {
      toast({ title: "Error", description: "Missing post identifier.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: FlagPostPayload = {
      postCode: postCode,
      flagTypeId: parseInt(selectedFlagTypeId, 10), // Convert string ID back to number
      notes: notes.trim() || undefined, // Send notes only if not empty
    };

    const response = await flagPost(payload);

    if (response.success) {
      toast({ title: "Report Submitted", description: response.message || "Post successfully flagged." });
      onReportSuccess(); // Call the success callback
      onOpenChange(false); // Close the sheet/modal
    } else {
      setError(response.message || 'Failed to submit report.');
      toast({ title: "Report Failed", description: response.message || "Could not submit report.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const content = (
    <>
      <DialogHeader className={isMobile ? 'text-left' : ''}>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Report Post
        </DialogTitle>
        <DialogDescription>
          Choose a reason for reporting this post. Your report is confidential.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        {isLoadingTypes ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
           <p className="text-sm text-destructive text-center">{error}</p>
        ) : (
          <>
            <RadioGroup
              value={selectedFlagTypeId ?? undefined}
              onValueChange={setSelectedFlagTypeId}
              className="space-y-2"
            >
              {flagTypes.map((type) => (
                <div key={type.id} className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                   <RadioGroupItem value={String(type.id)} id={`flag-${type.id}`} />
                   <Label htmlFor={`flag-${type.id}`} className="font-normal flex flex-col flex-grow cursor-pointer">
                     <span>{type.name}</span>
                     <span className="text-xs text-muted-foreground">{type.description}</span>
                   </Label>
                 </div>
              ))}
            </RadioGroup>
            <Textarea
              placeholder="Optional: Add more details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </>
        )}
      </div>

      <DialogFooter className={isMobile ? 'pt-2' : ''}>
        <DrawerClose asChild>
          <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
        </DrawerClose>
        <Button
          variant="destructive"
          onClick={handleSubmit}
          disabled={isLoadingTypes || isSubmitting || !selectedFlagTypeId}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
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
      <DialogContent className="sm:max-w-md"> {/* Use sm:max-w-md for slightly wider */}
        {content}
      </DialogContent>
    </Dialog>
  );
} 