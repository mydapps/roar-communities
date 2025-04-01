
import React, { useState, useEffect } from 'react';
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
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerTrigger 
} from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ArrowRight, Loader2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { 
  buySharesPrecheck, 
  buySharesConfirm,
  sellSharesPrecheck,
  sellSharesConfirm,
  getWalletBalance,
  getSharePrice,
  SharePrecheckResponse,
  SharePriceResponse
} from '@/utils/communityApi';
import { Link } from 'react-router-dom';

interface TradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community?: any;
  action: 'buy' | 'sell' | null;
  userEthBalance?: string;
  isEmbedded?: boolean;
}

export const TradeSheet = ({
  open,
  onOpenChange,
  community,
  action,
  userEthBalance = "0.000",
  isEmbedded = false
}: TradeSheetProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingPrecheck, setIsLoadingPrecheck] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [precheckData, setPrecheckData] = useState<SharePrecheckResponse | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>(userEthBalance);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [sharePriceInfo, setSharePriceInfo] = useState<SharePriceResponse | null>(null);
  const [isLoadingSharePrice, setIsLoadingSharePrice] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const formSchema = z.object({
    amount: z.coerce
      .number()
      .min(0.001, 'Amount must be at least 0.001 shares')
      .refine(val => {
        // Check that number has at most 3 decimal places
        const decimalStr = val.toString().split('.')[1] || '';
        return decimalStr.length <= 3;
      }, {
        message: 'Maximum 3 decimal places allowed'
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1,
    }
  });

  const watchAmount = form.watch('amount');

  useEffect(() => {
    if (open) {
      fetchWalletBalance();
      if (community?.name) {
        fetchSharePrice(1);
      }
    }
  }, [open, community]);

  useEffect(() => {
    if (open && community?.name && watchAmount) {
      const debounceTimeout = setTimeout(() => {
        fetchSharePrice(watchAmount);
      }, 500);
      
      return () => clearTimeout(debounceTimeout);
    }
  }, [watchAmount, open, community]);

  const fetchWalletBalance = async () => {
    if (!open) return;
    
    setIsLoadingBalance(true);
    try {
      const balanceData = await getWalletBalance();
      setWalletBalance(balanceData.balance.eth);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      // Fall back to the provided value
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchSharePrice = async (quantity: number) => {
    if (!community?.name || !open) return;
    
    setIsLoadingSharePrice(true);
    try {
      const priceData = await getSharePrice(community.name, quantity);
      setSharePriceInfo(priceData);
    } catch (error) {
      console.error('Failed to fetch share price:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch current share price"
      });
    } finally {
      setIsLoadingSharePrice(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!community?.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Community information is missing"
      });
      return;
    }

    setIsLoadingPrecheck(true);
    setInsufficientFunds(false);
    try {
      let precheckResult;
      
      if (action === 'buy') {
        precheckResult = await buySharesPrecheck(community.name, values.amount);
      } else {
        precheckResult = await sellSharesPrecheck(community.name, values.amount);
      }
      
      if (precheckResult.status === 'DEPOSIT') {
        setInsufficientFunds(true);
        toast({
          variant: "destructive",
          title: "Insufficient ETH balance",
          description: "You don't have enough ETH to complete this transaction."
        });
        return;
      }
      
      setPrecheckData(precheckResult);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Transaction precheck failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Transaction precheck failed. Please try again.'
      });
    } finally {
      setIsLoadingPrecheck(false);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!community?.name || !precheckData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing transaction data"
      });
      return;
    }
    
    setIsConfirming(true);
    try {
      let result;
      
      if (action === 'buy') {
        result = await buySharesConfirm(community.name, precheckData.shareQuantity);
      } else {
        result = await sellSharesConfirm(community.name, precheckData.shareQuantity);
      }
      
      setPreviewOpen(false);
      setShowSuccess(true);
      
      // Show success animation for 2 seconds then close
      setTimeout(() => {
        setShowSuccess(false);
        
        // Always close the modal after success, regardless of embedded status
        onOpenChange(false);
        
        // Reset form
        form.reset({ amount: 1 });
        
        // Show toast
        toast({
          title: "Transaction successful!",
          description: action === 'buy' 
            ? `You've purchased ${precheckData.shareQuantity} shares of ${community?.name}` 
            : `You've sold ${precheckData.shareQuantity} shares of ${community?.name}`,
        });
      }, 2000);
    } catch (error) {
      console.error('Transaction confirmation failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Transaction failed. Please try again.'
      });
    } finally {
      setIsConfirming(false);
    }
  };

  if (!community || !action) return null;

  const renderTradeForm = () => (
    <>
      {action === 'buy' && (
        <div className="mb-4 p-3 rounded-md bg-muted/50">
          <div className="text-sm text-muted-foreground">Your ETH Balance</div>
          <div className="font-medium text-lg flex items-center gap-2">
            {isLoadingBalance ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {walletBalance} ETH
                <button 
                  onClick={fetchWalletBalance}
                  className="p-1 rounded-full hover:bg-muted/80 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {insufficientFunds && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">Insufficient ETH Balance</h4>
              <p className="text-sm">You need to deposit more ETH to complete this transaction.</p>
              <Link to="/my-shares" className="text-sm font-medium flex items-center gap-1 mt-2 hover:underline">
                Go to My Shares to deposit
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {sharePriceInfo && (
        <div className="mb-4 p-3 rounded-md bg-muted/30 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Current Price</div>
          <div className="font-medium">
            {action === 'buy' ? sharePriceInfo.currentBuyPrice : sharePriceInfo.currentSellPrice} ETH per share
          </div>
          
          {watchAmount > 1 && (
            <div className="mt-2 text-sm">
              <div className="text-muted-foreground mb-1">Total for {watchAmount} shares</div>
              <div className="font-medium">
                {action === 'buy' 
                  ? `${sharePriceInfo.buyTotalRequired} ETH` 
                  : `${sharePriceInfo.sellTotalReturn} ETH`}
              </div>
            </div>
          )}
        </div>
      )}
      
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
                    min="0.001" 
                    step="0.001"
                    {...field} 
                    placeholder="Enter amount (max 3 decimals)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoadingPrecheck || insufficientFunds}
          >
            {isLoadingPrecheck ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Review Transaction'
            )}
          </Button>
        </form>
      </Form>
    </>
  );

  const renderPreviewContent = () => {
    if (!precheckData) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Action</span>
          <span className="font-medium">
            {action === 'buy' ? 'Buy' : 'Sell'} {precheckData.shareQuantity} Shares
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Community</span>
          <span className="font-medium">{precheckData.communityName}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Price per Share</span>
          <span className="font-medium">
            {precheckData.sharePrice.toFixed(6)} ETH 
            <span className="text-xs text-muted-foreground ml-1">
              (${precheckData.sharePriceUsd.toFixed(2)})
            </span>
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Total Price</span>
          <span className="font-medium">
            {precheckData.totalSharePrice.toFixed(6)} ETH
            <span className="text-xs text-muted-foreground ml-1">
              (${precheckData.totalSharePriceUsd.toFixed(2)})
            </span>
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Network Fee</span>
          <span className="font-medium">{precheckData.fee}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 font-medium">
          <span>Total {action === 'buy' ? 'Cost' : 'Received'}</span>
          <span>{precheckData.totalValue}</span>
        </div>
      </div>
    );
  };

  // For embedded in drawer version
  if (isEmbedded) {
    return (
      <>
        {!previewOpen ? renderTradeForm() : (
          <div className="space-y-6">
            {renderPreviewContent()}
            
            <div className="mt-8 space-y-4">
              <Button 
                className="w-full py-3"
                variant="default"
                onClick={handleConfirmTransaction}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Transaction'
                )}
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => setPreviewOpen(false)}
                disabled={isConfirming}
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
                {action === 'buy' 
                  ? `You've purchased ${precheckData?.shareQuantity} shares of ${community?.name}` 
                  : `You've sold ${precheckData?.shareQuantity} shares of ${community?.name}`}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // For mobile
  if (isMobile && !isEmbedded) {
    return (
      <>
        <Drawer open={open && !showSuccess} onOpenChange={(openValue) => {
          if (!openValue) {
            setPreviewOpen(false);
          }
          onOpenChange(openValue);
        }}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>
                {previewOpen ? 'Confirm Transaction' : (action === 'buy' ? 'Buy Shares' : 'Sell Shares')}
              </DrawerTitle>
              <DrawerDescription>
                {previewOpen ? 'Review the details before confirming' : 
                  (action === 'buy' 
                    ? `Purchase shares of ${community?.name}` 
                    : `Sell your ${community?.name} shares`)}
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 py-4 overflow-y-auto">
              {!previewOpen ? renderTradeForm() : (
                <>
                  {renderPreviewContent()}
                  
                  <div className="w-full bg-muted rounded-full p-1 relative mt-8">
                    <div className="flex items-center">
                      <Button 
                        className="w-full py-6 rounded-full relative group cursor-grab active:cursor-grabbing"
                        variant="default"
                        onClick={handleConfirmTransaction}
                        disabled={isConfirming}
                      >
                        {isConfirming ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setPreviewOpen(false)}
                      disabled={isConfirming}
                    >
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
                {action === 'buy' 
                  ? `You've purchased ${precheckData?.shareQuantity} shares of ${community?.name}` 
                  : `You've sold ${precheckData?.shareQuantity} shares of ${community?.name}`}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // For desktop - improved to ensure everything stays in the same sheet
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
              {previewOpen ? 'Confirm Transaction' : (action === 'buy' ? 'Buy Shares' : 'Sell Shares')}
            </SheetTitle>
            <SheetDescription>
              {previewOpen ? 'Review the details before confirming' : 
                (action === 'buy' 
                  ? `Purchase shares of ${community?.name}` 
                  : `Sell your ${community?.name} shares`)}
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4 overflow-y-auto">
            {!previewOpen ? renderTradeForm() : (
              <>
                {renderPreviewContent()}
                
                <div className="mt-8 space-y-4">
                  <Button 
                    className="w-full py-3"
                    variant="default"
                    onClick={handleConfirmTransaction}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Transaction'
                    )}
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    onClick={() => setPreviewOpen(false)}
                    disabled={isConfirming}
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
              {action === 'buy' 
                ? `You've purchased ${precheckData?.shareQuantity} shares of ${community?.name}` 
                : `You've sold ${precheckData?.shareQuantity} shares of ${community?.name}`}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
