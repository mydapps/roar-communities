import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityPortfolioItem, SharePrecheckResponse, buySharesPrecheck, sellSharesPrecheck, buySharesConfirm, sellSharesConfirm, getWalletBalance } from '@/utils/communityApi';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Info, Plus, Minus, ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import confetti from 'canvas-confetti';

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
  forceSuccessVisible?: boolean;
  onBalanceUpdate?: (newBalance: string) => void;
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
  precheckData = null,
  forceSuccessVisible = false,
  onBalanceUpdate
}: TradeSheetProps) => {
  // Core state
  const [step, setStep] = useState<'quantity' | 'confirm'>('quantity');
  const [shareQuantity, setShareQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [maxShares, setMaxShares] = useState(100);
  const [isLoadingPrecheck, setIsLoadingPrecheck] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [precheck, setPrecheck] = useState<SharePrecheckResponse | null>(precheckData);
  const [errorMessage, setErrorMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(userEthBalance);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Store the actual transaction quantity to show in success screen
  const [transactionQuantity, setTransactionQuantity] = useState<number | null>(null);
  
  // Track if the component has been initialized to prevent unwanted resets
  const [isInitialized, setIsInitialized] = useState(false);
  
  // UI state
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Derived state
  const showSuccessScreen = successVisible || forceSuccessVisible;
  const isOperationInProgress = isConfirming || loadingAction;
  
  // Smart number formatter to prevent floating point errors
  const formatNumber = (num: number, decimals: number = 6): string => {
    return parseFloat(num.toFixed(decimals)).toString();
  };
  
  // Helper function to format gas fee, removing duplicate ETH and USD values
  const formatGasFee = (fee: string | number): string => {
    if (typeof fee === 'string') {
      // If it's a string, extract only the ETH portion
      // Remove USD portion (anything in parentheses) and extra whitespace
      let cleanFee = fee.replace(/\s*\([^)]*\)\s*/g, '').trim();
      
      // If it already includes ETH, return as-is
      if (cleanFee.toLowerCase().includes('eth')) {
        return cleanFee;
      } else {
        // If it's just a number string, add ETH
        return `${cleanFee} ETH`;
      }
    } else {
      // If it's a number, format and add ETH
      return `${formatNumber(fee, 6)} ETH`;
    }
  };
  
  // Smart quantity update with proper rounding
  const updateQuantity = (newValue: number) => {
    // Round to 6 decimal places to prevent floating point errors
    const rounded = Math.round(newValue * 1000000) / 1000000;
    const clamped = Math.min(Math.max(rounded, 0.000001), maxShares);
    
    setShareQuantity(clamped);
    setQuantityInput(formatNumber(clamped, 6));
    setErrorMessage("");
  };

  // Improved input handler that preserves cursor position
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow typing decimal numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setQuantityInput(value);
      
      // Update quantity only if it's a valid number
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0) {
        setShareQuantity(parsed);
        setErrorMessage("");
      }
    }
  };

  // Input blur handler for validation
  const handleInputBlur = () => {
    const parsed = parseFloat(quantityInput);
    if (isNaN(parsed) || parsed <= 0) {
      updateQuantity(0.000001);
    } else if (parsed > maxShares) {
      updateQuantity(maxShares);
      setErrorMessage(`Maximum ${formatNumber(maxShares, 3)} shares available`);
    } else {
      updateQuantity(parsed);
    }
  };

  // Quick amount buttons for better UX
  const quickAmounts = action === 'buy' 
    ? [0.01, 0.1, 1, 10]
    : maxShares > 0 
      ? [
          Math.min(0.1, maxShares),
          Math.min(0.5, maxShares), 
          Math.min(1, maxShares),
          maxShares
        ].filter((amount, index, arr) => arr.indexOf(amount) === index) // Remove duplicates
      : [0.1, 0.5, 1];

  // Smart increment/decrement
  const incrementQuantity = () => {
    const increment = shareQuantity < 0.1 ? 0.01 : shareQuantity < 1 ? 0.1 : 1;
    updateQuantity(shareQuantity + increment);
  };

  const decrementQuantity = () => {
    const decrement = shareQuantity <= 0.1 ? 0.01 : shareQuantity <= 1 ? 0.1 : 1;
    updateQuantity(Math.max(shareQuantity - decrement, 0.000001));
  };

  // Fetch wallet balance - implementing the same pattern as MySharesPage
  const fetchBalance = async (forceRefresh = false) => {
    try {
      setIsLoadingBalance(true);
      const balanceData = await getWalletBalance(forceRefresh);
      setUserBalance(balanceData.balance.eth);
      
      // Call parent callback to update balance if provided
      if (onBalanceUpdate) {
        onBalanceUpdate(balanceData.balance.eth);
      }
      
      return balanceData;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Only show toast for non-auth errors
      if (!(error instanceof Error && error.message.includes('Authentication required'))) {
        toast.error("Failed to load wallet balance");
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch price quote
  const fetchPriceQuote = async (quantity: number): Promise<boolean> => {
    if (!community || !action || quantity <= 0) return false;
    
    try {
      setIsLoadingPrecheck(true);
      setErrorMessage("");
      
      let result: SharePrecheckResponse | null = null;
      
      if (action === 'buy') {
        result = await buySharesPrecheck(community.community, quantity);
      } else {
        result = await sellSharesPrecheck(community.community, quantity);
      }
      
      if (!result) {
        setErrorMessage(`Unable to get ${action} quote`);
        return false;
      }
      
      if (result.status === 'ERROR' || result.status === 'DEPOSIT') {
        setErrorMessage(result.error || `Unable to ${action} shares at this time`);
        return false;
      }
      
      if (result.status === 'SUCCESS') {
        setPrecheck(result);
        return true;
      }
      
      setErrorMessage(`Unexpected response from ${action} quote`);
      return false;
    } catch (error) {
      console.error(`Error fetching ${action} quote:`, error);
      setErrorMessage(`Failed to get ${action} quote. Please try again.`);
      return false;
    } finally {
      setIsLoadingPrecheck(false);
    }
  };

  // Handle confirm transaction
  const handleConfirm = async () => {
    if (!community || !action) return;
    
    try {
      setIsConfirming(true);
      
      if (action === 'buy') {
        if (onBuyConfirm) {
          await onBuyConfirm(community.community, shareQuantity);
          // Store the actual transaction quantity for success screen
          setTransactionQuantity(shareQuantity);
          // Force refresh balance after successful transaction
          await fetchBalance(true);
          setSuccessVisible(true);
          triggerSuccessAnimation();
        } else {
          const result = await buySharesConfirm(community.community, shareQuantity);
          if (result?.status === 'SUCCESS') {
            // Store the actual transaction quantity for success screen
            setTransactionQuantity(shareQuantity);
            // Force refresh balance after successful transaction
            await fetchBalance(true);
            setSuccessVisible(true);
            setTransactionHash(result.transactionHash || null);
            triggerSuccessAnimation();
            toast.success(`Successfully purchased ${formatNumber(shareQuantity, shareQuantity < 1 ? 3 : shareQuantity < 10 ? 2 : 0)} shares!`);
            setTimeout(() => onOpenChange(false), 3000);
          } else {
            throw new Error(result?.message || 'Transaction failed');
          }
        }
      } else {
        if (onSellConfirm) {
          await onSellConfirm(community.community, shareQuantity);
          // Store the actual transaction quantity for success screen
          setTransactionQuantity(shareQuantity);
          // Force refresh balance after successful transaction
          await fetchBalance(true);
          setSuccessVisible(true);
          triggerSuccessAnimation();
        } else {
          const result = await sellSharesConfirm(community.community, shareQuantity);
          if (result?.status === 'SUCCESS') {
            // Store the actual transaction quantity for success screen
            setTransactionQuantity(shareQuantity);
            // Force refresh balance after successful transaction
            await fetchBalance(true);
            setSuccessVisible(true);
            setTransactionHash(result.transactionHash || null);
            triggerSuccessAnimation();
            toast.success(`Successfully sold ${formatNumber(shareQuantity, shareQuantity < 1 ? 3 : shareQuantity < 10 ? 2 : 0)} shares!`);
            setTimeout(() => onOpenChange(false), 3000);
          } else {
            throw new Error(result?.message || 'Transaction failed');
          }
        }
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      toast.error(`Failed to ${action} shares. Please try again.`);
    } finally {
      setIsConfirming(false);
    }
  };

  // Success animation
  const triggerSuccessAnimation = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() - 0.2 }
      });
    }, 250);

    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  // Navigation functions
  const goToConfirm = async () => {
    const success = await fetchPriceQuote(shareQuantity);
    if (success) {
      setStep('confirm');
    }
  };

  const goBackToQuantity = () => {
    setStep('quantity');
    setPrecheck(null);
    setErrorMessage("");
  };

  // Reset on close
  const handleClose = () => {
    if (!isOperationInProgress && !showSuccessScreen) {
      setStep('quantity');
      setShareQuantity(1);
      setQuantityInput("1");
      setPrecheck(null);
      setErrorMessage("");
      setSuccessVisible(false);
      setTransactionHash(null);
      setTransactionQuantity(null);
      setIsInitialized(false);
      onOpenChange(false);
    }
  };

  // Initialize component
  useEffect(() => {
    if (open && community && action) {
      // Set max shares for selling
      if (action === 'sell') {
        const ownedShares = community.shares || 0;
        setMaxShares(ownedShares);
        
        // Only reset quantity on initial load, not on step changes
        if (!isInitialized) {
          const defaultQuantity = Math.min(1, ownedShares);
          updateQuantity(defaultQuantity);
          setIsInitialized(true);
        }
      } else {
        setMaxShares(1000); // High limit for buying
        
        // Only reset quantity on initial load, not on step changes
        if (!isInitialized) {
          updateQuantity(1);
          setIsInitialized(true);
        }
      }
      
      // Fetch balance for buy orders with force refresh
      if (action === 'buy') {
        fetchBalance(true);
      }
    }
  }, [open, community, action, isInitialized]);

  // Track loading completion for success state
  useEffect(() => {
    if (!loadingAction && isConfirming) {
      setSuccessVisible(true);
      setIsConfirming(false);
      triggerSuccessAnimation();
    }
  }, [loadingAction, isConfirming]);

  // Component content
  const renderContent = () => {
    if (showSuccessScreen) {
      return (
                 <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
           <div className="relative">
             <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
             <div className="absolute -inset-2 bg-green-100 rounded-full -z-10 animate-pulse" />
           </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-green-700">Success! 🎉</h3>
            <p className="text-muted-foreground">
              Your {action} order for {formatNumber(transactionQuantity || shareQuantity, 3)} shares of {community?.community} has been completed.
            </p>
          </div>
          
          {transactionHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full">
              <p className="text-sm text-green-700 font-medium">Transaction Hash:</p>
              <p className="text-xs text-green-600 font-mono break-all">{transactionHash}</p>
            </div>
          )}
          
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Continue
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Community Header */}
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
            {community?.community.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold">{community?.community}</h3>
            <p className="text-sm text-muted-foreground">
              {action === 'buy' ? 'Buy Shares' : 'Sell Shares'}
            </p>
          </div>
        </div>

        {step === 'quantity' ? (
          // Quantity Selection Step
          <>
            {/* Quick Amount Buttons */}
            <div className="space-y-3">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={Math.abs(shareQuantity - amount) < 0.0001 ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateQuantity(amount)}
                    disabled={amount > maxShares}
                    className="text-xs"
                  >
                    {formatNumber(amount, amount < 1 ? 3 : 0)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-3">
              <Label>Custom Amount</Label>
              <div className="flex items-center border rounded-lg overflow-hidden bg-background">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={shareQuantity <= 0.000001}
                  className="h-12 w-12 rounded-none border-r shrink-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  ref={inputRef}
                  type="text"
                  value={quantityInput}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className="border-0 text-center text-lg font-medium h-12 focus-visible:ring-0"
                  placeholder="0.0"
                />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={shareQuantity >= maxShares}
                  className="h-12 w-12 rounded-none border-l shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {action === 'sell' && (
                <p className="text-xs text-muted-foreground text-right">
                  Available: {formatNumber(maxShares, 3)} shares
                </p>
              )}
            </div>

            {/* Balance Display for Buy Orders */}
            {action === 'buy' && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium">Your Balance</span>
                <div className="text-right">
                  {isLoadingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="font-medium">{formatNumber(parseFloat(userBalance), 6)} ETH</span>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}
          </>
        ) : (
          // Confirmation Step
          <>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Order Summary</h4>
                <Button variant="ghost" size="sm" onClick={goBackToQuantity}>
                  Edit
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Quantity</span>
                  <span className="font-medium">{formatNumber(shareQuantity, 3)} shares</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">Price per share</span>
                  <span className="font-medium">
                    {precheck?.sharePrice ? formatNumber(parseFloat(precheck.sharePrice.toString()), 6) : '0'} ETH
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">Total Value</span>
                  <span className="font-medium">
                    {precheck?.totalValue ? formatNumber(parseFloat(precheck.totalValue), 6) : '0'} ETH
                  </span>
                </div>
                
                {precheck?.fee && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Gas Fee</span>
                    <span>{formatGasFee(precheck.fee)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>{action === 'buy' ? 'Total Cost' : 'You Receive'}</span>
                  <div className="text-right">
                    <div className="font-semibold">
                      {precheck?.totalValue ? formatNumber(parseFloat(precheck.totalValue), 6) : '0'} ETH
                    </div>
                    {precheck?.totalSharePriceUsd && (
                      <div className="text-sm text-muted-foreground font-normal">
                        (${formatNumber(parseFloat(precheck.totalSharePriceUsd.toString()), 2)})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Transaction Details</p>
                  <p className="text-xs mt-1">
                    {action === 'buy' 
                      ? "You're investing in this community and becoming a member."
                      : "Your shares will be sold at the current market price."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sticky Action Buttons */}
        <div className={`${isMobile ? 'sticky bottom-0 left-0 right-0 bg-background border-t p-4 -mx-4 -mb-6' : ''}`}>
          {step === 'quantity' ? (
            <Button
              onClick={goToConfirm}
              disabled={shareQuantity <= 0 || isLoadingPrecheck || !!errorMessage}
              className="w-full h-12"
              size="lg"
            >
              {isLoadingPrecheck ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Price...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={goBackToQuantity}
                disabled={isOperationInProgress}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isOperationInProgress || !!errorMessage}
                className="flex-1 h-12"
                size="lg"
              >
                {isOperationInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {action === 'buy' ? 'Buying...' : 'Selling...'}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Confirm {action === 'buy' ? 'Buy' : 'Sell'}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isEmbedded) {
    return renderContent();
  }

  const title = showSuccessScreen 
    ? 'Transaction Complete!' 
    : `${action === 'buy' ? 'Buy' : 'Sell'} Shares${step === 'confirm' ? ' - Confirm' : ''}`;

  const description = showSuccessScreen 
    ? 'Your transaction was successful!' 
    : `${action === 'buy' ? 'Purchase' : 'Sell'} shares of ${community?.community}`;

  return isMobile ? (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="px-4 pb-safe max-h-[90vh]">
        <DrawerHeader className="px-0">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto">
          {renderContent()}
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
};

