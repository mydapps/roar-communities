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
  Minus,
  Droplet,
  AlertTriangle
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
import { EthMigrationSheet } from '@/components/eth/EthMigrationSheet';
import { usePortfolio } from '@/hooks/usePortfolio';
import { ScrollArea } from '@/components/ui/scroll-area';
import confetti from 'canvas-confetti';

// Define interfaces for the new API responses
interface EthMigrationCheckResponse {
  success: boolean;
  ethereumBalance: string;
  baseBalance: string;
  address: string;
  canMigrate: boolean;
  migrationAmount?: string; // Optional based on API, make sure to handle if null
  estimatedGasFee?: string; // Optional
  reason?: string | null;
  chainId?: number;
  message?: string; // For error cases
}

const MySharesPage = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityPortfolioItem | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell' | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [precheckData, setPrecheckData] = useState<SharePrecheckResponse | null>(null);
  const isMobile = useIsMobile();

  // --- ETH Migration State ---
  const [migrationCheckData, setMigrationCheckData] = useState<EthMigrationCheckResponse | null>(null);
  const [isLoadingMigrationCheck, setIsLoadingMigrationCheck] = useState(false);
  const [migrationCheckError, setMigrationCheckError] = useState<string | null>(null);
  const [isMigrationSheetOpen, setIsMigrationSheetOpen] = useState(false);
  // We will add more state for the sheet itself (fee estimate, migration execution) later

  const {
    portfolioItems,
    portfolioSummary,
    isLoading,
    isRefreshing,
    refreshPortfolio,
    loadMoreRef
  } = usePortfolio();

  // Lazy load wallet balance after component mounts
  useEffect(() => {
    // Mark as loading immediately
    setIsLoadingBalance(true);
    
    // Use a more immediate approach to fetch balance
    fetchWalletBalance()
      .catch((err) => console.error("Initial balance load error:", err))
      .finally(() => {
        // Always mark as not loading when finished
        setIsLoadingBalance(false);
      });

    // Fetch ETH migration status
    fetchEthMigrationStatus();
  }, []);

  // Development-only logging helper
  const debugLog = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable dev logs when needed
      console.log(`[MyShares] ${message}`, ...args);
    }
  };

  // Main API call handling code
  const fetchWalletBalance = async (forceRefresh = false) => {
    try {
      setIsLoadingBalance(true);
      // getWalletBalance now returns a default value even on auth error
      const balanceData = await getWalletBalance(forceRefresh);
      setUserEthBalance(balanceData.balance.eth);
      return balanceData;
    } catch (error) {
      // This will only happen for serious errors now, not 401s
      console.error('Failed to fetch wallet balance:', error);
      // Only show toast for non-auth errors
      if (!(error instanceof Error && error.message.includes('Authentication required'))) {
        toast.error("Failed to load wallet balance");
      }
      throw error; // Re-throw so we can handle in callers if needed
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

  const handleTradeClick = (community: CommunityPortfolioItem, action: 'buy' | 'sell') => {
    // Reset state before opening the trade sheet
    resetState();
    
    // Set new values
    setSelectedCommunity(community);
    setTradeAction(action);
    setTradeOpen(true);
    
    // Fetch fresh balance data with force refresh
    fetchWalletBalance(true);
  };

  const handleTransferClick = (community: CommunityPortfolioItem) => {
    setSelectedCommunity(community);
    setTransferOpen(true);
  };

  const handleBuySharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setLoadingAction(true);
      const result = await buySharesConfirm(communityName, quantity);
      
      if (result && result.status === 'SUCCESS') {
        toast.success('Successfully purchased shares!');
        refreshPortfolio();
        fetchWalletBalance(true); // Force refresh balance
        
        // IMPORTANT FIX: Set loading to false AFTER a slight delay
        // This allows the success screen to display properly
        setTimeout(() => {
          setLoadingAction(false);
        }, 300);
        
        // Add delay before closing to show success state
        setTimeout(() => {
          setTradeOpen(false);
          
          // Important: Reset state after the modal is closed
          setTimeout(() => {
            resetState();
          }, 300);
        }, 7000); // Extended to 7 seconds for better visibility
      } else {
        // Set loading to false immediately for error cases
        setLoadingAction(false);
        toast.error(result?.message || 'Failed to purchase shares');
      }
    } catch (error) {
      setLoadingAction(false);
      toast.error('An error occurred while purchasing shares');
    }
  };

  const handleSellSharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setLoadingAction(true);
      const result = await sellSharesConfirm(communityName, quantity);
      
      if (result && result.status === 'SUCCESS') {
        toast.success('Successfully sold shares!');
        refreshPortfolio();
        fetchWalletBalance(true); // Force refresh balance
        
        // IMPORTANT FIX: Set loading to false AFTER a slight delay
        // This allows the success screen to display properly
        setTimeout(() => {
          setLoadingAction(false);
        }, 300);
        
        // Add delay before closing to show success state
        setTimeout(() => {
          setTradeOpen(false);
          
          // Important: Reset state after the modal is closed
          setTimeout(() => {
            resetState();
          }, 300);
        }, 7000); // Extended to 7 seconds for better visibility
      } else {
        // Set loading to false immediately for error cases
        setLoadingAction(false);
        toast.error(result?.message || 'Failed to sell shares');
      }
    } catch (error) {
      setLoadingAction(false);
      toast.error('An error occurred while selling shares');
    }
  };

  const handleTransferSuccess = () => {
    // Update portfolio data
    refreshPortfolio();
    triggerSuccessAnimation();
  };

  const handleRefresh = () => {
    // Force refresh the wallet balance
    fetchWalletBalance(true);
    refreshPortfolio();
    // Also refresh migration status
    fetchEthMigrationStatus();
    toast.success("Refreshing portfolio, balance, and migration status...");
  };

  // --- ETH Migration Functions ---
  const fetchEthMigrationStatus = async () => {
    setIsLoadingMigrationCheck(true);
    setMigrationCheckError(null);
    try {
      // Assuming apiBase.get can handle this or we use fetch directly
      const response = await fetch("/api/check_eth_migration");
      const data: EthMigrationCheckResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to check ETH migration status");
      }
      
      if (data.success) {
        setMigrationCheckData(data);
        if (data.canMigrate && parseFloat(data.ethereumBalance) > 0) {
          // Optional: toast only if there's something actionable
          // toast.info("Potential ETH on Ethereum network detected."); 
        }
      } else {
        // Handle cases where data.success is false but response was ok (e.g. API handled error)
        setMigrationCheckError(data.message || "Could not retrieve migration status.");
      }
    } catch (error: any) {
      console.error("Fetch ETH migration status error:", error);
      setMigrationCheckError(error.message || "An error occurred while checking migration status.");
      // Don't toast an error here generally unless it's critical, 
      // as this check runs in the background. The UI will show the prompt if needed.
    } finally {
      setIsLoadingMigrationCheck(false);
    }
  };

  const resetState = () => {
    // Close any open dialogs
    setDepositOpen(false);
    setSendOpen(false);
    setTransferOpen(false);
    
    // Reset state relevant to trading
    setSelectedCommunity(null);
    setTradeAction(null);
    setPrecheckData(null);
    setLoadingAction(false);
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
        isLoadingBalance={isLoadingBalance}
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

      {/* --- ETH Migration Prompt --- */}
      {migrationCheckData?.canMigrate && parseFloat(migrationCheckData.ethereumBalance) > 0 && (
        <Card className="border-yellow-500/70 bg-yellow-500/5 shadow-md animate-fade-in mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    ETH Detected on Ethereum Network
                  </h3>
                  <p className="text-sm text-yellow-700/90 mt-1">
                    It appears you have {migrationCheckData.ethereumBalance} ETH on the Ethereum mainnet. 
                    This wallet address is primarily for the Base network. Would you like to transfer these funds to Base?
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 border-yellow-500/50 hover:border-yellow-500/70 w-full sm:w-auto flex-shrink-0 gap-2"
                onClick={() => setIsMigrationSheetOpen(true)}
              >
                <Droplet className="h-4 w-4" /> 
                Transfer ETH to Base
              </Button>
            </div>
            {migrationCheckError && (
                <p className="text-xs text-red-600 mt-2 pl-9">Error checking migration status: {migrationCheckError}</p>
            )}
          </CardContent>
        </Card>
      )}
      {/* --- End ETH Migration Prompt --- */}
      
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
        onTransferSuccess={() => fetchWalletBalance(true) }
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

      <EthMigrationSheet
        open={isMigrationSheetOpen}
        onOpenChange={setIsMigrationSheetOpen}
        initialMigrationData={migrationCheckData}
        onMigrationSuccess={() => {
          toast.success('Migration successful! Refreshing data...');
          fetchWalletBalance(true);
          fetchEthMigrationStatus();
          setIsMigrationSheetOpen(false);
        }}
      />
    </div>
  );
};

export default MySharesPage;
