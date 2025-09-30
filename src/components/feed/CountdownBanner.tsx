import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Gift, X, Trophy, Star, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import referral API functions
import { getReferralStatus } from '@/utils/referralApi';

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
  rewards: {
    tier1: { eligible: boolean; claimed: boolean; progress: string; };
    tier2: { eligible: boolean; claimed: boolean; progress: string; };
    tier3: { eligible: boolean; claimed: boolean; progress: string; };
  };
}

const CountdownBanner: React.FC = () => {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<ReferralStatusData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
            setTimeLeft(response.data.user_progress.countdown_seconds_remaining);
            setIsVisible(true);
          } else {
            // Check if user has eligible rewards to claim
            const hasEligibleRewards = Object.values(response.data.rewards).some(
              reward => reward.eligible && !reward.claimed
            );
            
            // Check if user has active tiers to work towards (previous tier claimed but this tier not claimed)
            const hasActiveTiers = Object.entries(response.data.rewards).some(([tierKey, reward]) => {
              const tierNum = parseInt(tierKey.replace('tier', ''));
              if (tierNum === 1) return false; // Skip tier 1
              
              const prevTierKey = `tier${tierNum - 1}` as keyof typeof response.data.rewards;
              const prevTierReward = response.data.rewards[prevTierKey];
              
              // Active if previous tier is claimed but this tier is not claimed
              return prevTierReward?.claimed && !reward.claimed;
            });
            
            setIsVisible(hasEligibleRewards || hasActiveTiers);
          }
          
          console.log('📊 Referral status loaded for banner:', response.data);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('❌ Error loading referral status for banner:', error);
        setIsVisible(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadReferralStatus();

    // Listen for trade completion events to refresh data
    const handleTradeCompleted = () => {
      console.log('🔄 Trade completed, refreshing referral status...');
      loadReferralStatus();
    };

    // Add event listener for trade completions
    window.addEventListener('tradeCompleted', handleTradeCompleted);

    // Also refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      if (referralData) {
        loadReferralStatus();
      }
    }, 30000);

    return () => {
      window.removeEventListener('tradeCompleted', handleTradeCompleted);
      clearInterval(refreshInterval);
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0 || !referralData?.user_progress.countdown_active) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, referralData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current tier info for display
  const getCurrentTierInfo = () => {
    if (!referralData) return null;
    
    const { rewards } = referralData;
    
    // First check which tier is currently eligible for claiming
    if (rewards.tier1.eligible && !rewards.tier1.claimed) {
      return { tier: 1, icon: Gift, name: 'Starter Reward' };
    } else if (rewards.tier2.eligible && !rewards.tier2.claimed) {
      return { tier: 2, icon: Star, name: 'Growth Reward' };
    } else if (rewards.tier3.eligible && !rewards.tier3.claimed) {
      return { tier: 3, icon: Crown, name: 'Elite Reward' };
    }
    
    // If no tier is eligible, check for active tiers (previous tier claimed but this tier not claimed)
    if (rewards.tier1.claimed && !rewards.tier2.claimed) {
      return { tier: 2, icon: Star, name: 'Growth Reward' };
    } else if (rewards.tier2.claimed && !rewards.tier3.claimed) {
      return { tier: 3, icon: Crown, name: 'Elite Reward' };
    }
    
    return null;
  };

  const handleClaimNow = () => {
    const tierInfo = getCurrentTierInfo();
    if (tierInfo) {
      const tierKey = `tier${tierInfo.tier}` as keyof typeof referralData.rewards;
      const tierReward = referralData.rewards[tierKey];
      const isEligible = tierReward.eligible && !tierReward.claimed;
      
      if (isEligible) {
        // Tier is eligible - go to claim page
        navigate(`/claim-welcome-rewards?tier=${tierInfo.tier}&source=banner`);
      } else {
        // Tier is active but not eligible - go to welcome offer page to see progress
        navigate('/welcome-offer');
      }
    } else {
      navigate('/welcome-offer');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't show banner if loading or not visible
  if (isLoading || !isVisible || !referralData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="fixed top-16 left-0 right-0 w-full bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-pink-950/20 border-b border-orange-200/50 dark:border-orange-800/50 z-10"
      >
        <div className="max-w-7xl mx-auto px-3 py-1.5">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* Message with icon - centered */}
            <div className="flex items-center gap-2 min-w-0">
              {(() => {
                const tierInfo = getCurrentTierInfo();
                const IconComponent = tierInfo?.icon || Gift;
                
                return (
                  <>
                    <IconComponent className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {referralData.user_progress.countdown_active ? (
                        <>
                          {/* Mobile: Show concise message */}
                          <span className="sm:hidden">
                            <span className="font-medium text-orange-600 dark:text-orange-400">Complete first trade</span>
                            {' '}→{' '}
                            <span className="font-medium text-pink-600 dark:text-pink-400">win reward box</span>
                          </span>
                          {/* Desktop: Show full message */}
                          <span className="hidden sm:inline">
                            <span className="font-medium text-orange-600 dark:text-orange-400">Complete your first trade</span>
                            {' '}→{' '}
                            <span className="font-medium text-pink-600 dark:text-pink-400">win {tierInfo?.name || 'reward box'}</span>
                            <span> with community token airdrops</span>
                          </span>
                        </>
                      ) : tierInfo ? (
                        (() => {
                          const tierKey = `tier${tierInfo.tier}` as keyof typeof referralData.rewards;
                          const tierReward = referralData.rewards[tierKey];
                          const isEligible = tierReward.eligible && !tierReward.claimed;
                          
                          if (isEligible) {
                            // Tier is eligible for claiming
                            return (
                              <>
                                {/* Mobile: Show concise message */}
                                <span className="sm:hidden">
                                  <span className="font-medium text-green-600 dark:text-green-400">{tierInfo.name} ready</span>
                                  {' '}→{' '}
                                  <span className="font-medium text-pink-600 dark:text-pink-400">claim now</span>
                                </span>
                                {/* Desktop: Show full message */}
                                <span className="hidden sm:inline">
                                  <span className="font-medium text-green-600 dark:text-green-400">Your {tierInfo.name} is ready</span>
                                  {' '}→{' '}
                                  <span className="font-medium text-pink-600 dark:text-pink-400">claim your community token airdrops</span>
                                </span>
                              </>
                            );
                          } else {
                            // Tier is active (unlocked but not eligible yet)
                            const progressText = tierReward.progress || 'Get started';
                            return (
                              <>
                                {/* Mobile: Show concise message */}
                                <span className="sm:hidden">
                                  <span className="font-medium text-blue-600 dark:text-blue-400">Work on {tierInfo.name}</span>
                                  {' '}→{' '}
                                  <span className="font-medium text-pink-600 dark:text-pink-400">check progress</span>
                                </span>
                                {/* Desktop: Show full message */}
                                <span className="hidden sm:inline">
                                  <span className="font-medium text-blue-600 dark:text-blue-400">Work towards {tierInfo.name}</span>
                                  {' '}→{' '}
                                  <span className="font-medium text-pink-600 dark:text-pink-400">{progressText}</span>
                                </span>
                              </>
                            );
                          }
                        })()
                      ) : (
                        <span className="font-medium text-blue-600 dark:text-blue-400">Check your welcome rewards</span>
                      )}
                    </p>
                  </>
                );
              })()}
            </div>

            {/* Center - Countdown (only show if countdown is active) */}
            {referralData.user_progress.countdown_active && timeLeft > 0 && (
              <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-mono font-bold">
                <Clock className="w-3 h-3" />
                <motion.span
                  key={timeLeft}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className={timeLeft < 300 ? 'text-yellow-200' : 'text-white'}
                >
                  {formatTime(timeLeft)}
                </motion.span>
              </div>
            )}

            {/* Right side - CTA and Close */}
            <div className="flex items-center gap-1 sm:gap-2">
              {(() => {
                const tierInfo = getCurrentTierInfo();
                if (tierInfo) {
                  const tierKey = `tier${tierInfo.tier}` as keyof typeof referralData.rewards;
                  const tierReward = referralData.rewards[tierKey];
                  const isEligible = tierReward.eligible && !tierReward.claimed;
                  
                  return (
                    <button
                      onClick={handleClaimNow}
                      className={`${
                        isEligible 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white text-xs font-medium px-2 sm:px-3 py-1 rounded-full transition-colors duration-200 whitespace-nowrap`}
                    >
                      {isEligible ? (
                        <>
                          <span className="sm:hidden">Claim</span>
                          <span className="hidden sm:inline">Claim Now</span>
                        </>
                      ) : (
                        <>
                          <span className="sm:hidden">Check</span>
                          <span className="hidden sm:inline">Check Progress</span>
                        </>
                      )}
                    </button>
                  );
                } else {
                  return (
                    <button
                      onClick={handleClaimNow}
                      className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-2 sm:px-3 py-1 rounded-full transition-colors duration-200 whitespace-nowrap"
                    >
                      <span className="sm:hidden">Claim</span>
                      <span className="hidden sm:inline">Claim Now</span>
                    </button>
                  );
                }
              })()}
              <button
                onClick={handleClose}
                className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CountdownBanner;
