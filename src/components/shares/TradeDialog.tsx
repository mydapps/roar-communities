import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityPortfolioItem, SharePrecheckResponse, buySharesPrecheck, sellSharesPrecheck } from '@/utils/communityApi';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: CommunityPortfolioItem | null;
  action: 'buy' | 'sell' | null;
  userEthBalance: string;
  onBuyConfirm?: (communityName: string, quantity: number) => Promise<void>;
  onSellConfirm?: (communityName: string, quantity: number) => Promise<void>;
  loadingAction?: boolean;
  precheckData?: SharePrecheckResponse | null;
}

export const TradeDialog = ({ 
  open, 
  onOpenChange, 
  community, 
  action,
  userEthBalance,
  onBuyConfirm,
  onSellConfirm,
  loadingAction = false,
  precheckData = null
}: TradeDialogProps) => {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [shareQuantity, setShareQuantity] = useState(1);
  const [maxShares, setMaxShares] = useState(100);
  const [loading, setLoading] = useState(false);
  const [precheck, setPrecheck] = useState<SharePrecheckResponse | null>(precheckData);
  const [totalCost, setTotalCost] = useState("0");
  const [sharePrice, setSharePrice] = useState("0");
  const [usdValue, setUsdValue] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep('input');
    }
  }, [open]);

  useEffect(() => {
    if (community && action && open) {
      // Initialize with 1 share by default
      setShareQuantity(1);
      
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
        if (precheckData.sharePrice) {
          setSharePrice(typeof precheckData.sharePrice === 'string' 
            ? precheckData.sharePrice 
            : precheckData.sharePrice.toString());
        }
        if (precheckData.totalValue) {
          setTotalCost(precheckData.totalValue);
        }
        if (precheckData.sharePriceUsd) {
          setUsdValue(typeof precheckData.sharePriceUsd === 'string'
            ? precheckData.sharePriceUsd
            : precheckData.sharePriceUsd.toString());
        }
      } else {
        // Otherwise, fetch initial precheck data
        fetchPrecheckData(1);
      }
    }
  }, [community, action, open, precheckData]);

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
      
      // Handle possible error states
      if (result.status === 'ERROR' || result.status === 'DEPOSIT') {
        setErrorMessage(result.error || `Unable to ${action} shares at this time`);
      } else {
        setPrecheck(result);
        if (result.sharePrice) {
          setSharePrice(typeof result.sharePrice === 'string' 
            ? result.sharePrice 
            : result.sharePrice.toString());
        }
        if (result.totalValue) {
          setTotalCost(result.totalValue);
        }
        if (result.sharePriceUsd) {
          setUsdValue(typeof result.sharePriceUsd === 'string'
            ? result.sharePriceUsd
            : result.sharePriceUsd.toString());
        }
      }
    } catch (error) {
      console.error('Precheck error:', error);
      setErrorMessage(`Failed to get ${action} quote`);
    } finally {
      setLoading(false);
    }
  };

  const handleShareQuantityChange = (value: number | number[]) => {
    const newQuantity = Array.isArray(value) ? value[0] : value;
    setShareQuantity(newQuantity);
    fetchPrecheckData(newQuantity);
  };

  const handleProceedToConfirm = () => {
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!community || !action) return;
    
    if (action === 'buy' && onBuyConfirm) {
      await onBuyConfirm(community.community, shareQuantity);
    } else if (action === 'sell' && onSellConfirm) {
      await onSellConfirm(community.community, shareQuantity);
    } else {
      toast.error(`Unable to ${action} shares at this time`);
    }
  };

  const handleBack = () => {
    setStep('input');
  };

  const handleDialogClose = () => {
    // Reset state when dialog closes
    setShareQuantity(1);
    setErrorMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action === 'buy' ? 'Buy Shares' : 'Sell Shares'}</DialogTitle>
          <DialogDescription>
            {action === 'buy' 
              ? `Purchase shares of ${community?.community || 'this community'}` 
              : `Sell your shares of ${community?.community || 'this community'}`}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'input' ? (
          <div className="space-y-6">
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
                    {action === 'buy' ? 'Purchase shares' : 'Sell your shares'}
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
            
            {/* Share Quantity */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="shareQuantity">Share Quantity</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="shareQuantity"
                    type="number"
                    value={shareQuantity}
                    min={0.01}
                    max={maxShares}
                    step={0.01}
                    className="w-20 text-right"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value > 0 && value <= maxShares) {
                        handleShareQuantityChange(value);
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">shares</span>
                </div>
              </div>
              
              <Slider
                min={0.01}
                max={maxShares}
                step={0.01}
                value={[shareQuantity]}
                onValueChange={handleShareQuantityChange}
                disabled={loading || loadingAction}
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.01</span>
                <span>{maxShares}</span>
              </div>
            </div>
            
            <Separator />
            
            {/* Price Info */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Share Price</span>
                <div className="text-right">
                  <div className="font-medium">{parseFloat(sharePrice).toFixed(8)} ETH</div>
                  <div className="text-xs text-muted-foreground">${parseFloat(usdValue).toFixed(2)}</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">{action === 'buy' ? 'Total Cost' : 'You Receive'}</span>
                <div className="text-right">
                  <div className="font-medium">{parseFloat(totalCost).toFixed(8)} ETH</div>
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
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleProceedToConfirm}
                disabled={loading || loadingAction || !!errorMessage || shareQuantity <= 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Review Order
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDialogClose}
                disabled={loading || loadingAction}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium text-lg mb-2">Order Summary</h3>
              
              <div className="space-y-3 mt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Action</span>
                  <span className="font-medium">{action === 'buy' ? 'Buy Shares' : 'Sell Shares'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Community</span>
                  <span className="font-medium">{community?.community}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{shareQuantity} shares</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Share Price</span>
                  <span className="font-medium">{parseFloat(sharePrice).toFixed(8)} ETH</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{action === 'buy' ? 'Total Cost' : 'You Receive'}</span>
                  <span className="font-medium">{parseFloat(totalCost).toFixed(8)} ETH</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Transaction Info</h4>
              <p className="text-sm text-muted-foreground">
                This transaction will be processed on the Ethereum network. Once confirmed, it cannot be reversed.
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleConfirm}
                disabled={loadingAction || !!errorMessage}
              >
                {loadingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {action === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleBack}
                disabled={loadingAction}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
