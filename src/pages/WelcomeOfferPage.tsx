import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, 
  Star, 
  Crown, 
  Clock, 
  CheckCircle2, 
  Lock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Trophy,
  Zap,
  Target,
  Coins,
  Users,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

// Import referral API functions
import { getReferralStatus } from '@/utils/referralApi';

// Interface for referral status data
interface ReferralStatusData {
  user_progress: {
    countdown_active: boolean;
    countdown_expires_at: string;
    countdown_seconds_remaining: number;
    countdown_duration_hours: number;
    ab_test_group: string;
    first_trade_completed: boolean;
    first_trade_timestamp: string | null;
    total_trades: number;
    trades_this_week: number;
    trades_this_month: number;
    campaign_status: string;
    next_milestone: string;
  };
  referrer_info?: {
    referrer_id: number;
    referrer_handle: string;
  };
  rewards: {
    tier1: {
      eligible: boolean;
      claimed: boolean;
      progress: string;
    };
    tier2: {
      eligible: boolean;
      claimed: boolean;
      progress: string;
    };
    tier3: {
      eligible: boolean;
      claimed: boolean;
      progress: string;
    };
  };
}

// Get user handle from localStorage
const getUserHandle = () => {
  return localStorage.getItem('dapps_user_handle') || 'friend';
};

interface TierData {
  status: 'locked' | 'active' | 'completed' | 'claimed';
  countdown: number;
  requirement: string;
  reward: {
    description: string;
  };
}

const WelcomeOfferPage = () => {
  const navigate = useNavigate();
  
  // State for referral data and loading
  const [referralData, setReferralData] = useState<ReferralStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({
    tier1: 0,
    tier2: 0,
    tier3: 0
  });
  const [claimingTier, setClaimingTier] = useState<number | null>(null);
  const userHandle = getUserHandle();

  // Load referral status on component mount
  useEffect(() => {
    const loadReferralStatus = async () => {
      try {
        setIsLoading(true);
        const response = await getReferralStatus();
        
        if (response.success && response.data) {
          setReferralData(response.data);
          
          // Set initial countdown from API data
          if (response.data.user_progress.countdown_active) {
            setCountdowns({
              tier1: response.data.user_progress.countdown_seconds_remaining,
              tier2: 0,
              tier3: 0
            });
          }
          
          console.log('📊 Referral status loaded:', response.data);
        } else {
          console.error('❌ Failed to load referral status:', response);
          toast.error('Failed to load welcome offer status');
        }
      } catch (error) {
        console.error('❌ Error loading referral status:', error);
        toast.error('Failed to load welcome offer status');
      } finally {
        setIsLoading(false);
      }
    };

    loadReferralStatus();

    // Listen for trade completion events to refresh data
    const handleTradeCompleted = () => {
      console.log('🔄 Trade completed, refreshing welcome offer data...');
      loadReferralStatus();
    };

    // Add event listener for trade completions
    window.addEventListener('tradeCompleted', handleTradeCompleted);

    return () => {
      window.removeEventListener('tradeCompleted', handleTradeCompleted);
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => ({
        tier1: Math.max(0, prev.tier1 - 1),
        tier2: Math.max(0, prev.tier2 - 1),
        tier3: Math.max(0, prev.tier3 - 1)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTierConfig = (tier: number) => {
    const configs = {
      1: {
        icon: Gift,
        title: 'Starter Reward',
        color: 'from-blue-400 to-cyan-500',
        bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
        size: 'w-16 h-16',
        glowColor: 'shadow-blue-500/50',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      2: {
        icon: Star,
        title: 'Growth Reward',
        color: 'from-purple-400 to-pink-500',
        bgColor: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
        size: 'w-20 h-20',
        glowColor: 'shadow-purple-500/50',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      },
      3: {
        icon: Crown,
        title: 'Elite Reward',
        color: 'from-yellow-400 to-orange-500',
        bgColor: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
        size: 'w-24 h-24',
        glowColor: 'shadow-yellow-500/50',
        badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      }
    };
    return configs[tier as keyof typeof configs];
  };

  const handleClaim = async (tier: number) => {
    setClaimingTier(tier);
    
    try {
      // Navigate to dedicated welcome rewards claim page
      const searchParams = new URLSearchParams({
        tier: tier.toString(),
        source: 'welcome'
      });
      
      navigate(`/claim-welcome-rewards?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('Error navigating to claim page:', error);
      setClaimingTier(null);
      toast.error('Failed to navigate to claim page');
    }
  };

  const handleStartTrading = () => {
    navigate('/communities');
  };

  const handleInviteFriends = () => {
    navigate('/referral');
  };

  // Get tier status based on API data
  const getTierStatus = useCallback((tier: number) => {
    if (!referralData) return { isActive: false, isCompleted: false, isClaimed: false, isLocked: true };
    
    const tierKey = `tier${tier}` as keyof typeof referralData.rewards;
    const tierReward = referralData.rewards[tierKey];
    
    // Tier 1 is never locked - it's always active for users who haven't completed their first trade
    if (tier === 1) {
      const isActive = !tierReward.claimed && !tierReward.eligible; // Active when not claimed and not yet eligible (pending first trade)
      const isCompleted = tierReward.eligible && !tierReward.claimed; // Completed when eligible but not claimed
      const isClaimed = tierReward.claimed;
      const isLocked = false; // Tier 1 is never locked
      
      return { isActive, isCompleted, isClaimed, isLocked };
    }
    
    // For Tier 2 and 3, check if previous tier is claimed to determine if they should be unlocked
    const previousTierKey = `tier${tier - 1}` as keyof typeof referralData.rewards;
    const previousTierReward = referralData.rewards[previousTierKey];
    const isPreviousTierClaimed = previousTierReward?.claimed || false;
    
    const isActive = !tierReward.claimed && !tierReward.eligible && isPreviousTierClaimed; // Active when previous tier is claimed but this tier not eligible yet
    const isCompleted = tierReward.eligible && !tierReward.claimed; // Completed when eligible but not claimed
    const isClaimed = tierReward.claimed;
    const isLocked = !isPreviousTierClaimed; // Locked only if previous tier is not claimed
    
    return { isActive, isCompleted, isClaimed, isLocked };
  }, [referralData]);

  // Get tier data based on API response
  const getTierData = useCallback((tier: number): TierData => {
    if (!referralData) {
      return {
        status: 'locked',
        countdown: 0,
        requirement: 'Loading...',
        reward: { description: 'Loading...' }
      };
    }

    const tierKey = `tier${tier}` as keyof typeof referralData.rewards;
    const tierReward = referralData.rewards[tierKey];
    const { isActive, isCompleted, isClaimed, isLocked } = getTierStatus(tier);
    
    let status: 'locked' | 'active' | 'completed' | 'claimed';
    if (isClaimed) status = 'claimed';
    else if (isCompleted) status = 'completed';
    else if (isActive) status = 'active';
    else status = 'locked';

    const requirements = {
      1: 'Complete your first trade',
      2: 'Complete 5 trades (≥$5 each) within a week',
      3: 'Complete 15 trades (≥$5 each) within a month'
    };

    return {
      status,
      countdown: tier === 1 ? countdowns.tier1 : 0,
      requirement: requirements[tier as keyof typeof requirements],
      reward: {
        description: 'Tradable tokens from multiple communities'
      }
    };
  }, [referralData, getTierStatus, countdowns]);

  const getProgressValue = () => {
    if (!referralData) return 0;
    
    const completedTiers = [1, 2, 3].filter(tier => {
      const { isClaimed } = getTierStatus(tier);
      return isClaimed;
    }).length;
    
    return (completedTiers / 3) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full"
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.8
              }}
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`
              }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-12">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Loading Your Welcome Offer...</h2>
              <p className="text-muted-foreground">Checking your reward eligibility</p>
            </div>
          ) : !referralData ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-2">Welcome Offer Not Available</h2>
              <p className="text-muted-foreground mb-6">Unable to load your welcome offer status</p>
              <Button onClick={handleStartTrading} className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Start Trading
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="mb-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Welcome, @{userHandle}!
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your presence makes dapps better. As a welcome gift, we're giving you a chance to get airdrops from multiple communities.
            </p>
            
          </motion.div>

          {/* Deadline Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-orange-700 dark:text-orange-300">Time-Limited Offer</h3>
                </div>
                <div className="text-center">
                  <p className="text-orange-700 dark:text-orange-300 mb-2">
                    <span className="font-bold">Complete your first trade within {formatTime(countdowns.tier1)}</span> to unlock all reward tiers.
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    ⚠️ If the countdown reaches zero, you'll permanently lose access to these welcome rewards.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Your Progress</h3>
                  <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white">
                    {Math.round(getProgressValue())}% Complete
                  </Badge>
                </div>
                <Progress value={getProgressValue()} className="h-3 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{referralData?.user_progress.total_trades || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Trades</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">{referralData?.user_progress.trades_this_week || 0}/5</div>
                    <div className="text-sm text-muted-foreground">Weekly Trades</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-500">{referralData?.user_progress.trades_this_month || 0}/15</div>
                    <div className="text-sm text-muted-foreground">Monthly Trades</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>


          {/* Reward Tiers */}
          <div className="space-y-8">
            {[1, 2, 3].map((tier, index) => {
              const config = getTierConfig(tier);
              const tierData = getTierData(tier);
              const { isActive, isCompleted, isClaimed, isLocked } = getTierStatus(tier);
              const countdown = countdowns[`tier${tier}` as keyof typeof countdowns];
              
              // Clean render - no debug logging

              return (
                <div
                  key={tier}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <Card className={cn(
                    "relative overflow-hidden transition-all duration-500",
                    isActive && "border-2 border-primary/50 shadow-lg",
                    isCompleted && "border-2 border-green-500/50 shadow-lg shadow-green-500/20",
                    isClaimed && "border-2 border-green-500/30 shadow-lg shadow-green-500/10 opacity-75",
                    isLocked && "opacity-60"
                  )}>
                    {/* Background Gradient */}
                    <div className={cn(
                      "absolute inset-0 opacity-10",
                      `bg-gradient-to-br ${config.bgColor}`
                    )} />

                    {/* Tier Number Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className={config.badgeColor}>
                        Tier {tier}
                      </Badge>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {isLocked && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Locked
                        </Badge>
                      )}
                      {isActive && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 gap-1">
                          <Clock className="w-3 h-3" />
                          Active
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1">
                          <Target className="w-3 h-3" />
                          Ready to Claim
                        </Badge>
                      )}
                      {isClaimed && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Claimed
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Icon Section */}
                        <div className="flex-shrink-0">
                          <motion.div
                            className={cn(
                              "relative rounded-2xl flex items-center justify-center",
                              `bg-gradient-to-br ${config.color}`,
                              config.size,
                              isActive && `shadow-2xl ${config.glowColor}`,
                              isCompleted && "shadow-2xl shadow-green-500/50",
                              isClaimed && "shadow-2xl shadow-yellow-500/50"
                            )}
                            animate={isActive ? {
                              scale: [1, 1.05, 1],
                              rotate: [0, 2, -2, 0]
                            } : {}}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }}
                          >
                            <config.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                            
                            {/* Pulsing Ring for Active */}
                            {isActive && (
                              <motion.div
                                className="absolute inset-0 rounded-2xl border-2 border-primary/50"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 0, 0.5]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity
                                }}
                              />
                            )}

                            {/* Checkmark for Claimed */}
                            {isClaimed && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </motion.div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-2xl font-bold mb-2">{config.title}</h3>
                          <p className="text-muted-foreground mb-4">{tierData.requirement}</p>

                          {/* Countdown Timer */}
                          {isActive && countdown > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                  Time Remaining
                                </span>
                              </div>
                              <div className="text-3xl font-mono font-bold text-orange-600 dark:text-orange-400">
                                {formatTime(countdown)}
                              </div>
                            </div>
                          )}

                          {/* Progress Section for Active Tiers */}
                          {isActive && !countdown && referralData && (
                            <div className="mb-4">
                              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  Your Progress
                                </span>
                              </div>
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4">
                                <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-1">
                                  {(() => {
                                    const tierKey = `tier${tier}` as keyof typeof referralData.rewards;
                                    const tierReward = referralData.rewards[tierKey];
                                    return tierReward.progress || 'Get started';
                                  })()}
                                </div>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                  {tier === 2 && `${referralData.user_progress.trades_this_week}/5 trades this week`}
                                  {tier === 3 && `${referralData.user_progress.trades_this_month}/15 trades this month`}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Reward Details */}
                          <div className="mb-6">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                              <Gift className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">Reward Box Contains:</span>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 text-center">
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                {tierData.reward.description}
                              </p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex flex-col gap-2 justify-center md:justify-start">
                            {isLocked && (
                              <Button disabled variant="secondary" className="gap-2">
                                <Lock className="w-4 h-4" />
                                Complete Previous Tier
                              </Button>
                            )}
                            
                            {isActive && (
                              <div style={{ position: 'relative', zIndex: 999 }}>
                                <Button 
                                  onClick={(e) => {
                                    console.log('🚀 START TRADING BUTTON CLICKED');
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleStartTrading();
                                  }}
                                  className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 gap-2"
                                  style={{ 
                                    position: 'relative', 
                                    zIndex: 9999, 
                                    pointerEvents: 'auto' 
                                  }}
                                >
                                  <TrendingUp className="w-4 h-4" />
                                  Start Trading
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                                
                              </div>
                            )}
                            

                            {isCompleted && (
                              <div style={{ position: 'relative', zIndex: 999 }}>
                                <button
                                  onClick={(e) => {
                                    console.log(`🎁 CARD CLAIM BUTTON CLICKED - tier: ${tier}`);
                                    console.log('Event target:', e.target);
                                    console.log('Event currentTarget:', e.currentTarget);
                                    alert(`Card claim button works for tier ${tier}!`);
                                    // Direct navigation
                                    const searchParams = new URLSearchParams({
                                      tier: tier.toString(),
                                      source: 'welcome'
                                    });
                                    navigate(`/claim-welcome-rewards?${searchParams.toString()}`);
                                  }}
                                  onMouseEnter={() => console.log(`🖱️ Hovering card claim button - tier: ${tier}`)}
                                  onMouseDown={() => console.log(`👆 Mouse down on card claim button - tier: ${tier}`)}
                                  onMouseUp={() => console.log(`👆 Mouse up on card claim button - tier: ${tier}`)}
                                  style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: '3px solid #059669',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    position: 'relative',
                                    zIndex: 999,
                                    pointerEvents: 'auto'
                                  }}
                                >
                                  🎁 Claim Reward Box
                                </button>
                              </div>
                            )}

                            {isClaimed && (
                              <Button disabled variant="secondary" className="gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Reward Claimed
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Progress Connector */}
                    {tier < 3 && (
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className={cn(
                          "w-8 h-8 rounded-full border-4 border-background flex items-center justify-center",
                          isClaimed ? "bg-green-500" : isActive ? "bg-primary" : "bg-muted"
                        )}>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </Card>
                  
                </div>
              );
            })}
          </div>

          {/* Invite Friends Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center mt-16"
          >
            <Card className="border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Users className="w-8 h-8 text-indigo-500" />
                  <h3 className="text-2xl font-bold">Want More Reward Boxes?</h3>
                  <Share2 className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
                  Invite your friends to join dapps.co and earn additional reward boxes! 
                  When your friends complete their first trade, you both get exclusive community token airdrops.
                </p>
                <Button 
                  onClick={handleInviteFriends}
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold px-8 py-4 text-lg gap-3"
                >
                  <Users className="w-5 h-5" />
                  Invite Friends
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeOfferPage;
