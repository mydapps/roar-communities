import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Lock, 
  Unlock,
  DollarSign,
  Coins,
  Users,
  Vote,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface TokenData {
  symbol: string;
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
}

interface CommunityTokenRewardsProps {
  tokenData: TokenData;
  community: CommunityData;
  onUtilize: () => void;
  ethToUsd: number;
}

const CommunityTokenRewards: React.FC<CommunityTokenRewardsProps> = ({
  tokenData,
  community,
  onUtilize,
  ethToUsd
}) => {
  const { rewardPool } = tokenData;

  const copyAddress = () => {
    navigator.clipboard.writeText(rewardPool.address);
    toast.success("Wallet address copied to clipboard");
  };

  const openInExplorer = () => {
    window.open(`https://basescan.org/address/${rewardPool.address}`, '_blank');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatTokenAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  };

  const daysUntilUnlock = Math.ceil((rewardPool.unlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUnlocked = !rewardPool.isLocked || daysUntilUnlock <= 0;

  return (
    <div className="space-y-6">
      {/* Reward Pool Overview */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Community Reward Pool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Address */}
          <div className="p-4 bg-background/50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Wallet Address</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openInExplorer}
                  className="h-6 px-2"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <p className="font-mono text-sm bg-muted/50 p-2 rounded border">
              {rewardPool.address}
            </p>
          </div>

          {/* Holdings */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">ETH Holdings</span>
              </div>
              <p className="text-2xl font-bold">{rewardPool.ethBalance.toFixed(6)} ETH</p>
              <p className="text-sm text-muted-foreground">
                ≈ {formatCurrency(rewardPool.ethBalance * ethToUsd)}
              </p>
            </div>

            <div className="p-4 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">${tokenData.symbol} Holdings</span>
              </div>
              <p className="text-2xl font-bold">{formatTokenAmount(rewardPool.tokenBalance)}</p>
              <p className="text-sm text-muted-foreground">
                Community tokens
              </p>
            </div>
          </div>

          {/* Total Value */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pool Value</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(rewardPool.usdValue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lock Status & Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isUnlocked ? <Unlock className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-amber-600" />}
            Fund Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lock Status */}
          <div className={`p-4 rounded-lg border ${isUnlocked ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'}`}>
            <div className="flex items-start gap-3">
              {isUnlocked ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${isUnlocked ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  {isUnlocked ? 'Funds Unlocked' : 'Funds Locked'}
                </p>
                <p className={`text-sm ${isUnlocked ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {isUnlocked 
                    ? 'Community can now vote on fund utilization'
                    : `Funds will unlock in ${daysUntilUnlock} days (${formatDistanceToNow(rewardPool.unlockDate, { addSuffix: true })})`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Utilization Button */}
          <Button
            onClick={onUtilize}
            className="w-full h-12 text-lg"
            variant={isUnlocked ? "default" : "secondary"}
            disabled={!isUnlocked}
          >
            {isUnlocked ? (
              <>
                <Vote className="w-5 h-5 mr-2" />
                Propose Fund Usage
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 mr-2" />
                Funds Locked ({daysUntilUnlock} days left)
              </>
            )}
          </Button>

          {isUnlocked && (
            <p className="text-sm text-muted-foreground text-center">
              Create proposals for community voting on reward pool utilization
            </p>
          )}
        </CardContent>
      </Card>

      {/* How Rewards Work */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            How Rewards Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <div>
                <p className="font-medium">Trading Fees Collection</p>
                <p className="text-sm text-muted-foreground">
                  0.5% of all trading fees automatically flow to the reward pool
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <div>
                <p className="font-medium">Community Governance</p>
                <p className="text-sm text-muted-foreground">
                  Token holders vote on how to use accumulated rewards
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <div>
                <p className="font-medium">Fund Distribution</p>
                <p className="text-sm text-muted-foreground">
                  Rewards distributed to creators, events, or community initiatives
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>Popular uses:</strong> Creator rewards, hackathons, community events, 
              marketing campaigns, development bounties, and charitable donations.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default CommunityTokenRewards;




