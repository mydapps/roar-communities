import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityPortfolioItem, SharePrecheckResponse, buySharesPrecheck, sellSharesPrecheck } from '@/utils/communityApi';
import { toast } from 'sonner';
import { Loader2, Plus, Minus } from 'lucide-react';

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
  const [shareQuantity, setShareQuantity] = useState(1);
  const [maxShares, setMaxShares] = useState(100);
  const [loading, setLoading] = useState(false);
  const [precheck, setPrecheck] = useState<SharePrecheckResponse | null>(precheckData);
  const [totalCost, setTotalCost] = useState("0");
  const [sharePrice, setSharePrice] = useState("0");
  const [usdValue, setUsdValue] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (community && action && open) {
      setShareQuantity(1);
      
      if (action === 'sell') {
        const ownedShares = Math.floor(community.shares * 100) / 100;
        setMaxShares(ownedShares > 0 ? ownedShares : 0.01);
      } else {
        setMaxShares(100);
      }
      
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

  const SheetComponent = (
    <div className={`space-y-6 ${isEmbedded ? '' : 'px-2'}`}>
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
      
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      
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
      
      <div className="flex gap-3 pt-4">
        <Button
          className="flex-1"
          onClick={handleConfirm}
          disabled={loading || loadingAction || !!errorMessage || shareQuantity <= 0}
        >
          {(loading || loadingAction) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {action === 'buy' ? 'Buy Shares' : 'Sell Shares'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onOpenChange(false)}
          disabled={loading || loadingAction}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
  
  if (isEmbedded) {
    return SheetComponent;
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{action === 'buy' ? 'Buy Shares' : 'Sell Shares'}</SheetTitle>
          <SheetDescription>
            {action === 'buy' 
              ? 'Purchase shares of this community' 
              : 'Sell your shares of this community'}
          </SheetDescription>
        </SheetHeader>
        {SheetComponent}
      </SheetContent>
    </Sheet>
  );
};
