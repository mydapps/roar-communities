import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Community, SharePrecheckResponse, buySharesPrecheck, sellSharesPrecheck, buySharesConfirm, sellSharesConfirm, getShareValue } from '@/utils/communityApi';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface CommunityShareDialogProps {
  community: Community | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  action?: 'buy' | 'sell';
}

export const CommunityShareDialog = ({
  community,
  open,
  onOpenChange,
  onSuccess,
  action: initialAction = 'buy'
}: CommunityShareDialogProps) => {
  const [action, setAction] = useState<'buy' | 'sell'>(initialAction);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [precheckData, setPrecheckData] = useState<SharePrecheckResponse | null>(null);
  const [userShareData, setUserShareData] = useState<{shares: number}|null>(null);

  useEffect(() => {
    setAction(initialAction);
  }, [initialAction]);

  const fetchUserShares = React.useCallback(async () => {
    if (!community?.name) return;
    
    try {
      const shareValueResponse = await getShareValue(community.name);
      console.log("User share data:", shareValueResponse);
      if (shareValueResponse.success) {
        setUserShareData({
          shares: shareValueResponse.data.shares
        });
      }
    } catch (error) {
      console.error("Error fetching user shares:", error);
      setUserShareData(null);
    }
  }, [community?.name]);

  const performPrecheck = React.useCallback(async () => {
    if (!community?.name) return;
    
    try {
      setLoading(true);
      let precheckResult: SharePrecheckResponse | null = null;
      
      if (action === 'buy') {
        precheckResult = await buySharesPrecheck(community.name, quantity);
      } else {
        precheckResult = await sellSharesPrecheck(community.name, quantity);
      }
      
      console.log(`${action} precheck result:`, precheckResult);
      setPrecheckData(precheckResult);
    } catch (error) {
      console.error(`Failed to precheck ${action}:`, error);
      toast.error(`Unable to prepare ${action} operation`);
    } finally {
      setLoading(false);
    }
  }, [action, community?.name, quantity]);

  useEffect(() => {
    if (community && open) {
      fetchUserShares();
      performPrecheck();
    } else {
      setQuantity(1);
      setPrecheckData(null);
    }
  }, [community, open, action, quantity, fetchUserShares, performPrecheck]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else {
      setQuantity(value);
    }
  };

  const handleConfirm = async () => {
    if (!community?.name) return;
    
    try {
      setConfirmLoading(true);
      let result;
      
      if (action === 'buy') {
        result = await buySharesConfirm(community.name, quantity);
        if (result.status === 'SUCCESS') {
          triggerSuccessAnimation();
          toast.success(`Successfully purchased ${result.shareQuantity} shares of ${community.name}`);
          onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.message || 'Transaction failed');
        }
      } else {
        result = await sellSharesConfirm(community.name, quantity);
        if (result.status === 'SUCCESS') {
          triggerSuccessAnimation();
          toast.success(`Successfully sold ${result.soldShares} shares of ${community.name}`);
          onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.message || 'Transaction failed');
        }
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      toast.error(`Failed to complete ${action} operation`);
    } finally {
      setConfirmLoading(false);
    }
  };

  const triggerSuccessAnimation = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const updateQuantityAndPrecheck = (newQuantity: number) => {
    setQuantity(newQuantity);
    // Use a setTimeout to avoid too many API calls when typing quickly
    setTimeout(() => performPrecheck(), 500);
  };

  const canSell = userShareData && userShareData.shares >= quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {action === 'buy' ? 'Buy Shares' : 'Sell Shares'} - {community?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center mb-4 space-x-2">
          <Button 
            variant={action === 'buy' ? "default" : "outline"} 
            className={action === 'buy' ? "bg-green-600 hover:bg-green-700" : ""}
            onClick={() => setAction('buy')}
          >
            <ArrowUp className="h-4 w-4 mr-1" />
            Buy
          </Button>
          <Button 
            variant={action === 'sell' ? "default" : "outline"} 
            className={action === 'sell' ? "bg-red-600 hover:bg-red-700" : ""}
            onClick={() => setAction('sell')}
            disabled={!canSell}
          >
            <ArrowDown className="h-4 w-4 mr-1" />
            Sell
          </Button>
        </div>
        
        {action === 'sell' && userShareData && (
          <div className="text-sm text-muted-foreground text-center mb-4">
            You currently own {userShareData.shares} shares of this community
          </div>
        )}
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateQuantityAndPrecheck(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <Input 
                value={quantity} 
                onChange={handleQuantityChange}
                onBlur={() => performPrecheck()}
                type="number" 
                min="1" 
                className="text-center"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateQuantityAndPrecheck(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Price per share:</span>
                <span className="font-medium">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                  ) : (
                    <>
                      {precheckData?.sharePrice ? `${precheckData.sharePrice} ETH` : '0 ETH'}
                      <span className="text-xs text-muted-foreground ml-1">
                        (${precheckData?.sharePriceUsd || '0'})
                      </span>
                    </>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-medium">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                  ) : (
                    <>
                      {precheckData?.totalValue || '0 ETH'}
                      <span className="text-xs text-muted-foreground ml-1">
                        (${precheckData?.totalSharePriceUsd || '0'})
                      </span>
                    </>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Network Fee:</span>
                <span className="font-medium">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                  ) : (
                    precheckData?.fee || '0 ETH'
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleConfirm} 
            disabled={loading || confirmLoading || (action === 'sell' && !canSell) || !precheckData}
          >
            {confirmLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Confirming...
              </>
            ) : (
              `Confirm ${action}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
