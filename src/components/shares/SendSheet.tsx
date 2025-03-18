
import React, { useState } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ArrowRight } from 'lucide-react';

interface SendSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community?: any;
  isEthSend?: boolean;
  isEmbedded?: boolean;
}

export const SendSheet = ({
  open,
  onOpenChange,
  community,
  isEthSend = false,
  isEmbedded = false
}: SendSheetProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const formSchema = z.object({
    recipient: z.string().min(1, 'Recipient address is required'),
    amount: z.coerce.number().min(0.000001, 'Amount must be greater than 0'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: '',
      amount: isEthSend ? 0.1 : 10,
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setPreviewOpen(true);
  };

  const handleConfirmTransaction = () => {
    setPreviewOpen(false);
    setShowSuccess(true);

    // Show success animation for 2 seconds then close
    setTimeout(() => {
      setShowSuccess(false);
      
      // Always close the modal after success, regardless of embedded status
      onOpenChange(false);
      
      // Reset form
      form.reset();
      
      // Show toast
      toast({
        title: "Transaction successful!",
        description: isEthSend 
          ? `You've sent ${form.getValues('amount')} ETH` 
          : `You've sent ${form.getValues('amount')} shares of ${community?.name}`,
      });
    }, 2000);
  };

  const renderSendForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="recipient"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient Address</FormLabel>
              <FormControl>
                <Input 
                  placeholder="0x..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEthSend ? 'Amount (ETH)' : 'Amount (Shares)'}
              </FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step={isEthSend ? "0.000001" : "1"} 
                  min={isEthSend ? "0.000001" : "1"}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between items-center pt-4">
          <div>
            <div className="text-sm font-medium">
              {isEthSend ? 'Estimated Gas' : 'Fee'}
            </div>
            <div className="text-sm text-muted-foreground">
              0.0003 ETH (~$1.05)
            </div>
          </div>
          <Button type="submit">Review Transfer</Button>
        </div>
      </form>
    </Form>
  );

  const renderPreviewContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center py-2 border-b">
        <span className="text-muted-foreground">Sending</span>
        <span className="font-medium">
          {isEthSend 
            ? `${form.getValues('amount')} ETH` 
            : `${form.getValues('amount')} ${community?.name} Shares`}
        </span>
      </div>
      
      <div className="flex justify-between items-center py-2 border-b">
        <span className="text-muted-foreground">To</span>
        <span className="font-medium">
          {form.getValues('recipient').substring(0, 8)}...
          {form.getValues('recipient').substring(
            Math.max(0, form.getValues('recipient').length - 6)
          )}
        </span>
      </div>
      
      <div className="flex justify-between items-center py-2 border-b">
        <span className="text-muted-foreground">Network Fee</span>
        <span className="font-medium">0.0003 ETH</span>
      </div>
      
      <div className="flex justify-between items-center py-2 font-medium">
        <span>Total</span>
        <span>
          {isEthSend 
            ? `${(parseFloat(form.getValues('amount').toString()) + 0.0003).toFixed(6)} ETH` 
            : `${form.getValues('amount')} Shares + 0.0003 ETH`}
        </span>
      </div>
    </div>
  );

  // If embedded in a parent component, just return the form content
  if (isEmbedded) {
    return (
      <>
        {!previewOpen ? renderSendForm() : (
          <div className="space-y-6">
            {renderPreviewContent()}
            
            <div className="mt-8 space-y-4">
              <Button 
                className="w-full py-3"
                variant="default"
                onClick={handleConfirmTransaction}
              >
                Confirm Transfer
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => setPreviewOpen(false)}
              >
                Back
              </Button>
            </div>
          </div>
        )}
        
        {/* Success overlay */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 animate-fade-in">
            <div className="text-center space-y-4 animate-scale-in">
              <div className="mx-auto rounded-full bg-green-500/20 p-6 w-24 h-24 flex items-center justify-center">
                <Check className="h-12 w-12 text-green-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold">Success!</h2>
              <p className="text-muted-foreground">
                {isEthSend 
                  ? `You've sent ${form.getValues('amount')} ETH` 
                  : `You've sent ${form.getValues('amount')} shares of ${community?.name}`}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // For mobile, use Drawer components
  if (isMobile) {
    return (
      <>
        <Drawer open={open && !showSuccess} onOpenChange={(open) => {
          if (!open) {
            setPreviewOpen(false);
          }
          onOpenChange(open);
        }}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>
                {previewOpen ? 'Confirm Transfer' : (isEthSend ? 'Send ETH' : `Send ${community?.name} Shares`)}
              </DrawerTitle>
              <DrawerDescription>
                {previewOpen ? 'Review the details before confirming' : 
                  (isEthSend 
                    ? 'Send ETH to another wallet address' 
                    : `Send your ${community?.name} shares to another user`)}
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="py-4 px-4 overflow-y-auto">
              {!previewOpen ? renderSendForm() : (
                <>
                  {renderPreviewContent()}
                  
                  <div className="w-full bg-muted rounded-full p-1 relative mt-8">
                    <div className="flex items-center">
                      <Button 
                        className="w-full py-6 rounded-full relative group cursor-grab active:cursor-grabbing"
                        variant="default"
                        onClick={handleConfirmTransaction}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                          <div className="flex items-center">
                            <span>Slide to confirm</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center">
                            <span>Click to confirm</span>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={() => setPreviewOpen(false)}>
                      Back
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DrawerContent>
        </Drawer>
        
        {/* Success overlay */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 animate-fade-in">
            <div className="text-center space-y-4 animate-scale-in">
              <div className="mx-auto rounded-full bg-green-500/20 p-6 w-24 h-24 flex items-center justify-center">
                <Check className="h-12 w-12 text-green-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold">Success!</h2>
              <p className="text-muted-foreground">
                {isEthSend 
                  ? `You've sent ${form.getValues('amount')} ETH` 
                  : `You've sent ${form.getValues('amount')} shares of ${community?.name}`}
              </p>
            </div>
          </div>
        )}
      </>
    );
  } else {
    // Desktop view with Sheet - keep everything in the same sheet
    return (
      <>
        <Sheet open={open && !showSuccess} onOpenChange={(open) => {
          if (!open) {
            setPreviewOpen(false);
          }
          onOpenChange(open);
        }}>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {previewOpen ? 'Confirm Transfer' : (isEthSend ? 'Send ETH' : `Send ${community?.name} Shares`)}
              </SheetTitle>
              <SheetDescription>
                {previewOpen ? 'Review the details before confirming' : 
                  (isEthSend 
                    ? 'Send ETH to another wallet address' 
                    : `Send your ${community?.name} shares to another user`)}
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-4 overflow-y-auto">
              {!previewOpen ? renderSendForm() : (
                <>
                  {renderPreviewContent()}
                  
                  <div className="mt-8 space-y-4">
                    <Button 
                      className="w-full py-3"
                      variant="default"
                      onClick={handleConfirmTransaction}
                    >
                      Confirm Transfer
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      onClick={() => setPreviewOpen(false)}
                    >
                      Back
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Success overlay */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 animate-fade-in">
            <div className="text-center space-y-4 animate-scale-in">
              <div className="mx-auto rounded-full bg-green-500/20 p-6 w-24 h-24 flex items-center justify-center">
                <Check className="h-12 w-12 text-green-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold">Success!</h2>
              <p className="text-muted-foreground">
                {isEthSend 
                  ? `You've sent ${form.getValues('amount')} ETH` 
                  : `You've sent ${form.getValues('amount')} shares of ${community?.name}`}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }
};
