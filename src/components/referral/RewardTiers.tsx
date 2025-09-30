import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Crown, Diamond, Lock, CheckCircle2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RewardTier } from '@/utils/referralApi';

interface RewardTiersProps {
  rewards: {
    tier1: RewardTier;
    tier2: RewardTier;
    tier3: RewardTier;
  };
  onClaimReward: (tier: string) => void;
  className?: string;
}

interface TierConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  requirement: string;
  estimatedValue: string;
  color: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    border: string;
  };
  glow: string;
}

const tierConfigs: TierConfig[] = [
  {
    id: 'tier1',
    title: 'Starter Box',
    subtitle: 'First Trade Reward',
    icon: <Gift className="w-8 h-8" />,
    requirement: '1 Trade',
    estimatedValue: '$50-100',
    color: {
      primary: 'text-blue-600',
      secondary: 'text-blue-500',
      accent: 'text-blue-400',
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
      border: 'border-blue-200 dark:border-blue-800'
    },
    glow: 'shadow-blue-500/20'
  },
  {
    id: 'tier2',
    title: 'Power Box',
    subtitle: 'Weekly Champion',
    icon: <Star className="w-8 h-8" />,
    requirement: '5 Trades/Week',
    estimatedValue: '$150-300',
    color: {
      primary: 'text-purple-600',
      secondary: 'text-purple-500',
      accent: 'text-purple-400',
      bg: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      border: 'border-purple-200 dark:border-purple-800'
    },
    glow: 'shadow-purple-500/20'
  },
  {
    id: 'tier3',
    title: 'Diamond Box',
    subtitle: 'Monthly Legend',
    icon: <Crown className="w-8 h-8" />,
    requirement: '15 Trades/Month',
    estimatedValue: '$500-1000',
    color: {
      primary: 'text-yellow-600',
      secondary: 'text-yellow-500',
      accent: 'text-yellow-400',
      bg: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    glow: 'shadow-yellow-500/20'
  }
];

export const RewardTiers: React.FC<RewardTiersProps> = ({
  rewards,
  onClaimReward,
  className
}) => {
  const getProgressValue = (tier: RewardTier, tierConfig: TierConfig) => {
    if (tier.claimed) return 100;
    if (tier.eligible) return 100;
    
    // Parse progress for percentage
    const progressMatch = tier.progress.match(/(\d+)\/(\d+)/);
    if (progressMatch) {
      const [, current, total] = progressMatch;
      return (parseInt(current) / parseInt(total)) * 100;
    }
    
    return 0;
  };

  const getBoxState = (tier: RewardTier) => {
    if (tier.claimed) return 'claimed';
    if (tier.eligible) return 'claimable';
    return 'locked';
  };

  const renderRewardBox = (tierConfig: TierConfig, tier: RewardTier, index: number) => {
    const state = getBoxState(tier);
    const progress = getProgressValue(tier, tierConfig);
    const isLocked = state === 'locked';
    const isClaimable = state === 'claimable';
    const isClaimed = state === 'claimed';

    return (
      <motion.div
        key={tierConfig.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex-1"
      >
        <Card className={cn(
          "relative transition-all duration-300 cursor-pointer group",
          tierConfig.color.border,
          isLocked && "opacity-60 grayscale",
          isClaimable && `${tierConfig.glow} shadow-lg hover:shadow-xl`,
          isClaimed && "ring-2 ring-green-500/50"
        )}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {/* Status Badge */}
              <div className="flex justify-center mb-2">
                {isClaimed && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Claimed
                  </Badge>
                )}
                {isClaimable && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      Ready to Claim!
                    </Badge>
                  </motion.div>
                )}
                {isLocked && (
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>

              {/* Icon */}
              <motion.div
                className={cn(
                  "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br",
                  tierConfig.color.bg,
                  isClaimable && "animate-pulse"
                )}
                whileHover={isClaimable ? { scale: 1.05, rotate: 5 } : {}}
                whileTap={isClaimable ? { scale: 0.95 } : {}}
              >
                <div className={cn(
                  tierConfig.color.primary,
                  isLocked && "text-gray-400"
                )}>
                  {tierConfig.icon}
                </div>
                
                {/* Sparkle effects for claimable boxes */}
                {isClaimable && (
                  <>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4"
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.5
                      }}
                    >
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-1 -left-1 w-3 h-3"
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [360, 180, 0]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                    >
                      <Diamond className="w-3 h-3 text-blue-400 fill-blue-400" />
                    </motion.div>
                  </>
                )}
              </motion.div>

              {/* Title & Subtitle */}
              <div>
                <h3 className={cn(
                  "text-lg font-bold",
                  isLocked ? "text-gray-500" : tierConfig.color.primary
                )}>
                  {tierConfig.title}
                </h3>
                <p className={cn(
                  "text-sm",
                  isLocked ? "text-gray-400" : tierConfig.color.secondary
                )}>
                  {tierConfig.subtitle}
                </p>
              </div>

              {/* Requirement */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requirement:</span>
                  <span className="font-medium">{tierConfig.requirement}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Value:</span>
                  <span className={cn(
                    "font-bold",
                    isLocked ? "text-gray-400" : tierConfig.color.primary
                  )}>
                    {tierConfig.estimatedValue}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-2",
                    isLocked && "opacity-50"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {tier.progress}
                </p>
              </div>

              {/* Action Button */}
              {isClaimable && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => onClaimReward(tierConfig.id)}
                    className={cn(
                      "w-full font-semibold bg-gradient-to-r",
                      "from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
                      "text-white shadow-lg hover:shadow-xl"
                    )}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Claim Reward Box
                  </Button>
                </motion.div>
              )}

              {isClaimed && (
                <Button
                  disabled
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Already Claimed
                </Button>
              )}

              {isLocked && (
                <Button
                  disabled
                  variant="ghost"
                  className="w-full opacity-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Complete Previous Tier
                </Button>
              )}
            </div>
          </CardContent>

          {/* Glow effect for claimable boxes */}
          {isClaimable && (
            <motion.div
              className={cn(
                "absolute inset-0 rounded-lg opacity-20 -z-10",
                `bg-gradient-to-br ${tierConfig.color.bg}`
              )}
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          )}
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Referral Reward Tiers
        </h2>
        <p className="text-muted-foreground">
          Complete trades to unlock exclusive community token reward boxes
        </p>
      </div>

      {/* Progress Connection Line */}
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          {tierConfigs.map((config, index) => {
            const tier = rewards[config.id as keyof typeof rewards];
            const state = getBoxState(tier);
            
            return (
              <React.Fragment key={config.id}>
                {/* Tier Box */}
                <div className="flex-1 max-w-xs">
                  {renderRewardBox(config, tier, index)}
                </div>

                {/* Connection Arrow */}
                {index < tierConfigs.length - 1 && (
                  <div className="flex items-center justify-center w-16 h-16 mx-4">
                    <motion.div
                      className={cn(
                        "w-8 h-0.5 bg-gradient-to-r",
                        state === 'claimed' 
                          ? "from-green-400 to-green-600" 
                          : "from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700"
                      )}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: (index + 1) * 0.2 }}
                    />
                    <motion.div
                      className={cn(
                        "w-0 h-0 border-l-4 border-r-0 border-t-2 border-b-2 border-transparent ml-1",
                        state === 'claimed'
                          ? "border-l-green-500"
                          : "border-l-gray-400 dark:border-l-gray-600"
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (index + 1) * 0.2 + 0.1 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {tierConfigs.map((config, index) => {
          const tier = rewards[config.id as keyof typeof rewards];
          return renderRewardBox(config, tier, index);
        })}
      </div>
    </div>
  );
};
