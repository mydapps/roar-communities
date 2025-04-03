import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw,
  SendHorizontal,
  Loader2,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  getWalletBalance, 
  CommunityPortfolioItem, 
  buySharesPrecheck,
  buySharesConfirm,
  sellSharesPrecheck,
  sellSharesConfirm,
  SharePrecheckResponse
} from '@/utils/communityApi';
import { PortfolioSummary } from '@/components/shares/PortfolioSummary';
import { DepositSheet } from '@/components/shares/DepositSheet';
import { ETHTransferSheet } from '@/components/eth/ETHTransferSheet';
import { TradeSheet } from '@/components/shares/TradeSheet';
import { CommunityShareCard } from '@/components/shares/CommunityShareCard';
import { ShareTransferSheet } from '@/components/shares/ShareTransferSheet';
import { usePortfolio } from '@/hooks/usePortfolio';
import { ScrollArea } from '@/components/ui/scroll-area';
import confetti from 'canvas-confetti';

const MySharesPage = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityPortfolioItem | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell' | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [precheckData, setPrecheckData] = useState<SharePrecheckResponse | null>(null);
  const isMobile = useIsMobile();

  const {
    portfolioItems,
    portfolioSummary,
    isLoading,
    isRefreshing,
    refreshPortfolio,
    loadMoreRef
  } = usePortfolio();

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  // Development-only logging helper
  const debugLog = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable dev logs when needed
      console.log(`[MyShares] ${message}`, ...args);
    }
  };

  // Instead of logging every render, just use debugLog 
  // Main API call handling code
  const fetchWalletBalance = async () => {
    try {
      setIsLoadingBalance(true);
      // getWalletBalance now returns a default value even on auth error
      const balanceData = await getWalletBalance();
      setUserEthBalance(balanceData.balance.eth);
    } catch (error) {
      // This will only happen for serious errors now, not 401s
      console.error('Failed to fetch wallet balance:', error);
      // Only show toast for non-auth errors
      if (!(error instanceof Error && error.message.includes('Authentication required'))) {
        toast.error("Failed to load wallet balance");
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const triggerSuccessAnimation = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleTradeClick = async (community: CommunityPortfolioItem, action: 'buy' | 'sell') => {
    console.log(`handleTradeClick called for ${community.community} with action ${action}`);
    setSelectedCommunity(community);
    setTradeAction(action);
    setTradeOpen(true);
    
    try {
      setLoadingAction(true);
      
      let precheckResult: SharePrecheckResponse | null = null;
      
      if (action === 'buy') {
        console.log(`Calling buySharesPrecheck for ${community.community}...`);
        precheckResult = await buySharesPrecheck(community.community, 1);
        console.log(`Buy precheck result:`, precheckResult);
      } else if (action === 'sell') {
        console.log(`Calling sellSharesPrecheck for ${community.community}...`);
        precheckResult = await sellSharesPrecheck(community.community, 1);
        console.log(`Sell precheck result:`, precheckResult);
      }
      
      console.log(`Precheck result for ${action}:`, precheckResult);
      setPrecheckData(precheckResult);
    } catch (error) {
      console.error(`Failed to precheck ${action}:`, error);
      toast.error(`Unable to prepare ${action} operation`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTransferClick = (community: CommunityPortfolioItem) => {
    setSelectedCommunity(community);
    setTransferOpen(true);
  };

  const handleBuySharesConfirm = async (communityName: string, quantity: number) => {
    try {
      // Set loading state FIRST, before doing anything else
      setLoadingAction(true);
      
      // Small delay to ensure state is updated before proceeding
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (!communityName) {
        throw new Error("Invalid community name");
      }
      
      if (quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }
      
      const result = await buySharesConfirm(communityName, quantity);
      
      if (result.status === 'SUCCESS') {
        // Update portfolio data in the background
        refreshPortfolio();
        fetchWalletBalance();
        
        // Success toast notification
        toast.success(`Successfully purchased ${result.shareQuantity} shares of ${communityName}`);
        
        // IMPORTANT: Keep the modal open to show success screen
        // We'll only close it after a longer delay
        
        // Close the modal after a delay to give user time to see the success screen
        setTimeout(() => {
          setTradeOpen(false);
        }, 5000);
      } else {
        toast.error(result.message || 'Transaction failed');
      }
    } catch (error) {
      toast.error('Failed to complete purchase');
    } finally {
      // Now it's safe to set loadingAction to false
      setLoadingAction(false);
    }
  };

  const handleSellSharesConfirm = async (communityName: string, quantity: number) => {
    try {
      // Set loading state FIRST, before doing anything else
      setLoadingAction(true);
      
      // Small delay to ensure state is updated before proceeding
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // This API call may take some time - during this time, the TradeSheet will show loading
      const result = await sellSharesConfirm(communityName, quantity);
      
      if (result.status === 'SUCCESS') {
        // Update portfolio data in the background
        refreshPortfolio();
        fetchWalletBalance();
        
        // Success toast notification
        toast.success(`Successfully sold ${result.soldShares} shares of ${communityName}`);
        
        // IMPORTANT: Keep the modal open to show success screen
        // We'll only close it after a longer delay
        
        // Close the modal after a delay to give user time to see the success screen
        setTimeout(() => {
          setTradeOpen(false);
        }, 5000);
      } else {
        toast.error(result.message || 'Transaction failed');
      }
    } catch (error) {
      toast.error('Failed to complete sale');
    } finally {
      // Now it's safe to set loadingAction to false
      setLoadingAction(false);
    }
  };

  const handleTransferSuccess = () => {
    // Update portfolio data
    refreshPortfolio();
    triggerSuccessAnimation();
  };

  const handleRefresh = () => {
    fetchWalletBalance();
    refreshPortfolio();
    toast.success("Refreshing portfolio data...");
  };

  const resetState = () => {
    setDepositOpen(false);
    setSendOpen(false);
    setTradeOpen(false);
    setTransferOpen(false);
    setPrecheckData(null);
  };

  const totalEthValue = portfolioSummary?.totalValueEth || 0;
  const totalUsdValue = portfolioSummary?.totalValueUsd || 0;

  // Don't log every render, it's too noisy
  
  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-10 pt-20 md:pt-16">
      <PortfolioSummary 
        ethValue={totalEthValue.toFixed(4)} 
        usdValue={totalUsdValue.toFixed(2)}
        ethBalance={userEthBalance}
        onDepositClick={() => {
          resetState();
          setDepositOpen(true);
        }}
        onSendClick={() => {
          resetState();
          setSelectedCommunity(null);
          setSendOpen(true);
        }}
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">
            My Portfolio
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
              Portfolio Value: <span className="font-semibold text-foreground">{totalEthValue.toFixed(4)} ETH</span> 
              <span className="text-xs ml-1 text-muted-foreground">(${totalUsdValue.toFixed(2)})</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="rounded-full hover:bg-primary/10"
              disabled={isRefreshing || isLoadingBalance}
            >
              {isRefreshing || isLoadingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <div className="text-sm text-muted-foreground">
              Portfolio Value: <span className="font-semibold text-foreground">{totalEthValue.toFixed(4)} ETH</span> 
              <span className="text-xs ml-1 text-muted-foreground">(${totalUsdValue.toFixed(2)})</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
            {portfolioItems.map((community) => (
              <CommunityShareCard 
                key={community.community}
                community={community}
                onBuyClick={(community) => {
                  resetState();
                  handleTradeClick(community, 'buy');
                }}
                onSellClick={(community) => {
                  resetState(); 
                  handleTradeClick(community, 'sell');
                }}
                onSendClick={(community) => {
                  resetState();
                  handleTransferClick(community);
                }}
              />
            ))}
            
            {portfolioItems.length > 0 && (
              <div 
                ref={loadMoreRef} 
                className="col-span-full flex justify-center py-4 mt-2"
              >
                {isLoading && portfolioItems.length > 0 && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                  </div>
                )}
              </div>
            )}
            
            {portfolioItems.length === 0 && !isLoading && (
              <div className="col-span-full p-8 text-center bg-muted/20 rounded-lg border border-border/40">
                <h3 className="font-medium text-lg">No shares yet</h3>
                <p className="text-muted-foreground mt-2">Once you buy shares of communities, they will appear here.</p>
              </div>
            )}
            
            {isLoading && portfolioItems.length === 0 && (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DepositSheet 
        open={depositOpen} 
        onOpenChange={setDepositOpen} 
      />

      <ETHTransferSheet
        open={sendOpen} 
        onOpenChange={setSendOpen} 
        currentBalance={userEthBalance}
        onTransferSuccess={fetchWalletBalance}
      />

      <TradeSheet 
        open={tradeOpen} 
        onOpenChange={setTradeOpen} 
        community={selectedCommunity}
        action={tradeAction}
        userEthBalance={userEthBalance || "0.000"}
        onBuyConfirm={handleBuySharesConfirm}
        onSellConfirm={handleSellSharesConfirm}
        loadingAction={loadingAction}
        precheckData={precheckData}
      />

      <ShareTransferSheet
        open={transferOpen}
        onOpenChange={setTransferOpen}
        community={selectedCommunity}
        onTransferSuccess={handleTransferSuccess}
      />
    </div>
  );
};

export default MySharesPage;
