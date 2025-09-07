import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const formatPrice = (price: number) => {
    if (price < 0.000001) {
      return price.toExponential(2);
    }
    return price.toFixed(8);
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
  const buyPressure = buyVolume / (buyVolume + sellVolume) * 100;

  // Mock chart data (in a real app, this would come from an API)
  const chartData = tokenData.priceHistory.slice(-24); // Last 24 hours

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-lg font-bold">${formatPrice(tokenData.currentPrice)}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${tokenData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tokenData.priceChange24h >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(tokenData.priceChange24h).toFixed(2)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volume 24h</p>
                <p className="text-lg font-bold">{formatVolume(tokenData.volume24h)}</p>
              </div>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Holders</p>
                <p className="text-lg font-bold">{tokenData.holders.toLocaleString()}</p>
              </div>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Buy Pressure</p>
                <p className="text-lg font-bold">{buyPressure.toFixed(1)}%</p>
              </div>
              <Target className={`w-5 h-5 ${buyPressure > 50 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Price Chart
            </CardTitle>
            <div className="flex items-center gap-2">
              <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="1h" className="text-xs">1H</TabsTrigger>
                  <TabsTrigger value="24h" className="text-xs">24H</TabsTrigger>
                  <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
                  <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mock Chart Visualization */}
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <LineChart className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Interactive price chart</p>
              <p className="text-xs text-muted-foreground">Real-time data visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {tokenData.recentTrades.slice(0, 10).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={trade.action === 'buy' ? 'default' : 'secondary'}
                      className={trade.action === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                    >
                      {trade.action.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">@{trade.user}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(trade.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatAmount(trade.amount)} ${tokenData.symbol}</p>
                    <p className="text-xs text-muted-foreground">${formatPrice(trade.price)}</p>
                  </div>
                </div>
              ))}
            </div>
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
                <span className="text-green-600">{formatVolume(buyVolume)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${buyPressure}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Sell Volume</span>
                <span className="text-red-600">{formatVolume(sellVolume)}</span>
              </div>
            </div>

            <Separator />

            {/* Trade Count */}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Trades (24h)</span>
              <span className="font-medium">{tokenData.recentTrades.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Buy Trades</span>
              <span className="font-medium text-green-600">{buyTrades.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sell Trades</span>
              <span className="font-medium text-red-600">{sellTrades.length}</span>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => onTrade('buy')}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <ArrowUp className="w-4 h-4 mr-1" />
                Buy
              </Button>
              <Button 
                onClick={() => onTrade('sell')}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                size="sm"
              >
                <ArrowDown className="w-4 h-4 mr-1" />
                Sell
              </Button>
            </div>
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
                <span className="font-medium">{(tokenData.totalSupply / 1000000).toFixed(0)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Circulating Supply</span>
                <span className="font-medium">{(tokenData.circulatingSupply / 1000000).toFixed(1)}M</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={tokenData.status === 'graduated' ? 'default' : 'secondary'}>
                  {tokenData.status === 'graduated' ? 'Graduated' : 'Incubating'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Market Cap</span>
                <span className="font-medium">{formatVolume(tokenData.marketCap)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Holders</span>
                <span className="font-medium">{tokenData.holders.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">24h Volume</span>
                <span className="font-medium">{formatVolume(tokenData.volume24h)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityTokenAnalytics;
