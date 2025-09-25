import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown,
  Activity,
  Users,
  DollarSign,
  Clock,
  Target,
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import SimplePriceChart from './SimplePriceChart';
import { getRecentTrades, RecentTradesResponse, getPriceChange, PriceChangeResponse } from '@/utils/communityTokensApi';

interface TokenData {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  status: 'incubation' | 'graduated';
  timeLeft: number;
  totalSupply: number;
  circulatingSupply: number;
  buyPressure?: number;
  tokenAddress?: string;
  volumeAnalysis?: {
    buyVolumeEth: number;
    sellVolumeEth: number;
    totalVolumeEth: number;
    buyVolumeUsd: number;
    sellVolumeUsd: number;
    totalVolumeUsd: number;
    buyPercentage: number;
    sellPercentage: number;
    buyCount: number;
    sellCount: number;
    totalTrades: number;
  };
  recentTrades: Array<{
    id: number;
    user: string;
    action: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: Date;
    value: number;
  }>;
  priceHistory: Array<{
    time: Date;
    price: number;
    volume: number;
  }>;
}

interface CommunityData {
  id: string;
  name: string;
  image?: string;
}

interface CommunityTokenAnalyticsProps {
  tokenData: TokenData;
  community: CommunityData;
  onTrade: (action: 'buy' | 'sell') => void;
}

const CommunityTokenAnalytics: React.FC<CommunityTokenAnalyticsProps> = ({
  tokenData,
  community,
  onTrade
}) => {
  const [activeChart, setActiveChart] = useState<'price' | 'volume'>('price');
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [priceChanges, setPriceChanges] = useState<PriceChangeResponse['data'] | null>(null);
  const [priceChangesLoading, setPriceChangesLoading] = useState(false);

  // Helper function to format very small prices with proper subscript notation
  const formatSmallPrice = (price: number): { formatted: string; hasSubscript: boolean; subscriptCount: number; mainDigits: string; jsx?: React.ReactNode } => {
    if (price === 0) return { formatted: '0.00', hasSubscript: false, subscriptCount: 0, mainDigits: '0.00' };
    
    const priceStr = price.toFixed(20); // Get enough decimal places
    const match = priceStr.match(/^0\.0*([1-9]\d*)/);
    
    if (!match) return { formatted: price.toFixed(4), hasSubscript: false, subscriptCount: 0, mainDigits: price.toFixed(4) };
    
    const decimalPart = priceStr.split('.')[1];
    const leadingZeros = decimalPart.match(/^0*/)?.[0].length || 0;
    
    // Only use subscript notation if there are 4 or more leading zeros
    if (leadingZeros >= 4) {
      const significantDigits = match[1].substring(0, 3); // Take first 3 significant digits
      
      // Convert number to subscript characters
      const subscriptMap: { [key: string]: string } = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
      };
      const subscriptNumber = leadingZeros.toString().split('').map(digit => subscriptMap[digit]).join('');
      
      return {
        formatted: `0.0${subscriptNumber}${significantDigits}`,
        hasSubscript: true,
        subscriptCount: leadingZeros,
        mainDigits: significantDigits,
        jsx: (
          <span>
            0.0<span className="font-bold text-sm align-sub">{subscriptNumber}</span>{significantDigits}
          </span>
        )
      };
    }
    
    return { formatted: price.toFixed(6), hasSubscript: false, subscriptCount: 0, mainDigits: price.toFixed(6) };
  };

  const formatPrice = (price: number) => {
    if (price == null || isNaN(price)) {
      return '0.00';
    }
    const result = formatSmallPrice(price);
    return result.jsx || result.formatted;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  // Calculate some analytics
  const buyTrades = tokenData.recentTrades.filter(t => t.action === 'buy');
  const sellTrades = tokenData.recentTrades.filter(t => t.action === 'sell');
  const buyVolume = buyTrades.reduce((sum, t) => sum + (t.amount * t.price), 0);
  const sellVolume = sellTrades.reduce((sum, t) => sum + (t.amount * t.price), 0);
  // Use real buy pressure from API if available, otherwise calculate from trades
  const buyPressure = tokenData.volumeAnalysis?.buyPercentage !== undefined ? 
    tokenData.volumeAnalysis.buyPercentage :
    (tokenData.buyPressure !== undefined ? tokenData.buyPressure : 
      (buyVolume + sellVolume > 0 ? (buyVolume / (buyVolume + sellVolume) * 100) : 50));

  // Fetch recent trades
  useEffect(() => {
    const fetchTrades = async () => {
      if (!tokenData.symbol) return;
      
      // Ensure ticker is a string
      const ticker = typeof tokenData.symbol === 'string' ? tokenData.symbol : String(tokenData.symbol);
      if (!ticker || ticker === 'undefined' || ticker === '[object Object]') {
        console.error('Invalid ticker for recent trades:', tokenData.symbol);
        return;
      }
      
      setTradesLoading(true);
      try {
        const response = await getRecentTrades(ticker, 1, 10);
        if (response.success && response.data?.trades) {
          setRecentTrades(response.data.trades);
        }
      } catch (error) {
        console.error('Error fetching recent trades:', error);
      } finally {
        setTradesLoading(false);
      }
    };

    fetchTrades();
  }, [tokenData.symbol]);

  // Fetch price changes when component mounts or ticker changes
  useEffect(() => {
    const fetchPriceChanges = async () => {
      if (!tokenData.symbol) return;
      
      // Ensure ticker is a string
      const ticker = typeof tokenData.symbol === 'string' ? tokenData.symbol : String(tokenData.symbol);
      if (!ticker || ticker === 'undefined' || ticker === '[object Object]') {
        console.error('Invalid ticker for price changes:', tokenData.symbol);
        return;
      }
      
      setPriceChangesLoading(true);
      try {
        const response = await getPriceChange(ticker);
        if (response.success && response.data) {
          setPriceChanges(response.data);
        }
      } catch (error) {
        console.error('Error fetching price changes:', error);
      } finally {
        setPriceChangesLoading(false);
      }
    };

    fetchPriceChanges();
  }, [tokenData.symbol]);

  // Mock chart data (in a real app, this would come from an API)
  const chartData = tokenData.priceHistory.slice(-24); // Last 24 hours

  return (
    <div className="space-y-6">
      {/* Price Change Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 15m Price Change */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">15m</p>
                {priceChangesLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-lg font-bold">--</p>
                  </div>
                ) : (
                  <p className={`text-lg font-bold ${
                    (priceChanges?.price_changes['15m']?.change_percent_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceChanges?.price_changes['15m']?.change_percent_usd !== null 
                      ? `${(priceChanges?.price_changes['15m']?.change_percent_usd || 0).toFixed(2)}%`
                      : 'N/A'
                    }
                  </p>
                )}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                (priceChanges?.price_changes['15m']?.change_percent_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(priceChanges?.price_changes['15m']?.change_percent_usd || 0) >= 0 ? 
                  <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1h Price Change */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">1h</p>
                {priceChangesLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-lg font-bold">--</p>
                  </div>
                ) : (
                  <p className={`text-lg font-bold ${
                    (priceChanges?.price_changes['1h']?.change_percent_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceChanges?.price_changes['1h']?.change_percent_usd !== null 
                      ? `${(priceChanges?.price_changes['1h']?.change_percent_usd || 0).toFixed(2)}%`
                      : 'N/A'
                    }
                  </p>
                )}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                (priceChanges?.price_changes['1h']?.change_percent_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(priceChanges?.price_changes['1h']?.change_percent_usd || 0) >= 0 ? 
                  <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4h Price Change */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">4h</p>
                {priceChangesLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-lg font-bold">--</p>
                  </div>
                ) : (
                  <p className={`text-lg font-bold ${
                    (priceChanges?.price_changes['4h']?.change_percent_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceChanges?.price_changes['4h']?.change_percent_usd !== null 
                      ? `${(priceChanges?.price_changes['4h']?.change_percent_usd || 0).toFixed(2)}%`
                      : 'N/A'
                    }
                  </p>
                )}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                (priceChanges?.price_changes['4h']?.change_percent_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(priceChanges?.price_changes['4h']?.change_percent_usd || 0) >= 0 ? 
                  <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1d Price Change */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">1d</p>
                {priceChangesLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-lg font-bold">--</p>
                  </div>
                ) : (
                  <p className={`text-lg font-bold ${
                    (priceChanges?.price_changes['1d']?.change_percent_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceChanges?.price_changes['1d']?.change_percent_usd !== null 
                      ? `${(priceChanges?.price_changes['1d']?.change_percent_usd || 0).toFixed(2)}%`
                      : 'N/A'
                    }
                  </p>
                )}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                (priceChanges?.price_changes['1d']?.change_percent_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(priceChanges?.price_changes['1d']?.change_percent_usd || 0) >= 0 ? 
                  <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <SimplePriceChart ticker={tokenData.symbol} />

      {/* Trading Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tradesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading trades...</span>
              </div>
            ) : recentTrades.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentTrades.slice(0, 10).map((trade, index) => {
                  const isBuy = trade.trade_type?.includes('buy') || trade.trade_type === 'token_creation';
                  const tradeTypeDisplay = trade.trade_type === 'token_creation' ? 'CREATE' : 
                                         trade.trade_type === 'flat_buy' ? 'BUY' :
                                         trade.trade_type === 'flat_sell' ? 'SELL' :
                                         trade.trade_type === 'amm_buy' ? 'BUY' :
                                         trade.trade_type === 'amm_sell' ? 'SELL' : 'TRADE';
                  
                  return (
                    <div key={`${trade.tx_hash || trade.user_handle}-${index}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-lg gap-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={isBuy ? 'default' : 'secondary'}
                          className={isBuy ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                        >
                          {tradeTypeDisplay}
                        </Badge>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={trade.token_image} />
                            <AvatarFallback className="text-xs">
                              {(trade.user_handle || '').slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">@{trade.user_handle}</p>
                            <p className="text-xs text-muted-foreground">
                              {(() => {
                                try {
                                  const date = new Date(trade.trade_time || Date.now());
                                  if (isNaN(date.getTime())) {
                                    return 'Recently';
                                  }
                                  return formatDistanceToNow(date, { addSuffix: true });
                                } catch (e) {
                                  return 'Recently';
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right sm:text-right text-left flex-shrink-0">
                        <p className="text-sm font-medium">
                          {formatAmount(Number(trade.token_amount) || 0)} ${tokenData.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number(trade.eth_amount || 0).toFixed(4)} ETH
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${Number(trade.eth_amount_usd || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent trades</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trading Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Trading Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buy vs Sell Volume */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Buy Volume</span>
                <span className="text-green-600">
                  {tokenData.volumeAnalysis ? 
                    formatVolume(tokenData.volumeAnalysis.buyVolumeUsd) : 
                    formatVolume(buyVolume)
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${isNaN(buyPressure) ? 50 : Math.max(0, Math.min(100, buyPressure))}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Sell Volume</span>
                <span className="text-red-600">
                  {tokenData.volumeAnalysis ? 
                    formatVolume(tokenData.volumeAnalysis.sellVolumeUsd) : 
                    formatVolume(sellVolume)
                  }
                </span>
              </div>
            </div>

            <Separator />

            {/* Trade Count */}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Trades (24h)</span>
              <span className="font-medium">
                {tokenData.volumeAnalysis ? 
                  tokenData.volumeAnalysis.totalTrades : 
                  tokenData.recentTrades.length
                }
              </span>
            </div>

            {/* Buy vs Sell Count */}
            {tokenData.volumeAnalysis && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Buy Orders</span>
                  <span className="font-medium text-green-600">{tokenData.volumeAnalysis.buyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sell Orders</span>
                  <span className="font-medium text-red-600">{tokenData.volumeAnalysis.sellCount}</span>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </div>

      {/* Token Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Token Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Token Name</span>
                <span className="font-medium">{tokenData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Symbol</span>
                <span className="font-medium">${tokenData.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Supply</span>
                <span className="font-medium">1 billion</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium">{tokenData.status === 'graduated' ? 'Trading on Uniswap' : 'Incubating'}</span>
              </div>
              {tokenData.tokenAddress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contract Address</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => navigator.clipboard.writeText(tokenData.tokenAddress)}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="font-mono text-xs bg-muted/30 p-2 rounded border break-all text-muted-foreground">
                    {tokenData.tokenAddress}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created On</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="font-medium">Base</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="font-medium">Community Token</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityTokenAnalytics;
