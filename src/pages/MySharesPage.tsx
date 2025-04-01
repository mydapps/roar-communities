
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
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { getWalletBalance, CommunityPortfolioItem } from '@/utils/communityApi';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PortfolioSummary } from '@/components/shares/PortfolioSummary';
import { DepositSheet } from '@/components/shares/DepositSheet';
import { SendSheet } from '@/components/shares/SendSheet';
import { TradeSheet } from '@/components/shares/TradeSheet';
import { CommunityShareCard } from '@/components/shares/CommunityShareCard';
import { usePortfolio } from '@/hooks/usePortfolio';
import { ScrollArea } from '@/components/ui/scroll-area';

const MySharesPage = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityPortfolioItem | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell' | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const { toast } = useToast();
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
      setUserEthBalance(balanceData.balance.eth);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load wallet balance"
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleTradeClick = (community: CommunityPortfolioItem, action: 'buy' | 'sell') => {
    setSelectedCommunity(community);
    setTradeAction(action);
    setTradeOpen(true);
  };

  const handleRefresh = () => {
    fetchWalletBalance();
    refreshPortfolio();
    toast({
      title: "Refreshing",
      description: "Fetching latest portfolio data...",
    });
  };

  const resetState = () => {
    // Reset all state to prevent UI getting stuck
    setDepositOpen(false);
    setSendOpen(false);
    setTradeOpen(false);
    setDrawerOpen(false);
  };

  // Format portfolio value for display
  const totalEthValue = portfolioSummary?.total_value_eth || 0;
  const totalUsdValue = portfolioSummary?.total_value_usd || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-10">
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
          
          <ScrollArea className="max-h-[calc(100vh-300px)] md:max-h-none">
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
              
              {/* Loading indicator and load more trigger */}
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
              
              {/* Empty state */}
              {portfolioItems.length === 0 && !isLoading && (
                <div className="col-span-full p-8 text-center bg-muted/20 rounded-lg border border-border/40">
                  <h3 className="font-medium text-lg">No shares yet</h3>
                  <p className="text-muted-foreground mt-2">Once you buy shares of communities, they will appear here.</p>
                </div>
              )}
              
              {/* Initial loading state */}
              {isLoading && portfolioItems.length === 0 && (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Mobile: Use Drawer components for all actions */}
      {isMobile ? (
        <>
          {/* Deposit ETH Sheet for Mobile */}
          <DepositSheet 
            open={depositOpen} 
            onOpenChange={setDepositOpen} 
          />

          {/* Send ETH/Shares Drawer for Mobile */}
          <Drawer open={sendOpen} onOpenChange={setSendOpen}>
            <DrawerContent className="max-h-[85vh] overflow-y-auto">
              <DrawerHeader>
                <DrawerTitle>{!selectedCommunity ? 'Send ETH' : `Send ${selectedCommunity.community} Shares`}</DrawerTitle>
                <DrawerDescription>
                  {!selectedCommunity 
                    ? 'Send ETH to another wallet address' 
                    : `Send your ${selectedCommunity.community} shares to another user`}
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="px-4 py-4 flex-1 overflow-y-auto">
                <SendSheet 
                  open={true}
                  onOpenChange={() => setSendOpen(false)}
                  community={selectedCommunity}
                  isEthSend={!selectedCommunity}
                  isEmbedded={true}
                />
              </div>
            </DrawerContent>
          </Drawer>

          {/* Trade (Buy/Sell) Drawer for Mobile */}
          <Drawer open={tradeOpen} onOpenChange={setTradeOpen}>
            <DrawerContent className="max-h-[85vh] overflow-y-auto">
              <DrawerHeader>
                <DrawerTitle>{tradeAction === 'buy' ? 'Buy Shares' : 'Sell Shares'}</DrawerTitle>
                <DrawerDescription>
                  {tradeAction === 'buy' 
                    ? `Purchase shares of ${selectedCommunity?.community}` 
                    : `Sell your ${selectedCommunity?.community} shares`}
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="px-4 py-4 flex-1 overflow-y-auto">
                <TradeSheet 
                  open={true}
                  onOpenChange={() => setTradeOpen(false)}
                  community={selectedCommunity}
                  action={tradeAction}
                  userEthBalance={userEthBalance}
                  isEmbedded={true}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <>
          {/* Desktop: Use Sheet components with right-side opening */}
          
          {/* Deposit ETH Sheet for Desktop */}
          <DepositSheet 
            open={depositOpen} 
            onOpenChange={setDepositOpen} 
          />

          {/* Send ETH/Shares Sheet for Desktop */}
          <SendSheet 
            open={sendOpen} 
            onOpenChange={setSendOpen} 
            community={selectedCommunity}
            isEthSend={!selectedCommunity}
          />

          {/* Trade (Buy/Sell) Sheet for Desktop */}
          <TradeSheet 
            open={tradeOpen} 
            onOpenChange={setTradeOpen} 
            community={selectedCommunity}
            action={tradeAction}
            userEthBalance={userEthBalance}
          />
        </>
      )}

      {/* Community details drawer - mobile only */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Community Share Details</DrawerTitle>
            <DrawerDescription>
              View detailed information about your shares
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            {selectedCommunity && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedCommunity.image} alt={selectedCommunity.community} />
                    <AvatarFallback>{selectedCommunity.community.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{selectedCommunity.community}</h3>
                    <p className="text-muted-foreground">
                      Current Price: {selectedCommunity.price?.eth?.toFixed(6) || '0.000000'} ETH
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Shares Owned</p>
                    <p className="text-2xl font-bold">{selectedCommunity.shares}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">{selectedCommunity.value?.eth?.toFixed(4) || '0.0000'} ETH</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button className="flex-1 gap-2" onClick={() => handleTradeClick(selectedCommunity, 'buy')}>
                    <Plus className="h-4 w-4" />
                    Buy More
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 text-red-600 hover:text-red-700" onClick={() => handleTradeClick(selectedCommunity, 'sell')}>
                    <Minus className="h-4 w-4" />
                    Sell
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MySharesPage;
