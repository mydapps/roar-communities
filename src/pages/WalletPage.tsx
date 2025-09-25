import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  RefreshCw,
  SendHorizontal,
  Loader2,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Droplet,
  AlertTriangle,
  Wallet,
  Coins,
  Import,
  Eye,
  EyeOff,
  CreditCard,
  Zap,
  Star,
  ChevronRight,
  Copy,
  ExternalLink,
  Settings,
  Bell,
  Gift
} from 'lucide-react';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  getWalletBalance
} from '@/utils/communityApi';
import { 
  UserHolding,
  getUserHoldings,
  getPriceChange,
  PriceChangeResponse
} from '@/utils/communityTokensApi';
import { DepositSheet } from '@/components/shares/DepositSheet';
import { ETHTransferSheet } from '@/components/eth/ETHTransferSheet';
import { EthMigrationSheet } from '@/components/eth/EthMigrationSheet';
import { TokenTransferSheet } from '@/components/community-tokens/TokenTransferSheet';
import { useCommunityTokenHoldings } from '@/hooks/useCommunityTokenHoldings';
import { ScrollArea } from '@/components/ui/scroll-area';
import confetti from 'canvas-confetti';
import TradingInterface from '@/components/community-tokens/TradingInterface';

// Modern Hero Section Component
const WalletHero = ({ 
  totalValue, 
  ethBalance, 
  isLoading, 
  hideBalance, 
  setHideBalance,
  onDepositClick,
  onSendClick,
  onImportTokenClick
}: {
  totalValue: { eth: string; usd: string };
  ethBalance: string;
  isLoading: boolean;
  hideBalance: boolean;
  setHideBalance: (hide: boolean) => void;
  onDepositClick: () => void;
  onSendClick: () => void;
  onImportTokenClick: () => void;
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="relative">
      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">My Wallet</h1>
                <p className="text-white/80 text-sm">Base Network</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideBalance(!hideBalance)}
                className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0"
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={onImportTokenClick}>
                    <Import className="w-4 h-4 mr-2" />
                    Import Token
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Balance Display */}
          <div className="text-center mb-8">
            <div className="text-white/80 text-sm mb-2">Total Balance</div>
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            ) : hideBalance ? (
              <div className="text-4xl font-bold">••••••</div>
            ) : (
              <>
                <div className="text-5xl font-bold mb-2">${totalValue.usd}</div>
                <div className="text-white/80 text-lg">{totalValue.eth} ETH</div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <Button
              onClick={onDepositClick}
              className="flex-1 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-semibold rounded-2xl"
            >
              <ArrowDown className="w-5 h-5 mr-2" />
              Add Money
            </Button>
            <Button
              onClick={onSendClick}
              className="flex-1 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-semibold rounded-2xl"
            >
              <SendHorizontal className="w-5 h-5 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>


    </div>
  );
};

// Modern Asset Card Component
const AssetCard = ({ 
  asset, 
  hideBalance, 
  onTradeClick,
  onSendClick 
}: {
  asset: {
    name: string;
    symbol: string;
    balance: string;
    value: string;
    change: string;
    icon?: string;
    color?: string;
    type?: "eth" | "token";
    token?: UserHolding;
  };
  hideBalance: boolean;
  onTradeClick: (action: 'buy' | 'sell') => void;
  onSendClick: () => void;
}) => {
  const navigate = useNavigate();
  const isPositive = asset.change.startsWith('+');
  const isCommunityToken = asset.type === 'token' && asset.token?.ticker;
  
  const handleCommunityClick = () => {
    if (isCommunityToken && asset.token?.ticker) {
      navigate(`/c/${asset.token.ticker}`);
    }
  };
  
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-background to-muted/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${asset.color || 'bg-gradient-to-br from-blue-500 to-purple-600'} ${isCommunityToken ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
              onClick={isCommunityToken ? handleCommunityClick : undefined}
            >
              {asset.icon ? (
                <img src={asset.icon} alt={asset.symbol} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 
                  className={`font-bold text-lg ${isCommunityToken ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                  onClick={isCommunityToken ? handleCommunityClick : undefined}
                >
                  {asset.name}
                </h3>
                <span className="px-2 py-0.5 bg-muted rounded-md text-xs font-medium text-muted-foreground">
                  {asset.symbol}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {asset.symbol === 'ETH' ? 'Ethereum' : 'Community Token'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-xl">
              {hideBalance ? "••••••" : asset.value}
            </div>
            <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {hideBalance ? "••••••" : asset.change}
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-2xl font-bold mb-1">
            {hideBalance ? "••••••" : asset.balance}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onTradeClick('buy')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-11"
          >
            <Plus className="w-4 h-4 mr-1" />
            {asset.symbol === 'ETH' ? 'Deposit' : 'Buy'}
          </Button>
          <Button
            onClick={() => onTradeClick('sell')}
            variant="outline"
            className="flex-1 border-2 rounded-xl h-11"
          >
            <Minus className="w-4 h-4 mr-1" />
            Sell
          </Button>
          <Button
            onClick={onSendClick}
            variant="outline"
            className="flex-1 border-2 rounded-xl h-11"
          >
            <SendHorizontal className="w-4 h-4 mr-1" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};




// Define interfaces for the new API responses
interface EthMigrationCheckResponse {
  success: boolean;
  ethereumBalance: string;
  baseBalance: string;
  address: string;
  canMigrate: boolean;
  migrationAmount?: string;
  estimatedGasFee?: string;
  reason?: string | null;
  chainId?: number;
  message?: string;
}

const WalletPage = () => {
  const navigate = useNavigate();
  const [depositOpen, setDepositOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferToken, setTransferToken] = useState<UserHolding | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [importTokenOpen, setImportTokenOpen] = useState(false);
  const [priceChanges, setPriceChanges] = useState<Record<string, number>>({});

  const isMobile = useIsMobile();
  
  // Trading modal state
  const [tradingModal, setTradingModal] = useState<{
    isOpen: boolean;
    token: any;
    mode: 'buy' | 'sell';
  }>({
    isOpen: false,
    token: null,
    mode: 'buy'
  });

  // ETH Migration State
  const [migrationCheckData, setMigrationCheckData] = useState<EthMigrationCheckResponse | null>(null);
  const [isLoadingMigrationCheck, setIsLoadingMigrationCheck] = useState(false);
  const [migrationCheckError, setMigrationCheckError] = useState<string | null>(null);
  const [isMigrationSheetOpen, setIsMigrationSheetOpen] = useState(false);

  const {
    holdings,
    portfolio,
    isLoading,
    isRefreshing,
    refreshHoldings,
    loadMoreRef
  } = useCommunityTokenHoldings();

  useEffect(() => {
    setIsLoadingBalance(true);
    fetchWalletBalance()
      .catch((err) => console.error("Initial balance load error:", err))
      .finally(() => {
        setIsLoadingBalance(false);
      });

    fetchEthMigrationStatus();
  }, []);

  const fetchWalletBalance = async (forceRefresh = false) => {
    try {
      setIsLoadingBalance(true);
      const balanceData = await getWalletBalance(forceRefresh);
      setUserEthBalance(balanceData.balance.eth);
      return balanceData;
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      if (!(error instanceof Error && error.message.includes('Authentication required'))) {
      toast.error("Failed to load wallet balance");
      }
      throw error;
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchEthMigrationStatus = async () => {
    setIsLoadingMigrationCheck(true);
    setMigrationCheckError(null);
    try {
      const response = await fetch("/api/check_eth_migration");
      const data: EthMigrationCheckResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to check ETH migration status");
      }
      
      if (data.success) {
        setMigrationCheckData(data);
      } else {
        setMigrationCheckError(data.message || "Could not retrieve migration status.");
      }
    } catch (error: any) {
      console.error("Fetch ETH migration status error:", error);
      setMigrationCheckError(error.message || "An error occurred while checking migration status.");
    } finally {
      setIsLoadingMigrationCheck(false);
    }
  };

  const fetchPriceChanges = async (tokens: UserHolding[]) => {
    try {
      const priceChangePromises = tokens.map(async (token) => {
        try {
          const priceChangeData = await getPriceChange(token.ticker);
          if (priceChangeData.success && priceChangeData.data) {
            return {
              ticker: token.ticker,
              change: priceChangeData.data.price_changes['1d'].change_percent_usd
            };
          }
          return { ticker: token.ticker, change: 0 };
        } catch (error) {
          console.error(`Failed to fetch price change for ${token.ticker}:`, error);
          return { ticker: token.ticker, change: 0 };
        }
      });

      const results = await Promise.all(priceChangePromises);
      const priceChangeMap: Record<string, number> = {};
      
      results.forEach(result => {
        priceChangeMap[result.ticker] = result.change;
      });
      
      setPriceChanges(priceChangeMap);
    } catch (error) {
      console.error('Failed to fetch price changes:', error);
    }
  };

  const handleRefresh = () => {
    fetchWalletBalance(true);
    refreshHoldings();
    fetchEthMigrationStatus();
    toast.success("Refreshing wallet data...");
  };

  // Fetch price changes when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      fetchPriceChanges(holdings);
    }
  }, [holdings]);

  const handleTradeClick = (community: any, action: 'buy' | 'sell') => {
    setTradingModal({
      isOpen: true,
      token: {
        name: community.community,
        symbol: community.community.toUpperCase(),
        image: community.image,
        currentPrice: community.value.eth / community.shares,
        id: community.community
      },
      mode: action
    });
  };

  const totalEthValue = portfolio?.totalCurrentValueEth || 0;
  const totalUsdValue = (portfolio?.totalCurrentValueEth || 0) * 2500; // Convert ETH to USD
  
  // Calculate total value including ETH balance
  const totalEthWithBalance = totalEthValue + parseFloat(userEthBalance || "0");
  const totalUsdWithBalance = totalUsdValue + (parseFloat(userEthBalance || "0") * 3000);

  // Assets data with community tokens
  type AssetType = {
    name: string;
    symbol: string;
    balance: string;
    value: string;
    change: string;
    color: string;
    type: "eth" | "token";
    token?: UserHolding;
    graduated?: boolean;
    icon?: string; // Add icon property for token images
  };

  const assets: AssetType[] = [
    {
      name: "Ethereum",
      symbol: "ETH",
      balance: `${userEthBalance} ETH`,
      value: `$${(parseFloat(userEthBalance) * 3000).toFixed(2)}`,
      change: "+2.4%",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      type: "eth"
    },
    ...holdings.map(token => {
      // Use profitLossPercent from API instead of calculated value
      const changeText = token.profitLossPercent === 0 
        ? "0.0%" 
        : token.profitLossPercent > 0 
          ? `+${token.profitLossPercent.toFixed(1)}%` 
          : `${token.profitLossPercent.toFixed(1)}%`;
      
      return {
        name: token.givenName || token.name,
        symbol: token.ticker,
        balance: `${token.balance.toLocaleString()} ${token.ticker}`,
        value: `$${token.currentValueUsd.toFixed(2)}`, // Use currentValueUsd from API
        change: changeText,
        color: "bg-gradient-to-br from-purple-500 to-pink-600",
        type: "token" as const,
        token: token,
        graduated: token.graduated,
        icon: token.image // Add the token image as icon
      };
    })
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <WalletHero
          totalValue={{
            eth: totalEthWithBalance.toFixed(4),
            usd: totalUsdWithBalance.toFixed(2)
          }}
          ethBalance={userEthBalance}
          isLoading={isLoadingBalance}
          hideBalance={hideBalance}
          setHideBalance={setHideBalance}
          onDepositClick={() => setDepositOpen(true)}
          onSendClick={() => setSendOpen(true)}
          onImportTokenClick={() => setImportTokenOpen(true)}
        />

        {/* ETH Migration Alert */}
        {migrationCheckData?.canMigrate && parseFloat(migrationCheckData.ethereumBalance) > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    ETH Available on Ethereum
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    You have {migrationCheckData.ethereumBalance} ETH on Ethereum. Transfer to Base for lower fees.
                  </p>
        <Button
          size="sm"
                    className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => setIsMigrationSheetOpen(true)}
                  >
                    Transfer Now
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assets Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Assets</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-full"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
        </div>
        
          {assets.length > 0 ? (
              <div className="space-y-4">
              {assets.map((asset, index) => (
                <AssetCard
                  key={index}
                  asset={asset}
                  hideBalance={hideBalance}
                  onTradeClick={(action) => {
                    if (asset.symbol === 'ETH') {
                      if (action === 'buy') {
                        setDepositOpen(true);
                      } else {
                        setSendOpen(true);
                      }
                    } else {
                      // Handle community token trading
                      if (asset.type === 'token' && asset.token) {
                        setTradingModal({
                          isOpen: true,
                          token: {
                            id: parseInt(asset.token.ticker.replace(/[^0-9]/g, '') || '0'),
                            name: asset.token.givenName || asset.token.name,
                            symbol: asset.token.ticker,
                            ticker: asset.token.ticker,
                            description: `${asset.token.givenName || asset.token.name} community token`,
                            avatar: asset.token.image || asset.token.ticker.charAt(0),
                            image: asset.token.image,
                            status: asset.token.graduated ? 'graduated' : 'incubation',
                            graduated: asset.token.graduated,
                            price: asset.token.currentRate,
                            currentPrice: asset.token.currentRate,
                            marketCap: asset.token.marketCap,
                            holders: asset.token.totalHolders,
                            volume24h: asset.token.volume24h,
                            priceChange24h: asset.token.profitLossPercent,
                            rewardPool: 0, // Not available in holdings API
                            timeLeft: 0, // Not applicable for wallet trades
                            totalSupply: 1000000000, // 1 billion standard
                            userHoldings: asset.token.balance
                          },
                          mode: action
                        });
                      }
                    }
                  }}
                  onSendClick={() => {
                    if (asset.symbol === 'ETH') {
                      setSendOpen(true);
                    } else if (asset.type === 'token' && asset.token) {
                      // Handle community token sending
                      setTransferToken(asset.token);
                      setTransferOpen(true);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-12 text-center">
                <Coins className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold text-lg mb-2">Start Building Your Token Portfolio</h3>
                <p className="text-muted-foreground mb-6">
                  Discover and invest in community tokens. Support creators and earn rewards.
                </p>
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  onClick={() => navigate('/community_tokens')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Explore Community Tokens
                </Button>
              </CardContent>
            </Card>
                    )}
                  </div>

                </div>
                
      {/* Sheets and Modals */}
      <DepositSheet 
        open={depositOpen} 
        onOpenChange={setDepositOpen}
      />

      <ETHTransferSheet
        open={sendOpen} 
        onOpenChange={setSendOpen} 
        currentBalance={userEthBalance}
        onTransferSuccess={() => fetchWalletBalance(true)}
      />

      {transferToken && (
        <TokenTransferSheet
          isOpen={transferOpen}
          onClose={() => {
            setTransferOpen(false);
            setTransferToken(null);
          }}
          token={transferToken}
          onTransferComplete={() => {
            refreshHoldings();
            setTransferOpen(false);
            setTransferToken(null);
          }}
        />
      )}

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

      <TradingInterface
        isOpen={tradingModal.isOpen}
        onClose={() => setTradingModal({ isOpen: false, token: null, mode: 'buy' })}
        token={tradingModal.token}
        mode={tradingModal.mode}
        userEthBalance={userEthBalance}
        onTradeComplete={() => {
          // Refresh holdings and close modal - this will be called after user dismisses animation
          refreshHoldings();
          setTradingModal({ isOpen: false, token: null, mode: 'buy' });
        }}
      />

      {/* Import Token Modal */}
      <Dialog open={importTokenOpen} onOpenChange={setImportTokenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Import className="w-5 h-5" />
              Import Custom Token
            </DialogTitle>
            <DialogDescription>
              Add any ERC-20 token to your wallet by providing its contract address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">How it works</h4>
                  <p className="text-sm text-muted-foreground">Paste any ERC-20 contract address</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Automatically detects token name and symbol
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Shows your current balance
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Enables trading and sending
                </li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportTokenOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => {
                toast.info("Token import feature coming soon!");
                setImportTokenOpen(false);
              }} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Import Token
              </Button>
        </div>
      </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default WalletPage; 