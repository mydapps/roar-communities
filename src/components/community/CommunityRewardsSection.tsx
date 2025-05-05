import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface CommunityRewardsSectionProps {
  availableRewards: number;
  ethToUsd: number;
  minShareReward: number | null | undefined;
  hasLastDistributed: boolean;
  rewardFees: number | undefined;
}

const CommunityRewardsSection: React.FC<CommunityRewardsSectionProps> = ({
  availableRewards,
  ethToUsd,
  minShareReward,
  hasLastDistributed,
  rewardFees
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Rewards</CardTitle>
        <CardDescription>
          The community reward pool is distributed monthly to the top posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20 shadow-sm relative overflow-hidden animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-primary">Current Reward Pool</span>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {availableRewards.toFixed(5) || '0.00000'} ETH
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${(availableRewards * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/40 p-4 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              How Rewards Work
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>{rewardFees || 2}% of all buy/sell transactions go to the reward pool</li>
              <li>Rewards are distributed on the last day of each month</li>
              <li>60% goes to the top 3 most roared posts</li>
              <li>40% is split among the next 7 top posts</li>
              <li>
                {minShareReward !== null 
                  ? `You must hold at least ${minShareReward} shares to be eligible for rewards`
                  : `You must hold at least 5 shares to be eligible for rewards`}
              </li>
            </ul>
          </div>
          
          {/* TODO: Implement or pass data for Last Month's Winners if needed */}
          {hasLastDistributed && (
            <div>
              <h3 className="font-medium mb-3">Last Month's Winners</h3>
              <div className="space-y-3">
                {/* Placeholder - Replace with actual data rendering */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">1</div>
                    <div>
                      <div className="font-medium">winner1.eth</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">"Top post content..."</div>
                    </div>
                  </div>
                  <div className="font-bold">X.XX ETH</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">2</div>
                    <div>
                      <div className="font-medium">winner2.lens</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">"Second post content..."</div>
                    </div>
                  </div>
                  <div className="font-bold">X.XX ETH</div>
                </div>
                {/* Add more placeholders or logic to display winners */}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityRewardsSection; 