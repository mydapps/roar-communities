
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
import { SendSheet } from '@/components/shares/SendSheet';
import { TradeSheet } from '@/components/shares/TradeSheet';
import { CommunityShareCard } from '@/components/shares/CommunityShareCard';
import { usePortfolio } from '@/hooks/usePortfolio';
import { ScrollArea } from '@/components/ui/scroll-area';
import confetti from 'canvas-confetti';

const MySharesPage = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
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

  const fetchWalletBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const balanceData = await getWalletBalance();
      console.log('Wallet balance data:', balanceData);
      setUserEthBalance(balanceData.balance.eth);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      toast.error("Failed to load wallet balance");
      setUserEthBalance("0.000");
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
    setSelectedCommunity(community);
    setTradeAction(action);
    setTradeOpen(true);
    
    try {
      setLoadingAction(true);
      
      let precheckResult: SharePrecheckResponse | null = null;
      
      if (action === 'buy') {
        precheckResult = await buySharesPrecheck(community.community, 1);
        console.log(`Buy precheck result:`, precheckResult);
      } else if (action === 'sell') {
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

  const handleBuySharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setLoadingAction(true);
      console.log(`Confirming buy of ${quantity} shares for ${communityName}`);
      console.log(`User ETH balance before purchase: ${userEthBalance}`);
      
      // Add additional validation
      if (!communityName) {
        console.error("Community name is empty in handleBuySharesConfirm");
        throw new Error("Invalid community name");
      }
      
      if (quantity <= 0) {
        console.error(`Invalid quantity (${quantity}) in handleBuySharesConfirm`);
        throw new Error("Quantity must be greater than 0");
      }
      
      const result = await buySharesConfirm(communityName, quantity);
      console.log('Buy shares confirmation result:', result);
      
      if (result.status === 'SUCCESS') {
        triggerSuccessAnimation();
        toast.success(`Successfully purchased ${result.shareQuantity} shares of ${communityName}`);
        refreshPortfolio();
        fetchWalletBalance();
        setTradeOpen(false);
      } else {
        console.error('Buy shares failed with status:', result.status);
        console.error('Error message:', result.message || 'Unknown error');
        toast.error(result.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Buy shares error:', error);
      toast.error('Failed to complete purchase');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSellSharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setLoadingAction(true);
      console.log(`Confirming sell of ${quantity} shares for ${communityName}`);
      const result = await sellSharesConfirm(communityName, quantity);
      console.log('Sell shares confirmation result:', result);
      
      if (result.status === 'SUCCESS') {
        triggerSuccessAnimation();
        toast.success(`Successfully sold ${result.soldShares} shares of ${communityName}`);
        refreshPortfolio();
        fetchWalletBalance();
        setTradeOpen(false);
      } else {
        console.error('Sell shares failed with status:', result.status);
        console.error('Error message:', result.message || 'Unknown error');
        toast.error(result.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Sell shares error:', error);
      toast.error('Failed to complete sale');
    } finally {
      setLoadingAction(false);
    }
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
    setPrecheckData(null);
  };

  const totalEthValue = portfolioSummary?.totalValueEth || 0;
  const totalUsdValue = portfolioSummary?.totalValueUsd || 0;

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
                  setSelectedCommunity(community);
                  setSendOpen(true);
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

      <SendSheet 
        open={sendOpen} 
        onOpenChange={setSendOpen} 
        community={selectedCommunity}
        isEthSend={!selectedCommunity}
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
    </div>
  );
};

export default MySharesPage;
