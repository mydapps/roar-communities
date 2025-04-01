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
import { Check, ArrowRight, Loader2, RefreshCw, AlertCircle, ExternalLink, PartyPopper, BadgeInfo } from 'lucide-react';
import { 
  buySharesPrecheck, 
  buySharesConfirm,
  sellSharesPrecheck,
  sellSharesConfirm,
  getWalletBalance,
  getSharePrice,
  getShareValue,
  SharePrecheckResponse,
  SharePriceResponse,
  ShareValueResponse
} from '@/utils/communityApi';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

const ethToUsd = 3521.89; // Mock ETH/USD exchange rate

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
  const [noSharesError, setNoSharesError] = useState(false);
  const [shareValue, setShareValue] = useState<ShareValueResponse | null>(null);
  const [isLoadingShareValue, setIsLoadingShareValue] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const formSchema = z.object({
    amount: z.coerce
      .number()
      .min(0.001, 'Amount must be at least 0.001 shares')
      .refine(val => {
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
        fetchSharePrice(form.getValues().amount || 1);
        if (action === 'sell') {
          fetchShareValue();
        }
      }
      setInsufficientFunds(false);
      setNoSharesError(false);
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
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchSharePrice = async (quantity: number) => {
    if (!community?.name || !open) return;
    
    setIsLoadingSharePrice(true);
    try {
      console.log(`Fetching share price for ${community.name}, quantity: ${quantity}`);
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

  const fetchShareValue = async () => {
    if (!community?.name || !open) return;
    
    setIsLoadingShareValue(true);
    try {
      console.log(`Fetching share value for ${community.name}`);
      const valueData = await getShareValue(community.name);
      setShareValue(valueData);
    } catch (error) {
      console.error('Failed to fetch share value:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch share value"
      });
    } finally {
      setIsLoadingShareValue(false);
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
    setNoSharesError(false);
    
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
      
      if (typeof precheckResult.sharePrice === 'string') {
        precheckResult.sharePrice = parseFloat(precheckResult.sharePrice);
      }
      
      if (typeof precheckResult.sharePriceUsd === 'string') {
        precheckResult.sharePriceUsd = parseFloat(precheckResult.sharePriceUsd);
      }
      
      if (precheckResult.totalSharePrice !== undefined && typeof precheckResult.totalSharePrice === 'string') {
        precheckResult.totalSharePrice = parseFloat(precheckResult.totalSharePrice);
      }
      
      if (precheckResult.totalSharePriceUsd !== undefined && typeof precheckResult.totalSharePriceUsd === 'string') {
        precheckResult.totalSharePriceUsd = parseFloat(precheckResult.totalSharePriceUsd);
      }
      
      setPrecheckData(precheckResult);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Transaction precheck failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Transaction precheck failed. Please try again.';
      if (errorMessage.includes('do not have any shares') || errorMessage.toLowerCase().includes('no shares')) {
        setNoSharesError(true);
        toast({
          variant: "destructive",
          title: "No Shares",
          description: "You don't have any shares in this community to sell."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
      }
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
      
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        form.reset({ amount: 1 });
        
        toast({
          title: "Transaction successful!",
          description: action === 'buy' 
            ? `You've purchased ${precheckData.shareQuantity} shares of ${community?.name}` 
            : `You've sold ${precheckData.shareQuantity} shares of ${community?.name}`,
        });
      }, 3000);
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

  const handleSellAll = () => {
    if (shareValue?.data?.shares) {
      form.setValue('amount', shareValue.data.shares);
    } else if (community?.userShares) {
      form.setValue('amount', community.userShares);
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
      
      {action === 'sell' && (
        <div className="mb-4 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Your Shares</div>
              <div className="font-medium text-lg flex items-center gap-2">
                {isLoadingShareValue ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>{shareValue?.data?.shares || community?.userShares || 0} shares</>
                )}
              </div>
            </div>
            {(shareValue?.data?.shares > 0 || community?.userShares > 0) && (
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                onClick={handleSellAll}
              >
                Sell All
              </Button>
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
      
      {noSharesError && action === 'sell' && (
        <div className="mb-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">No Shares to Sell</h4>
              <p className="text-sm">You don't have any shares in this community to sell.</p>
            </div>
          </div>
        </div>
      )}
      
      {sharePriceInfo && watchAmount > 0 && (
        <div className="mb-4 p-3 rounded-md bg-muted/30 border border-border">
          <div className="font-medium">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {watchAmount === 1 ? 'Price per share' : `Total for ${watchAmount} shares`}
              </div>
              <div className="text-lg font-semibold">
                {action === 'buy' 
                  ? (watchAmount === 1 
                      ? sharePriceInfo.currentBuyPrice
                      : sharePriceInfo.buyTotalRequired)
                  : (watchAmount === 1
                      ? sharePriceInfo.currentSellPrice
                      : sharePriceInfo.sellTotalReturn)
                } ETH
                <span className="text-xs ml-2 text-muted-foreground">
                  (~${action === 'buy' 
                    ? ((parseFloat(watchAmount === 1 
                        ? sharePriceInfo.currentBuyPrice 
                        : sharePriceInfo.buyTotalRequired) * ethToUsd) || 0).toFixed(2)
                    : ((parseFloat(watchAmount === 1
                        ? sharePriceInfo.currentSellPrice
                        : sharePriceInfo.sellTotalReturn) * ethToUsd) || 0).toFixed(2)})
                </span>
              </div>
            </div>
          </div>
          
          {action === 'sell' && (sharePriceInfo?.sellPriceImpact || shareValue?.data?.shares) && (
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      <BadgeInfo className="h-3 w-3 mr-1" />
                      Impact on price
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72">
                    <p>Selling shares will decrease the price. Larger sell orders have a bigger impact.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {sharePriceInfo.sellPriceImpact && parseFloat(sharePriceInfo.sellPriceImpact) > 0 && (
                <Badge variant="outline" className="ml-2 text-xs bg-red-500/10 text-red-600 border-red-200">
                  -{sharePriceInfo.sellPriceImpact}%
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
      
      {action === 'sell' && shareValue?.data && (
        <div className="mb-4 p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <div className="flex flex-col">
            <div className="text-sm text-muted-foreground">Current Share Value</div>
            <div className="font-medium text-lg flex items-center gap-2">
              {shareValue.data.value.sell.eth.toFixed(8)} ETH
              <span className="text-sm text-muted-foreground">
                (${shareValue.data.value.sell.usd.toFixed(2)})
              </span>
            </div>
          </div>
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
                {action === 'sell' && (shareValue?.data?.shares > 0 || community?.userShares > 0) && (
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-blue-600 cursor-pointer"
                         onClick={handleSellAll}>
                      Sell all my shares ({shareValue?.data?.shares || community?.userShares})
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {watchAmount && (shareValue?.data?.shares || community?.userShares)
                        ? `${((watchAmount / (shareValue?.data?.shares || community?.userShares)) * 100).toFixed(0)}% of your shares`
                        : ''}
                    </div>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoadingPrecheck || insufficientFunds || (action === 'sell' && noSharesError)}
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
            {typeof precheckData.sharePrice === 'number' 
              ? precheckData.sharePrice.toFixed(6) 
              : parseFloat(String(precheckData.sharePrice || '0')).toFixed(6)} ETH 
            <span className="text-xs text-muted-foreground ml-1">
              (${typeof precheckData.sharePriceUsd === 'number' 
                  ? precheckData.sharePriceUsd.toFixed(2) 
                  : parseFloat(String(precheckData.sharePriceUsd || '0')).toFixed(2)})
            </span>
          </span>
        </div>
        
        {action === 'buy' && precheckData.totalSharePrice !== undefined && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Total Price</span>
            <span className="font-medium">
              {typeof precheckData.totalSharePrice === 'number' 
                ? precheckData.totalSharePrice.toFixed(6) 
                : parseFloat(String(precheckData.totalSharePrice || '0')).toFixed(6)} ETH
              {precheckData.totalSharePriceUsd && (
                <span className="text-xs text-muted-foreground ml-1">
                  (${typeof precheckData.totalSharePriceUsd === 'number' 
                      ? precheckData.totalSharePriceUsd.toFixed(2) 
                      : parseFloat(String(precheckData.totalSharePriceUsd || '0')).toFixed(2)})
                </span>
              )}
            </span>
          </div>
        )}
        
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

  const renderSuccessContent = () => (
    <div className="text-center space-y-4 animate-scale-in">
      <div className="relative">
        <div className="mx-auto rounded-full bg-green-500/20 p-8 w-32 h-32 flex items-center justify-center">
          <PartyPopper className="h-16 w-16 text-green-500 animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2">
          <div className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-green-400 opacity-75"></div>
          <div className="relative inline-flex rounded-full h-6 w-6 bg-green-500"></div>
        </div>
        <div className="absolute -bottom-2 -left-2">
          <div className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></div>
          <div className="relative inline-flex rounded-full h-6 w-6 bg-blue-500"></div>
        </div>
      </div>
      <div className="animate-bounce mt-4">
        <h2 className="text-3xl font-bold">Success!</h2>
      </div>
      <div className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
        <p className="text-2xl font-semibold">
          {action === 'buy' 
            ? `You've purchased ${precheckData?.shareQuantity} shares of ${community?.name}!` 
            : `You've sold ${precheckData?.shareQuantity} shares of ${community?.name}!`}
        </p>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Transaction completed successfully
      </div>
    </div>
  );

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
        
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 animate-fade-in">
            {renderSuccessContent()}
          </div>
        )}
      </>
    );
  }

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
        
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 animate-fade-in">
            {renderSuccessContent()}
          </div>
        )}
      </>
    );
  }

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
      
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 animate-fade-in">
          {renderSuccessContent()}
        </div>
      )}
    </>
  );
};
