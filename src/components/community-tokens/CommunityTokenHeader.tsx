import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { GenericShareDialog } from '@/components/community/GenericShareDialog';
import IncubationProgressBar from './IncubationProgressBar';
import { 
  ArrowUp, 
  ArrowDown, 
  Users, 
  DollarSign, 
  Share2,
  TrendingUp,
  TrendingDown,
  Clock,
  Coins,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
}

interface CommunityData {
  id: string;
  name: string;
  image?: string;
  members_count?: number;
  description?: string;
}

interface UserData {
  shares?: number;
  share_value?: {
    usd?: number;
    eth?: number;
  };
}

interface CommunityTokenHeaderProps {
  community: CommunityData;
  user?: UserData;
  tokenData: TokenData;
  onTrade: (action: 'buy' | 'sell') => void;
  ethToUsd: number;
  isMobile: boolean;
}

const CommunityTokenHeader: React.FC<CommunityTokenHeaderProps> = ({
  community,
  user,
  tokenData,
  onTrade,
  ethToUsd,
  isMobile
}) => {
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
            0.0<span className="font-bold text-lg align-sub">{subscriptNumber}</span>{significantDigits}
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

  const formatMarketCap = (value: number) => {
    if (value == null || isNaN(value)) {
      return '$0.00';
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatTimeLeft = (ms: number) => {
    if (ms == null || isNaN(ms) || ms <= 0) return null;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const isIncubation = tokenData.status === 'incubation';
  const priceChangePositive = (tokenData.priceChange24h || 0) >= 0;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-background via-background to-muted/20">
      <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-start justify-between'}`}>
          {/* Left side - Community Info */}
          <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
            <Avatar className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} border-2 border-primary/20`}>
              <AvatarImage src={community.image} alt={community.name} />
              <AvatarFallback className={`${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {community.name?.charAt(0) || '🪙'}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1 flex-1">
              <div className={`flex items-center ${isMobile ? 'flex-col items-start' : 'gap-2'}`}>
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{community.name}</h1>
                <Badge 
                  variant={isIncubation ? "secondary" : "default"}
                  className={`${isMobile ? 'mt-1' : ''} ${isIncubation ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}`}
                >
                  {isIncubation ? "Incubating" : "Trading on Uniswap"}
                </Badge>
              </div>
              
              <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2' : 'gap-4'} text-sm text-muted-foreground`}>
                <span className="flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  ${tokenData.symbol}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {tokenData.holders.toLocaleString()} holders
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className={`flex ${isMobile ? 'w-full justify-between' : 'items-center'} gap-2`}>
            <GenericShareDialog 
              title={`${community.name} Token`}
              description={community.description}
              url={window.location.href}
            >
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                {!isMobile && "Share"}
              </Button>
            </GenericShareDialog>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => onTrade('buy')}
                className="bg-green-600 hover:bg-green-700 text-white"
                size={isMobile ? "sm" : "sm"}
              >
                Buy ${tokenData.symbol}
              </Button>
              
              {user?.shares && user.shares > 0 && (
                <Button 
                  onClick={() => onTrade('sell')}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  size={isMobile ? "sm" : "sm"}
                >
                  Sell
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${isMobile ? 'pt-2' : 'pt-0'}`}>
        {/* Token Stats Grid */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'} ${isMobile ? 'mb-4' : 'mb-6'}`}>
          {/* Current Price */}
          <div className="space-y-1">
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Current Price</p>
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-1`}>
              <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>
                ${formatPrice(tokenData.currentPriceUsd)}
              </p>
              <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'} ${priceChangePositive ? 'text-green-600' : 'text-red-600'}`}>
                {priceChangePositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(tokenData.priceChange24h || 0).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Market Cap */}
          <div className="space-y-1">
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Market Cap</p>
            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>{formatMarketCap(tokenData.marketCap)}</p>
          </div>

          {/* 24h Volume */}
          <div className="space-y-1">
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>24h Volume</p>
            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>{formatMarketCap(tokenData.volume24h)}</p>
          </div>

          {/* Supply */}
          <div className="space-y-1">
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Total Supply</p>
            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>
              1 billion
            </p>
          </div>
        </div>

        {/* Incubation Progress Bar */}
        {isIncubation && (
          <IncubationProgressBar 
            timeLeft={tokenData.timeLeft}
            volume24h={tokenData.volume24h}
            isMobile={isMobile}
          />
        )}

        {/* User Holdings */}
        {user?.shares && user.shares > 0 && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Holdings</p>
                <p className="text-lg font-bold">
                  {user.shares.toLocaleString()} ${tokenData.symbol}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Value</p>
                <p className="text-lg font-bold text-green-600">
                  ${((user.shares || 0) * (tokenData.currentPriceUsd || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityTokenHeader;
