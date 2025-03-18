
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ArrowRight } from 'lucide-react';

interface TradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community?: any;
  action: 'buy' | 'sell' | null;
}

export const TradeSheet = ({
  open,
  onOpenChange,
  community,
  action
}: TradeSheetProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const formSchema = z.object({
    amount: z.coerce.number().min(1, 'Amount must be at least 1 share'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 10,
    }
  });

  // Calculate preview values
  const sharePrice = community?.currentPrice || 0;
  const amount = form.watch('amount');
  const totalEth = (amount * sharePrice).toFixed(6);
  const fee = (0.0003).toFixed(6);
  const total = action === 'buy' 
    ? (parseFloat(totalEth) + parseFloat(fee)).toFixed(6)
    : (parseFloat(totalEth) - parseFloat(fee)).toFixed(6);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setPreviewOpen(true);
  };

  const handleConfirmTransaction = () => {
    setPreviewOpen(false);
    setShowSuccess(true);

    // Show success animation for 2 seconds then close
    setTimeout(() => {
      setShowSuccess(false);
      onOpenChange(false);
      
      // Reset form
      form.reset();
      
      // Show toast
      toast({
        title: "Transaction successful!",
        description: action === 'buy' 
          ? `You've purchased ${form.getValues('amount')} shares of ${community?.name}` 
          : `You've sold ${form.getValues('amount')} shares of ${community?.name}`,
      });
    }, 2000);
  };

  if (!community || !action) return null;

  return (
    <>
      <Sheet open={open && !showSuccess} onOpenChange={(open) => {
        if (!open) {
          setPreviewOpen(false);
        }
        onOpenChange(open);
      }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {action === 'buy' ? 'Buy Shares' : 'Sell Shares'}
            </SheetTitle>
            <SheetDescription>
              {action === 'buy' 
                ? `Purchase shares of ${community?.name}` 
                : `Sell your ${community?.name} shares`}
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <div className="mb-6 space-y-1">
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className="font-medium">{community?.currentPrice.toFixed(6)} ETH per share</div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Shares</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          step="1"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4 bg-muted/30 p-4 rounded-md">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Share Price</span>
                    <span className="text-sm">{community?.currentPrice.toFixed(6)} ETH</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <span className="text-sm">{amount} shares</span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Subtotal</span>
                    <span className="text-sm font-medium">{totalEth} ETH</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Network Fee</span>
                    <span className="text-sm">{fee} ETH</span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">{total} ETH</span>
                  </div>
                </div>
                
                <Button type="submit" className="w-full">Review Transaction</Button>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
      
      <Drawer open={previewOpen} onOpenChange={setPreviewOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Confirm Transaction</DrawerTitle>
            <DrawerDescription>Review the details before confirming</DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 py-4">
            <div className="space-y-6">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Action</span>
                <span className="font-medium">
                  {action === 'buy' ? 'Buy' : 'Sell'} {amount} Shares
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Community</span>
                <span className="font-medium">{community?.name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Price Per Share</span>
                <span className="font-medium">{community?.currentPrice.toFixed(6)} ETH</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium">{fee} ETH</span>
              </div>
              
              <div className="flex justify-between items-center py-2 font-medium">
                <span>Total {action === 'buy' ? 'Cost' : 'Received'}</span>
                <span>{total} ETH</span>
              </div>
              
              <div className="px-4 text-center text-sm text-muted-foreground">
                <p>Swipe to confirm the transaction</p>
              </div>
            </div>
          </div>
          
          <DrawerFooter>
            <div className="w-full bg-muted rounded-full p-1 relative">
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
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
          </DrawerFooter>
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
              {action === 'buy' 
                ? `You've purchased ${form.getValues('amount')} shares of ${community?.name}` 
                : `You've sold ${form.getValues('amount')} shares of ${community?.name}`}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
