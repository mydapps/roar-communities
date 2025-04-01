
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityPortfolioItem, SharePrecheckResponse, buySharesPrecheck, sellSharesPrecheck } from '@/utils/communityApi';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Info, Plus, Minus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: CommunityPortfolioItem | null;
  action: 'buy' | 'sell' | null;
  userEthBalance: string;
  isEmbedded?: boolean;
  onBuyConfirm?: (communityName: string, quantity: number) => Promise<void>;
  onSellConfirm?: (communityName: string, quantity: number) => Promise<void>;
  loadingAction?: boolean;
  precheckData?: SharePrecheckResponse | null;
}

export const TradeSheet = ({ 
  open, 
  onOpenChange, 
  community, 
  action,
  userEthBalance,
  isEmbedded = false,
  onBuyConfirm,
  onSellConfirm,
  loadingAction = false,
  precheckData = null
}: TradeSheetProps) => {
  // Multi-step flow
  const [step, setStep] = useState<'quantity' | 'confirm'>('quantity');
  const [shareQuantity, setShareQuantity] = useState(1);
  const [quantityInputValue, setQuantityInputValue] = useState("1");
  const [maxShares, setMaxShares] = useState(100);
  const [loading, setLoading] = useState(false);
  const [precheck, setPrecheck] = useState<SharePrecheckResponse | null>(precheckData);
  const [totalCost, setTotalCost] = useState("0");
  const [sharePrice, setSharePrice] = useState("0");
  const [totalSharePrice, setTotalSharePrice] = useState("0");
  const [usdValue, setUsdValue] = useState("0");
  const [totalUsdValue, setTotalUsdValue] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Updated preset amounts to match requirements
  const presetAmounts = [0.01, 0.1, 1, 10];
  
  // Use the mobile hook outside of the embedded check
  const isMobile = useIsMobile();

  useEffect(() => {
    if (community && action && open) {
      // Reset to step 1 when opening
      setStep('quantity');
      
      // Initialize with 1 share by default
      setShareQuantity(1);
      setQuantityInputValue("1");
      
      // Set max shares based on action (buy: arbitrary max, sell: owned shares)
      if (action === 'sell') {
        const ownedShares = Math.floor(community.shares * 100) / 100;
        setMaxShares(ownedShares > 0 ? ownedShares : 0.01);
      } else {
        setMaxShares(100); // Default max for buying
      }
      
      // If we already have precheck data from parent, use it
      if (precheckData) {
        setPrecheck(precheckData);
        updatePrices(precheckData);
      } else {
        // Otherwise, fetch initial precheck data
        fetchPrecheckData(1);
      }
    }
  }, [community, action, open, precheckData]);

  const updatePrices = (data: SharePrecheckResponse) => {
    if (data.sharePrice) {
      setSharePrice(typeof data.sharePrice === 'string' 
        ? data.sharePrice 
        : data.sharePrice.toString());
    }
    
    if (data.totalValue) {
      setTotalCost(data.totalValue);
    }
    
    if (data.sharePriceUsd) {
      setUsdValue(typeof data.sharePriceUsd === 'string'
        ? data.sharePriceUsd
        : data.sharePriceUsd.toString());
    }
    
    // Set total share price if available
    if (data.totalSharePrice) {
      setTotalSharePrice(typeof data.totalSharePrice === 'string'
        ? data.totalSharePrice
        : data.totalSharePrice.toString());
    }
    
    // Set total USD value if available
    if (data.totalSharePriceUsd) {
      setTotalUsdValue(typeof data.totalSharePriceUsd === 'string'
        ? data.totalSharePriceUsd
        : data.totalSharePriceUsd.toString());
    } else if (data.sharePriceUsd && data.shareQuantity) {
      // Calculate if not provided
      const priceUsd = typeof data.sharePriceUsd === 'string'
        ? parseFloat(data.sharePriceUsd)
        : data.sharePriceUsd;
      const calculatedTotal = priceUsd * data.shareQuantity;
      setTotalUsdValue(calculatedTotal.toString());
    }
  };

  const fetchPrecheckData = async (quantity: number) => {
    if (!community || !action) return;
    
    try {
      setLoading(true);
      setErrorMessage("");
      
      let result: SharePrecheckResponse | null = null;
      
      if (action === 'buy') {
        result = await buySharesPrecheck(community.community, quantity);
      } else {
        result = await sellSharesPrecheck(community.community, quantity);
      }
      
      console.log(`Precheck result for ${action}:`, result);
      
      // Handle possible error states
      if (result.status === 'ERROR' || result.status === 'DEPOSIT') {
        setErrorMessage(result.error || `Unable to ${action} shares at this time`);
      } else {
        setPrecheck(result);
        updatePrices(result);
      }
    } catch (error) {
      console.error('Precheck error:', error);
      setErrorMessage(`Failed to get ${action} quote`);
    } finally {
      setLoading(false);
    }
  };

  const handleShareQuantityChange = (value: number) => {
    // Allow for small decimal values (minimum 0.001)
    const minQuantity = 0.001;
    // Make sure it's within bounds
    const clampedQuantity = Math.min(Math.max(value, minQuantity), maxShares);
    
    setShareQuantity(clampedQuantity);
    setQuantityInputValue(clampedQuantity.toString());
    fetchPrecheckData(clampedQuantity);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setQuantityInputValue(inputValue);
    
    // Only update the actual quantity and fetch data if the input is a valid number
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue)) {
      setShareQuantity(parsedValue);
      fetchPrecheckData(parsedValue);
    }
  };
  
  const incrementQuantity = () => {
    const newQuantity = shareQuantity + (shareQuantity < 0.1 ? 0.01 : shareQuantity < 1 ? 0.1 : 1);
    if (newQuantity <= maxShares) {
      handleShareQuantityChange(newQuantity);
    }
  };
  
  const decrementQuantity = () => {
    const decrementValue = shareQuantity <= 1 ? 0.1 : shareQuantity <= 10 ? 1 : 10;
    const newQuantity = shareQuantity - decrementValue;
    if (newQuantity >= 0.001) {
      handleShareQuantityChange(newQuantity);
    }
  };

  const handleConfirm = async () => {
    if (!community || !action) return;
    
    try {
      if (action === 'buy' && onBuyConfirm) {
        await onBuyConfirm(community.community, shareQuantity);
      } else if (action === 'sell' && onSellConfirm) {
        await onSellConfirm(community.community, shareQuantity);
      } else {
        toast.error(`Unable to ${action} shares at this time`);
      }
    } catch (error) {
      console.error(`Error during ${action} operation:`, error);
      toast.error(`Failed to ${action} shares. Please try again.`);
    }
  };
  
  const goToConfirmStep = () => {
    setStep('confirm');
  };
  
  const goBackToQuantityStep = () => {
    setStep('quantity');
  };
  
  const handleDialogClose = () => {
    // Reset the state when dialog is closed
    setStep('quantity');
    onOpenChange(false);
  };

  // Component for both quantity and confirm steps
  const ContentView = () => (
    <div className="space-y-6">
      {step === 'quantity' ? (
        /* Step 1: Select Quantity */
        <>
          {/* Community Info */}
          {community && (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={community.image} alt={community.community} />
                <AvatarFallback>{community.community.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{community.community}</h3>
                <p className="text-sm text-muted-foreground">
                  Current price: {parseFloat(sharePrice).toFixed(6)} ETH (${parseFloat(usdValue).toFixed(2)})
                </p>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          
          {/* Quick select amounts */}
          <div className="space-y-2">
            <Label htmlFor="shareQuantity">Select quantity</Label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {presetAmounts.map(amount => (
                <Button
                  key={amount}
                  type="button"
                  variant={shareQuantity === amount ? "default" : "outline"}
                  onClick={() => handleShareQuantityChange(amount)}
                  disabled={amount > maxShares || loading || loadingAction}
                >
                  {amount < 1 ? amount.toFixed(2) : amount}
                </Button>
              ))}
            </div>
            
            {/* Custom quantity input */}
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={shareQuantity <= 0.001 || loading || loadingAction}
                className="rounded-r-none"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="shareQuantity"
                type="text"
                value={quantityInputValue}
                onChange={handleInputChange}
                onBlur={() => {
                  const parsedValue = parseFloat(quantityInputValue);
                  if (isNaN(parsedValue) || parsedValue < 0.001) {
                    setQuantityInputValue("0.001");
                    handleShareQuantityChange(0.001);
                  } else if (parsedValue > maxShares) {
                    setQuantityInputValue(maxShares.toString());
                    handleShareQuantityChange(maxShares);
                  }
                }}
                className="rounded-none text-center"
                disabled={loading || loadingAction}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                disabled={shareQuantity >= maxShares || loading || loadingAction}
                className="rounded-l-none"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {action === 'sell' && (
              <div className="text-xs text-right text-muted-foreground">
                Maximum: {maxShares.toFixed(3)} shares available
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Price Summary */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Share Price</span>
              <div className="text-right">
                <div className="font-medium">{parseFloat(sharePrice).toFixed(6)} ETH</div>
                <div className="text-xs text-muted-foreground">${parseFloat(usdValue).toFixed(2)}</div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">Total Share Price</span>
              <div className="text-right">
                <div className="font-medium">
                  {totalSharePrice ? parseFloat(totalSharePrice).toFixed(6) : (parseFloat(sharePrice) * shareQuantity).toFixed(6)} ETH
                </div>
                <div className="text-xs text-muted-foreground">
                  ${totalUsdValue ? parseFloat(totalUsdValue).toFixed(2) : (parseFloat(usdValue) * shareQuantity).toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">{action === 'buy' ? 'Total Cost (incl. fees)' : 'You Receive'}</span>
              <div className="text-right">
                <div className="font-medium">{parseFloat(totalCost).toFixed(6)} ETH</div>
              </div>
            </div>
            
            {action === 'buy' && (
              <div className="flex justify-between">
                <span className="text-sm">Your Balance</span>
                <div className="text-right">
                  <div className="font-medium">{parseFloat(userEthBalance).toFixed(6)} ETH</div>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <Button
            className="w-full"
            onClick={goToConfirmStep}
            disabled={loading || loadingAction || !!errorMessage || shareQuantity <= 0}
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </>
      ) : (
        /* Step 2: Confirm Order */
        <>
          <div className="bg-muted p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Order Summary</span>
              <Button variant="ghost" size="sm" onClick={goBackToQuantityStep}>
                Edit
              </Button>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">{action === 'buy' ? 'Buying' : 'Selling'}</span>
              <span className="font-medium">{shareQuantity} shares</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">Price per share</span>
              <span className="font-medium">{parseFloat(sharePrice).toFixed(6)} ETH</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">Total Share Price</span>
              <div className="text-right">
                <div className="font-medium">
                  {totalSharePrice ? parseFloat(totalSharePrice).toFixed(6) : (parseFloat(sharePrice) * shareQuantity).toFixed(6)} ETH
                </div>
                <div className="text-xs text-muted-foreground">
                  ${totalUsdValue ? parseFloat(totalUsdValue).toFixed(2) : (parseFloat(usdValue) * shareQuantity).toFixed(2)}
                </div>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">{action === 'buy' ? 'Total Cost (incl. fees)' : 'You Receive'}</span>
              <div className="text-right">
                <div className="font-medium">{parseFloat(totalCost).toFixed(6)} ETH</div>
              </div>
            </div>
            
            {precheck?.fee && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Fee</span>
                <span>{precheck.fee}</span>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-sm text-blue-700 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Transaction Information</p>
              <p className="text-xs mt-1">
                {action === 'buy' 
                  ? "By buying shares, you're investing in this community and becoming a member."
                  : "Selling shares will decrease your position in this community."}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={goBackToQuantityStep}
              disabled={loading || loadingAction}
            >
              Back
            </Button>
            <Button
              className="sm:flex-1"
              onClick={handleConfirm}
              disabled={loading || loadingAction || !!errorMessage}
            >
              {(loading || loadingAction) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {action === 'buy' ? 'Buy Shares' : 'Sell Shares'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
  
  // If the component is being embedded directly (for mobile drawer in parent)
  if (isEmbedded) {
    return <ContentView />;
  }
  
  // For non-embedded usage, use responsive components
  return isMobile ? (
    // Mobile: Use Drawer
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pt-3 pb-6 max-h-[85vh]">
        <DrawerHeader className="px-0 pb-2">
          <DrawerTitle>
            {action === 'buy' ? 'Buy Shares' : 'Sell Shares'}
            {step === 'confirm' && ' - Confirm Order'}
          </DrawerTitle>
          <DrawerDescription>
            {action === 'buy' 
              ? 'Purchase shares of this community' 
              : 'Sell your shares of this community'}
          </DrawerDescription>
        </DrawerHeader>
        <ContentView />
      </DrawerContent>
    </Drawer>
  ) : (
    // Desktop: Use Sheet
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {action === 'buy' ? 'Buy Shares' : 'Sell Shares'}
            {step === 'confirm' && ' - Confirm Order'}
          </SheetTitle>
          <SheetDescription>
            {action === 'buy' 
              ? 'Purchase shares of this community' 
              : 'Sell your shares of this community'}
          </SheetDescription>
        </SheetHeader>
        <ContentView />
      </SheetContent>
    </Sheet>
  );
};
