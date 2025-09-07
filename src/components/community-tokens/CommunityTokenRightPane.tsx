import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Wallet,
  Coins,
  Timer
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getVolumeAnalysis, VolumeAnalysisResponse } from '@/utils/communityTokensApi';

interface TokenData {
  symbol: string;
  name: string;
  currentPrice: number;
  currentPriceUsd: number;
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
  rewardPool: {
    address: string;
    ethBalance: number;
    tokenBalance: number;
    usdValue: number;
    isLocked: boolean;
    unlockDate: Date;
  };
}

interface CommunityData {
  id: string;
  name: string;
  image?: string;
}

interface UserData {
  shares?: number;
  share_value?: {
    usd?: number;
    eth?: number;
  };
}

interface CommunityTokenRightPaneProps {
  tokenData: TokenData;
  community: CommunityData;
  user?: UserData;
  onTrade: (action: 'buy' | 'sell') => void;
  ethToUsd: number;
}

const CommunityTokenRightPane: React.FC<CommunityTokenRightPaneProps> = ({
  tokenData,
  community,
  user,
  onTrade,
  ethToUsd
}) => {
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

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return null;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const isIncubation = tokenData.status === 'incubation';
  const priceChangePositive = tokenData.priceChange24h >= 0;

  // State for volume analysis data
  const [volumeAnalysis, setVolumeAnalysis] = useState<VolumeAnalysisResponse['data'] | null>(null);
  const [buyPressure, setBuyPressure] = useState<number>(50);

  // Fetch volume analysis data
  useEffect(() => {
    const fetchVolumeAnalysis = async () => {
      try {
        const response = await getVolumeAnalysis(tokenData.symbol, '24h');
        if (response.success && response.data) {
          setVolumeAnalysis(response.data);
          setBuyPressure(response.data.buy_percentage || 50);
        } else {
          setBuyPressure(50); // Default fallback
        }
      } catch (error) {
        console.error('Error fetching volume analysis:', error);
        setBuyPressure(50); // Default fallback
      }
    };

    if (tokenData.symbol) {
      fetchVolumeAnalysis();
    }
  }, [tokenData.symbol]);

  return (
    <div className="space-y-4 sticky top-4">
      {/* Quick Trade Card */}
      <Card className="border-2 border-primary/20 mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Trade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Price */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Current Price</p>
            <p className="text-2xl font-bold">${formatPrice(tokenData.currentPrice)}</p>
            <div className={`flex items-center justify-center gap-1 text-sm mt-1 ${priceChangePositive ? 'text-green-600' : 'text-red-600'}`}>
              {priceChangePositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(tokenData.priceChange24h).toFixed(2)}% (24h)
            </div>
          </div>

          {/* Trade Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => onTrade('buy')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowUp className="w-4 h-4 mr-1" />
              Buy
            </Button>
            <Button 
              onClick={() => onTrade('sell')}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <ArrowDown className="w-4 h-4 mr-1" />
              Sell
            </Button>
          </div>

        </CardContent>
      </Card>


      {/* Incubation Status */}
      {isIncubation && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Timer className="w-5 h-5" />
              Incubation Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {formatTimeLeft(tokenData.timeLeft) || "Graduating..."}
              </p>
              <p className="text-sm text-muted-foreground">Time remaining</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to graduation</span>
                <span>{Math.min(90, (tokenData.volume24h / 1) * 100).toFixed(0)}%</span>
              </div>
              <Progress 
                value={Math.min(90, (tokenData.volume24h / 1) * 100)} 
                className="h-2"
              />
            </div>
            
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Flat rate trading until 1 ETH collected or time expires
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reward Pool Summary - Enhanced and prominent */}
      <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
            <Wallet className="w-5 h-5" />
            Community Reward Pool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-muted-foreground mb-1">Total Pool Value</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatVolume(tokenData.rewardPool.usdValue)}
            </p>
            <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
              Growing from trading fees
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-background/50 rounded">
              <span className="text-sm text-muted-foreground">ETH Balance</span>
              <span className="font-medium">{tokenData.rewardPool.ethBalance.toFixed(4)} ETH</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-background/50 rounded">
              <span className="text-sm text-muted-foreground">Token Balance</span>
              <span className="font-medium">{formatAmount(tokenData.rewardPool.tokenBalance)} ${tokenData.symbol}</span>
            </div>
            
          </div>
          
          {tokenData.rewardPool.isLocked && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                🔒 Unlocks {formatDistanceToNow(tokenData.rewardPool.unlockDate, { addSuffix: true })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityTokenRightPane;
