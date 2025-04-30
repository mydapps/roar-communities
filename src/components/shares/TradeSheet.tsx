import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityPortfolioItem, SharePrecheckResponse, buySharesPrecheck, sellSharesPrecheck, buySharesConfirm, sellSharesConfirm } from '@/utils/communityApi';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Info, Plus, Minus, Check, PartyPopper } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';
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
  forceSuccessVisible = false
}: TradeSheetProps) => {
  // Multi-step flow
  const [step, setStep] = useState<'quantity' | 'confirm'>('quantity');
  const [shareQuantity, setShareQuantity] = useState(1);
  const [quantityInputValue, setQuantityInputValue] = useState("1");
  const [maxShares, setMaxShares] = useState(100);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [precheck, setPrecheck] = useState<SharePrecheckResponse | null>(precheckData);
  const [totalCost, setTotalCost] = useState("0");
  const [sharePrice, setSharePrice] = useState("0");
  const [totalSharePrice, setTotalSharePrice] = useState("0");
  const [usdValue, setUsdValue] = useState("0");
  const [totalUsdValue, setTotalUsdValue] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [currentETHBalance, setCurrentETHBalance] = useState(userEthBalance);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // IMPORTANT FIX: Create a local variable that prioritizes the successVisible state
  // This ensures consistent success state throughout the component
  const showSuccessScreen = successVisible || forceSuccessVisible;
  
  // Track previous community to detect changes
  const prevCommunityRef = useRef<string | null>(null);
  const prevActionRef = useRef<'buy' | 'sell' | null>(null);
  
  // No need to debounce as we're not making API calls on quantity change
  
  // Updated preset amounts to match requirements
  const presetAmounts = [0.01, 0.1, 1, 10];
  
  // Use the mobile hook outside of the embedded check
  const isMobile = useIsMobile();

  // Add a state variable to track if an operation is in progress
  const [operationInProgress, setOperationInProgress] = useState(false);
  
  // For debugging - cleaned up to only log essential information
  const hasCallbacks = {
    buy: !!onBuyConfirm,
    sell: !!onSellConfirm
  };

  // Reset all state when community or action changes
  useEffect(() => {
    // Check if community or action has changed
    if (open && community && action) {
      const currentCommunity = community.community;
      if (
        (prevCommunityRef.current && prevCommunityRef.current !== currentCommunity) ||
        (prevActionRef.current && prevActionRef.current !== action)
      ) {
        // Force reset all state when community or action changes
        setStep('quantity');
        setShareQuantity(1);
        setQuantityInputValue("1");
        setPrecheck(null);
        setTotalCost("0");
        setSharePrice("0");
        setTotalSharePrice("0");
        setUsdValue("0");
        setTotalUsdValue("0");
        setErrorMessage("");
        setSuccessVisible(false);
        setOperationInProgress(false);
        setSubmitLoading(false);
      }
      
      // Update refs for next comparison
      prevCommunityRef.current = currentCommunity;
      prevActionRef.current = action;
    }
  }, [open, community, action]);

  // Add an effect to refresh balance when loadingAction changes from true to false (transaction completed)
  useEffect(() => {
    // When loadingAction goes from true to false, it means a transaction has completed
    if (!loadingAction && operationInProgress && action === 'buy') {
      // Small delay to ensure the transaction has been processed
      setTimeout(() => {
        fetchCurrentBalance(); // Refresh the balance
      }, 200);
    }
  }, [loadingAction, operationInProgress, action]);

  // Lazy fetch ETH balance when the modal opens
  useEffect(() => {
    if (open && action === 'buy') {
      // Always fetch fresh balance when the modal opens
      fetchCurrentBalance();
    }
  }, [open, action]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Only reset if not showing success
      if (!successVisible) {
        resetState();
      }
    }
  }, [open, successVisible]);

  // Fetch current ETH balance
  const fetchCurrentBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const { getWalletBalance } = await import('@/utils/communityApi');
      const balanceData = await getWalletBalance();
      setCurrentETHBalance(balanceData.balance.eth);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };
  
  // Reset component state
  const resetState = () => {
    // IMPORTANT FIX: Only reset success state if explicitly instructed to
    // This prevents premature resetting of the success state
    if (!operationInProgress) {
      // Don't reset success immediately, keep it displayed
      // setSuccessVisible(false); - REMOVED this line
      
      setStep('quantity');
      setShareQuantity(1);
      setQuantityInputValue("1");
      setPrecheck(null);
      setTotalCost("0");
      setSharePrice("0");
      setTotalSharePrice("0");
      setUsdValue("0");
      setTotalUsdValue("0");
      setErrorMessage("");
      setOperationInProgress(false);
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (community && action && open) {
      // Never reset if operation is in progress
      if (!operationInProgress && !successVisible) {
        setStep('quantity');
        // Don't reset success state here either
        // setSuccessVisible(false); - REMOVED this line
      }
      
      setErrorMessage("");
      
      // Only initialize these values if we're not in the middle of an operation
      if (!operationInProgress && !successVisible) {
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
        }
        // We no longer fetch initial precheck data on first load
      }
    }
  }, [community, action, open, operationInProgress, precheckData, successVisible]);

  const updatePrices = (data: SharePrecheckResponse) => {
    if (!data) {
      return;
    }
    
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

  const fetchPrecheckData = async (quantity: number): Promise<boolean> => {
    if (!community || !action) {
      return false;
    }
    
    try {
      setLoading(true);
      setErrorMessage("");
      
      let result: SharePrecheckResponse | null = null;
      
      if (action === 'buy') {
        result = await buySharesPrecheck(community.community, quantity);
      } else {
        result = await sellSharesPrecheck(community.community, quantity);
      }
      
      if (!result) {
        throw new Error(`No result returned from ${action} precheck`);
      }
      
      // Handle possible error states
      if (result.status === 'ERROR' || result.status === 'DEPOSIT') {
        setErrorMessage(result.error || `Unable to ${action} shares at this time`);
        return false;
      } else if (result.status === 'SUCCESS') {
        setPrecheck(result);
        updatePrices(result);
        setErrorMessage("");
        return true;
      } else {
        // Unknown status
        setErrorMessage(`Unexpected response. Unable to ${action} shares at this time.`);
        return false;
      }
    } catch (error) {
      setErrorMessage(`Failed to get ${action} quote. Please try again.`);
      return false;
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
    // No price API call on quantity change
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setQuantityInputValue(inputValue);
    
    // Only update the actual quantity if the input is a valid number
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue)) {
      setShareQuantity(parsedValue);
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

  // Replace the loadingAction effect with a more robust implementation
  useEffect(() => {
    // Only show success when loadingAction transitions from true to false
    // while an operation is in progress
    if (operationInProgress && !loadingAction && step === 'confirm') {
      console.log('TradeSheet: Setting success visible due to loadingAction change');
      
      // Force the visibility of success screen - no delays to ensure it appears immediately
      setStep('confirm');
      setSuccessVisible(true);
      setOperationInProgress(false);
      
      // Extra feedback - do confetti animation
      triggerSuccessAnimation();
      
      // Vibrate on mobile devices for physical feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [loadingAction, step, operationInProgress]);
  
  // Updated triggerSuccessAnimation to not re-set the successVisible state
  const triggerSuccessAnimation = () => {
    // Create a more elaborate confetti display
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    
    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }
    
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleConfirm = async () => {
    if (!community || !action) {
      return;
    }
    
    try {
      setSubmitLoading(true);
      // Set that an operation is in progress and ensure we stay on the confirm step
      setOperationInProgress(true);
      setStep('confirm'); // Explicitly set step to confirm to ensure it stays there
      
      if (action === 'buy') {
        // If there's a callback provided by parent, use it
        if (onBuyConfirm) {
          console.log('TradeSheet: Starting buy operation with parent callback');
          
          // The parent component will handle the API call and set loadingAction
          await onBuyConfirm(community.community, shareQuantity);
          
          console.log('TradeSheet: Parent buy callback completed, loadingAction:', loadingAction);
          
          // IMPORTANT FIX: Always set success visible after callback completes, 
          // regardless of loadingAction state which might be updated asynchronously
          setStep('confirm');
          setSuccessVisible(true);
          setOperationInProgress(false);
          triggerSuccessAnimation();
          console.log('TradeSheet: Forced success visible after parent buy callback');
        } else {
          // Otherwise use our internal function for direct API call
          try {
            const result = await buySharesConfirm(community.community, shareQuantity);
         
            if (result && result.status === 'SUCCESS') {
              // Only show success after API confirms success
              setStep('confirm');
              setSuccessVisible(true);
              setOperationInProgress(false);
              
              // Show the confetti animation
              triggerSuccessAnimation();
              
              toast.success(`Successfully purchased ${result.shareQuantity} shares of ${community.community}!`);
              
              // Close after a short delay to allow animation to be seen
              setTimeout(() => {
                onOpenChange(false);
              }, 3000);
            } else {
              setOperationInProgress(false); // Reset operation flag on failure
              toast.error(result?.message || 'Transaction failed');
              return;
            }
          } catch (error) {
            setOperationInProgress(false);
            toast.error(`Failed to buy shares. Please try again.`);
          }
        }
      } else if (action === 'sell') {
        // Similar improvement to sell logic
        if (onSellConfirm) {
          console.log('TradeSheet: Starting sell operation with parent callback');
          
          await onSellConfirm(community.community, shareQuantity);
          
          console.log('TradeSheet: Parent sell callback completed, loadingAction:', loadingAction);
          
          // IMPORTANT FIX: Always set success visible after callback completes
          setStep('confirm');
          setSuccessVisible(true); 
          setOperationInProgress(false);
          triggerSuccessAnimation();
          console.log('TradeSheet: Forced success visible after parent sell callback');
        } else {
          // Otherwise use our internal function for direct API call
          try {
            const result = await sellSharesConfirm(community.community, shareQuantity);
            
            if (result && result.status === 'SUCCESS') {
              // Only show success after API confirms success
              setStep('confirm');
              setSuccessVisible(true);
              setOperationInProgress(false);
              
              // Show the confetti animation
              triggerSuccessAnimation();
              
              toast.success(`Successfully sold ${result.soldShares} shares of ${community.community}!`);
              
              // Close after a short delay to allow animation to be seen
              setTimeout(() => {
                onOpenChange(false);
              }, 3000);
            } else {
              setOperationInProgress(false); // Reset operation flag on failure
              toast.error(result?.message || 'Transaction failed');
              return;
            }
          } catch (error) {
            setOperationInProgress(false);
            toast.error(`Failed to sell shares. Please try again.`);
          }
        }
      }
    } catch (error) {
      toast.error(`Failed to ${action} shares. Please try again.`);
      setOperationInProgress(false); // Reset operation flag on error
    } finally {
      setSubmitLoading(false);
    }
  };
  
  const goToConfirmStep = async () => {
    // Don't allow step changes during API calls
    if (loading || loadingAction) {
      return;
    }
    
    // Fetch the current price when user proceeds to confirmation step
    const success = await fetchPrecheckData(shareQuantity);
    
    // Only proceed to confirm step if precheck was successful
    if (success) {
      setStep('confirm');
    }
  };
  
  const goBackToQuantityStep = () => {
    // Don't allow step changes during API calls
    if (loading || loadingAction || submitLoading) {
      return;
    }
    
    setStep('quantity');
  };
  
  const handleDialogClose = () => {
    // IMPORTANT FIX: Don't reset success state when closing the dialog
    // This allows the success screen to be visible when reopening
    
    // Delay the actual closing to avoid flashing
    if (successVisible) {
      // If showing success, we want to remember that state
      // We'll do a complete reset only when reopening
      onOpenChange(false);
      
      // Complete reset AFTER dialog is fully closed
      setTimeout(() => {
        setSuccessVisible(false);
        resetState();
      }, 300);
    } else {
      // Normal closing behavior for non-success states
      resetState();
      onOpenChange(false);
    }
  };
  
  // Add effect to handle the forceSuccessVisible prop
  useEffect(() => {
    // If parent component wants to force success visible, do it
    if (forceSuccessVisible) {
      console.log('TradeSheet: Force success visible from parent prop');
      setStep('confirm');
      setSuccessVisible(true);
      setOperationInProgress(false);
      
      // Add confetti animation when success is forced by parent
      triggerSuccessAnimation();
    }
  }, [forceSuccessVisible]);
  
  // Component for both quantity and confirm steps
  const ContentView = () => {
    // Add debug logging to help troubleshoot
    console.log('TradeSheet ContentView rendering with states:', { 
      successVisible, 
      step, 
      operationInProgress,
      loadingAction,
      submitLoading,
      showSuccessScreen
    });
    
    return (
      <div className="space-y-6">
        {showSuccessScreen ? (
          /* Success state */
          <div className="bg-green-50 border border-green-100 p-6 rounded-lg text-center">
            <div className="flex justify-center mb-3 relative">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <PartyPopper className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="font-bold text-xl text-green-700 mb-2">Transaction Successful!</h3>
            <p className="text-green-600 text-lg">
              {action === 'buy' 
                ? `You've successfully purchased ${shareQuantity} shares of ${community?.community}!` 
                : `You've successfully sold ${shareQuantity} shares of ${community?.community}!`}
            </p>
            <div className="mt-4">
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : step === 'quantity' ? (
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
                    {action === 'buy' ? 'Buy Shares' : 'Sell Shares'}
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
            
            {/* Price Info Message instead of actual price info */}
            <div className="py-4 text-center text-sm text-muted-foreground">
              Share price will be calculated when you continue
            </div>
            
            {action === 'buy' && (
              <div className="flex justify-between">
                <span className="text-sm">Your Balance</span>
                <div className="text-right">
                  {isLoadingBalance ? (
                    <div className="font-medium flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <div className="font-medium">{parseFloat(currentETHBalance).toFixed(6)} ETH</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <Button
              className="w-full"
              onClick={goToConfirmStep}
              disabled={loading || loadingAction || shareQuantity <= 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading price...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
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
                  <span>{typeof precheck.fee === 'string' ? precheck.fee.split(' ')[0] + ' ETH' : precheck.fee}</span>
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
                disabled={loading || loadingAction || submitLoading}
              >
                Back
              </Button>
              <Button
                className="sm:flex-1"
                onClick={handleConfirm}
                disabled={loading || loadingAction || !!errorMessage || submitLoading}
              >
                {(loading || loadingAction || submitLoading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {(loading || loadingAction || submitLoading) 
                  ? `${action === 'buy' ? 'Buying' : 'Selling'}...` 
                  : `${action === 'buy' ? 'Buy' : 'Sell'} Shares`
                }
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // If the component is being embedded directly (for mobile drawer in parent)
  if (isEmbedded) {
    return <ContentView />;
  }
  
  // For non-embedded usage, use responsive components
  return isMobile ? (
    // Mobile: Use Drawer
    <Drawer open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleDialogClose();
      } else {
        onOpenChange(true);
      }
    }}>
      <DrawerContent className="px-4 pt-3 pb-6 max-h-[85vh]">
        <DrawerHeader className="px-0 pb-2">
          <DrawerTitle>
            {showSuccessScreen 
              ? 'Transaction Complete!' 
              : `${action === 'buy' ? 'Buy' : 'Sell'} Shares${step === 'confirm' ? ' - Confirm Order' : ''}`}
          </DrawerTitle>
          <DrawerDescription>
            {showSuccessScreen 
              ? 'Congratulations on your successful transaction!' 
              : (action === 'buy' 
                ? 'Purchase shares of this community' 
                : 'Sell your shares of this community')}
          </DrawerDescription>
        </DrawerHeader>
        <ContentView />
      </DrawerContent>
    </Drawer>
  ) : (
    // Desktop: Use Sheet
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleDialogClose();
      } else {
        onOpenChange(true);
      }
    }}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {showSuccessScreen 
              ? 'Transaction Complete!' 
              : `${action === 'buy' ? 'Buy' : 'Sell'} Shares${step === 'confirm' ? ' - Confirm Order' : ''}`}
          </SheetTitle>
          <SheetDescription>
            {showSuccessScreen 
              ? 'Congratulations on your successful transaction!' 
              : (action === 'buy' 
                ? 'Purchase shares of this community' 
                : 'Sell your shares of this community')}
          </SheetDescription>
        </SheetHeader>
        <ContentView />
      </SheetContent>
    </Sheet>
  );
};

