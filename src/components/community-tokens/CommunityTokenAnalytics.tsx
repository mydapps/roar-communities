import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RechartsPriceChart from './RechartsPriceChart';
import { getRecentTrades, getPriceChange, getPriceHistory, PriceChangeResponse } from '@/utils/communityTokensApi';

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
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [priceChanges, setPriceChanges] = useState<PriceChangeResponse['data'] | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // STRICT Price Formatting: NO Scientific Notation
  const formatTokenPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) return '$0.00';

    if (price === 0) return '$0.00';

    // For very small prices (e.g., 0.00001234)
    if (price < 0.01) {
      // Use 8 decimal places to show value, avoiding scientific notation
      return `$${price.toFixed(8)}`;
    }

    // For small prices (e.g., 0.50)
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    }

    // For normal prices (e.g., 1.23)
    return `$${price.toFixed(2)}`;
  };

  const formatCurrency = (value: number | undefined | null) => {
    const val = Number(value) || 0;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  const formatNumber = (value: number | undefined | null) => {
    const val = Number(value) || 0;
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  // Calculate analytics
  const buyTrades = tokenData.recentTrades.filter(t => t.action === 'buy');
  const sellTrades = tokenData.recentTrades.filter(t => t.action === 'sell');
  const buyVolume = buyTrades.reduce((sum, t) => sum + (t.amount * t.price), 0);
  const sellVolume = sellTrades.reduce((sum, t) => sum + (t.amount * t.price), 0);

  const buyPressure = tokenData.volumeAnalysis?.buyPercentage !== undefined ?
    tokenData.volumeAnalysis.buyPercentage :
    (tokenData.buyPressure !== undefined ? tokenData.buyPressure :
      (buyVolume + sellVolume > 0 ? (buyVolume / (buyVolume + sellVolume) * 100) : 50));

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!tokenData.symbol) return;
      const ticker = String(tokenData.symbol);

      setTradesLoading(true);
      setHistoryLoading(true);
      try {
        const [tradesRes, priceRes, historyRes] = await Promise.all([
          getRecentTrades(ticker, 1, 20),
          getPriceChange(ticker),
          getPriceHistory(ticker, '24h')
        ]);

        if (tradesRes.success && tradesRes.data?.trades) {
          setRecentTrades(tradesRes.data.trades);
        }
        if (priceRes.success && priceRes.data) {
          setPriceChanges(priceRes.data);
        }
        if (historyRes.success && historyRes.data?.price_history) {
          setPriceHistory(historyRes.data.price_history);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setTradesLoading(false);
        setHistoryLoading(false);
      }
    };

    fetchData();
  }, [tokenData.symbol]);

  // Prepare chart data
  // Use fetched history if available, otherwise fallback to tokenData.priceHistory
  const rawHistory = priceHistory.length > 0 ? priceHistory : tokenData.priceHistory;

  const chartData = rawHistory.map(h => ({
    time: new Date(h.time),
    price: typeof h.close_usd !== 'undefined' ? parseFloat(h.close_usd) : (h.price || 0),
    volume: typeof h.volume_usd !== 'undefined' ? parseFloat(h.volume_usd) : (h.volume || 0)
  })).sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Hero Section */}
      <div className="flex flex-col items-center text-center space-y-4 py-6">
        <div className="flex items-center gap-4">
          <div className="text-center w-full">
            <h2 className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              {formatTokenPrice(tokenData.currentPrice)}
            </h2>
            <div className={`flex items-center justify-center gap-1 text-base font-semibold ${tokenData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {tokenData.priceChange24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {Math.abs(tokenData.priceChange24h).toFixed(2)}% (24h)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Chart (Recharts) */}
      <Card className="border-none shadow-none bg-transparent p-0 overflow-hidden">
        <CardContent className="p-0 h-[300px]">
          {historyLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RechartsPriceChart
              data={chartData}
              height={300}
              showTooltip={true}
            />
          )}
        </CardContent>
      </Card>

      {/* 3. Market Sentiment (FOMO Gauge) */}
      <Card className="overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-green-500">
                {Math.round(buyPressure)}%
                <span className="text-sm font-normal text-muted-foreground ml-2">Buy Pressure</span>
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                24h Volume: {formatCurrency(tokenData.volume24h)}
              </span>
            </div>

            {/* Custom Gauge Bar */}
            <div className="h-3 w-full bg-red-500/20 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500 transition-all duration-500 ease-out relative shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                style={{ width: `${Math.min(100, Math.max(0, buyPressure))}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/80" />
              </div>
              <div className="h-full bg-red-500 flex-1" />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>More Buyers</span>
              <span>More Sellers</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Market Cap</span>
            <span className="text-lg font-bold">{formatCurrency(tokenData.marketCap)}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Holders</span>
            <span className="text-lg font-bold flex items-center gap-1">
              <Users className="w-4 h-4 text-primary" />
              {formatNumber(tokenData.holders)}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Supply</span>
            <span className="text-lg font-bold">{formatNumber(tokenData.totalSupply)}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created</span>
            <span className="text-lg font-bold flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {formatDistanceToNow(new Date(tokenData.recentTrades[tokenData.recentTrades.length - 1]?.timestamp || Date.now()), { addSuffix: true }).replace('about ', '')}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 5. Live Activity Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            Live Activity
          </h3>
          <Badge variant="outline" className="text-xs font-normal bg-background/50">
            Real-time
          </Badge>
        </div>

        <div className="space-y-3">
          {tradesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentTrades.length > 0 ? (
            recentTrades.slice(0, 10).map((trade, i) => {
              const isBuy = trade.trade_type?.includes('buy') || trade.trade_type === 'token_creation';
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-card/50 backdrop-blur-sm rounded-lg border-none shadow-sm hover:bg-card/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isBuy ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {isBuy ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">
                          {isBuy ? 'Bought' : 'Sold'} {formatNumber(Number(trade.token_amount))} {tokenData.symbol}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        @{trade.user_handle} • {formatDistanceToNow(new Date(trade.trade_time || Date.now()), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      ${Number(trade.eth_amount_usd || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Number(trade.eth_amount || 0).toFixed(4)} ETH
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent activity
            </div>
          )}
        </div>
      </div>

      {/* 6. Call to Action */}
      <div className="pt-4 pb-8">
        <Button
          className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => onTrade('buy')}
        >
          Trade ${tokenData.symbol}
        </Button>
      </div>
    </div>
  );
};

export default CommunityTokenAnalytics;
