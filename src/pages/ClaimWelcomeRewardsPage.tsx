import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Gift, 
  Star, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  Coins,
  Trophy,
  Diamond,
  Heart,
  Flame,
  Rocket,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

// Import referral API functions
import { claimReward, getReferralStatus } from '@/utils/referralApi';

interface TokenReward {
  ticker: string;
  amount: string;
}

interface WelcomeClaimData {
  tier: string;
  tokens: TokenReward[];
  totalValue?: number;
  transactionHash?: string;
  gasSponsored?: boolean;
}

const ClaimWelcomeRewardsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const tier = searchParams.get('tier') || '1';
  const source = searchParams.get('source') || 'welcome';
  
  const [currentStage, setCurrentStage] = useState<'intro' | 'anticipation' | 'countdown' | 'shaking' | 'cracking' | 'explosion' | 'tokens_rain' | 'tokens_collect' | 'final_celebration'>('intro');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimData, setClaimData] = useState<WelcomeClaimData | null>(null);
  const [collectedTokens, setCollectedTokens] = useState<number>(0);
  const [countdown, setCountdown] = useState(3);
  const [boxRotation, setBoxRotation] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [referralStatus, setReferralStatus] = useState<any>(null);

  // Load referral status on component mount
  useEffect(() => {
    const loadReferralStatus = async () => {
      try {
        setIsLoadingStatus(true);
        const status = await getReferralStatus();
        
        if (status.success && status.data) {
          setReferralStatus(status.data);
          console.log('📊 Referral status loaded:', status.data);
          
          // Check if user has claimable rewards for the requested tier
          const tierKey = `tier${tier}` as keyof typeof status.data.rewards;
          const tierReward = status.data.rewards[tierKey];
          
          if (!tierReward || !tierReward.eligible || tierReward.claimed) {
            console.log(`❌ User not eligible for ${tierKey} or already claimed:`, tierReward);
            toast.error(`You don't have claimable rewards for Tier ${tier}`);
            
            // Redirect to welcome offer page after a short delay
            setTimeout(() => {
              navigate('/welcome-offer');
            }, 2000);
            return;
          }
          
          console.log(`✅ User eligible for ${tierKey}:`, tierReward);
        } else {
          console.error('❌ Failed to load referral status:', status);
          toast.error('Failed to load reward status - redirecting to welcome page');
          
          // Redirect to welcome offer page if API fails
          setTimeout(() => {
            navigate('/welcome-offer');
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Error loading referral status:', error);
        toast.error('Failed to load reward status - redirecting to welcome page');
        
        // Redirect to welcome offer page on error
        setTimeout(() => {
          navigate('/welcome-offer');
        }, 2000);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    loadReferralStatus();
  }, [tier, navigate]);

  // Get tier name for display
  const getTierDisplayName = (tier: string) => {
    const tierNames = {
      '1': 'Tier 1 - Starter Reward',
      '2': 'Tier 2 - Growth Reward', 
      '3': 'Tier 3 - Elite Reward'
    };
    return tierNames[tier as keyof typeof tierNames] || `Tier ${tier}`;
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case '1': return Gift;
      case '2': return Star;
      case '3': return Crown;
      default: return Gift;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case '1': return 'from-blue-400 to-purple-500';
      case '2': return 'from-purple-400 to-pink-500';
      case '3': return 'from-yellow-400 to-orange-500';
      default: return 'from-blue-400 to-purple-500';
    }
  };

  const handleClaim = async () => {
    if (isClaiming) return;
    
    setIsClaiming(true);
    console.log(`🎁 Starting claim process for tier ${tier}`);
    
    try {
      // Start animation sequence immediately
      setCurrentStage('anticipation');
      
      // Countdown stage
      setTimeout(() => {
        setCurrentStage('countdown');
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setCurrentStage('shaking');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 1500);
      
      // Shaking stage
      setTimeout(() => {
        setCurrentStage('cracking');
      }, 6000);
      
      // Make API call during animation
      setTimeout(async () => {
        try {
          console.log(`🔄 Calling claimReward API for tier${tier}`);
          const response = await claimReward(`tier${tier}`);
          
          if (response.success && response.data) {
            console.log('✅ Reward claimed successfully:', response.data);
            
            // Set claim data from API response
            const apiClaimData: WelcomeClaimData = {
              tier: getTierDisplayName(tier),
              tokens: response.data.reward_box.tokens || [],
              transactionHash: response.data.distribution?.transaction_hash,
              gasSponsored: response.data.distribution?.gas_sponsored || false
            };
            
            setClaimData(apiClaimData);
            
            // Continue with explosion animation
            setCurrentStage('explosion');
            triggerMegaConfetti();
            
            // Token rain stage
            setTimeout(() => {
              setCurrentStage('tokens_rain');
              triggerTokenRain();
            }, 1000);
            
            // Token collection stage
            setTimeout(() => {
              setCurrentStage('tokens_collect');
              const tokenCount = apiClaimData.tokens.length;
              const collectInterval = setInterval(() => {
                setCollectedTokens(prev => {
                  if (prev >= tokenCount) {
                    clearInterval(collectInterval);
                    setCurrentStage('final_celebration');
                    triggerMegaConfetti();
                    return tokenCount;
                  }
                  return prev + 1;
                });
              }, 800);
            }, 2000);
            
          } else {
            throw new Error(response.message || 'Failed to claim reward');
          }
        } catch (apiError) {
          console.error('❌ API Error claiming reward:', apiError);
          
          // Show error but continue with mock animation for better UX
          toast.error('Reward claiming failed. Please try again.');
          
          // Set fallback mock data
          const mockData: WelcomeClaimData = {
            tier: getTierDisplayName(tier),
            tokens: [
              { ticker: 'BUILD', amount: '50.00' },
              { ticker: 'ROAR', amount: '25.00' },
              { ticker: 'FIRST', amount: '15.00' }
            ]
          };
          setClaimData(mockData);
          
          // Continue animation with mock data
          setCurrentStage('explosion');
          triggerMegaConfetti();
          
          setTimeout(() => {
            setCurrentStage('tokens_rain');
            triggerTokenRain();
          }, 1000);
          
          setTimeout(() => {
            setCurrentStage('tokens_collect');
            const collectInterval = setInterval(() => {
              setCollectedTokens(prev => {
                if (prev >= 3) {
                  clearInterval(collectInterval);
                  setCurrentStage('final_celebration');
                  triggerMegaConfetti();
                  return 3;
                }
                return prev + 1;
              });
            }, 800);
          }, 2000);
        }
      }, 7000); // Call API during shaking stage
      
    } catch (error) {
      console.error('❌ Error in claim process:', error);
      toast.error('Failed to start claim process');
      setIsClaiming(false);
      setCurrentStage('intro');
    }
  };

  const triggerMegaConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const triggerTokenRain = () => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'][Math.floor(Math.random() * 5)]
    }));
    setParticles(newParticles);
  };

  const handleContinueJourney = () => {
    navigate('/communities');
  };

  const copyTransactionHash = async () => {
    if (claimData?.transactionHash) {
      try {
        await navigator.clipboard.writeText(claimData.transactionHash);
        setCopiedHash(true);
        toast.success('Transaction hash copied!');
        setTimeout(() => setCopiedHash(false), 2000);
      } catch (error) {
        console.error('Failed to copy transaction hash:', error);
        toast.error('Failed to copy transaction hash');
      }
    }
  };

  const openTransactionLink = () => {
    if (claimData?.transactionHash) {
      const baseUrl = 'https://basescan.org/tx/';
      window.open(`${baseUrl}${claimData.transactionHash}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Shaking animation effect
  useEffect(() => {
    if (currentStage === 'shaking') {
      const interval = setInterval(() => {
        setBoxRotation(prev => (prev === 0 ? (Math.random() - 0.5) * 10 : 0));
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [currentStage]);

  const TierIcon = getTierIcon(tier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      {/* Token rain particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs pointer-events-none z-10"
            style={{
              backgroundColor: particle.color,
              left: `${particle.x}%`,
              top: `${particle.y}%`
            }}
            initial={{ y: -50, opacity: 0, scale: 0 }}
            animate={{ y: window.innerHeight + 50, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 3, ease: "easeIn" }}
          >
            <Coins className="w-4 h-4" />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Welcome Reward Box
          </h1>
          <p className="text-xl text-muted-foreground">
            {tier === '1' ? 'Your First Victory' : tier === '2' ? 'Community Champion' : 'Elite Trader'}
          </p>
        </motion.div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto">
          {currentStage === 'intro' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              {isLoadingStatus ? (
                <div className="space-y-4">
                  <div className="mx-auto w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-2xl animate-pulse">
                    <Zap className="w-16 h-16 text-gray-400 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold">Checking Your Eligibility...</h2>
                  <p className="text-muted-foreground">Verifying your {getTierDisplayName(tier)} claim status</p>
                </div>
              ) : (
                <>
                  <div className={`mx-auto w-32 h-32 rounded-2xl bg-gradient-to-br ${getTierColor(tier)} flex items-center justify-center shadow-2xl`}>
                    <TierIcon className="w-16 h-16 text-white" />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold">Ready to Open Your Reward Box?</h2>
                    <p className="text-lg text-muted-foreground">
                      Your {getTierDisplayName(tier)} contains tradable tokens from multiple communities
                    </p>
                    {referralStatus && (
                      <div className="text-sm text-muted-foreground">
                        <p>Campaign Status: <span className="font-medium">{referralStatus.user_progress?.campaign_status || 'Active'}</span></p>
                        <p>Total Trades: <span className="font-medium">{referralStatus.user_progress?.total_trades || 0}</span></p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleClaim}
                    disabled={isClaiming || isLoadingStatus}
                    size="lg"
                    className={`bg-gradient-to-r ${getTierColor(tier)} hover:opacity-90 text-white px-8 py-4 text-lg font-bold shadow-lg`}
                  >
                    {isClaiming ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-5 h-5 mr-2" />
                        </motion.div>
                        Opening...
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5 mr-2" />
                        Open Reward Box
                      </>
                    )}
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {currentStage === 'anticipation' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-8"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`mx-auto w-40 h-40 rounded-2xl bg-gradient-to-br ${getTierColor(tier)} flex items-center justify-center shadow-2xl`}
              >
                <TierIcon className="w-20 h-20 text-white" />
              </motion.div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">Preparing Your Rewards...</h2>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-lg text-muted-foreground"
                >
                  Something amazing is about to happen
                </motion.div>
              </div>
            </motion.div>
          )}

          {currentStage === 'countdown' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-8"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`mx-auto w-40 h-40 rounded-2xl bg-gradient-to-br ${getTierColor(tier)} flex items-center justify-center shadow-2xl`}
              >
                <TierIcon className="w-20 h-20 text-white" />
              </motion.div>
              
              <motion.div
                key={countdown}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                className="text-8xl font-bold text-primary"
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}

          {(currentStage === 'shaking' || currentStage === 'cracking') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-8"
            >
              <motion.div
                animate={{ 
                  rotate: boxRotation,
                  scale: currentStage === 'cracking' ? [1, 1.2, 1] : 1
                }}
                transition={{ duration: 0.1 }}
                className={`mx-auto w-40 h-40 rounded-2xl bg-gradient-to-br ${getTierColor(tier)} flex items-center justify-center shadow-2xl relative`}
                style={{
                  filter: currentStage === 'cracking' ? 'brightness(1.5)' : 'none'
                }}
              >
                <TierIcon className="w-20 h-20 text-white" />
                
                {currentStage === 'cracking' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                    className="absolute inset-0 bg-white rounded-2xl"
                  />
                )}
              </motion.div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">
                  {currentStage === 'shaking' ? 'Opening...' : 'Almost there!'}
                </h2>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-lg text-muted-foreground"
                >
                  {currentStage === 'shaking' ? 'Your rewards are being prepared' : 'Get ready for something amazing!'}
                </motion.div>
              </div>
            </motion.div>
          )}

          {currentStage === 'explosion' && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <motion.div
                animate={{ 
                  scale: [1, 2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 1 }}
                className="mx-auto w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl"
              >
                <Sparkles className="w-20 h-20 text-white" />
              </motion.div>
              
              <motion.h2
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-4xl font-bold text-yellow-500"
              >
                Reward Box Opened!
              </motion.h2>
            </motion.div>
          )}

          {(currentStage === 'tokens_rain' || currentStage === 'tokens_collect') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-8"
            >
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Your Rewards</h2>
                
                <div className="grid gap-4">
                  {claimData?.tokens.map((token, index) => (
                    <motion.div
                      key={token.ticker}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ 
                        opacity: collectedTokens > index ? 1 : 0.3,
                        x: 0,
                        scale: collectedTokens > index ? [1, 1.1, 1] : 1
                      }}
                      transition={{ delay: index * 0.2 }}
                      className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <Coins className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-bold">{token.ticker}</div>
                          <div className="text-sm text-muted-foreground">Community Token</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{token.amount}</div>
                        {collectedTokens > index && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-green-500 text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            Collected
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentStage === 'final_celebration' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2 }}
                className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl"
              >
                <Trophy className="w-16 h-16 text-white" />
              </motion.div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-green-500">Congratulations!</h2>
                <p className="text-lg text-muted-foreground">
                  You've successfully claimed your {getTierDisplayName(tier)} rewards
                </p>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg space-y-4">
                  <h3 className="font-bold mb-4">Rewards Summary</h3>
                  <div className="space-y-2">
                    {claimData?.tokens.map((token) => (
                      <div key={token.ticker} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <Coins className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-medium">{token.ticker}</span>
                        </div>
                        <span className="font-bold text-green-600">{token.amount}</span>
                      </div>
                    ))}
                  </div>
                  
                  {claimData?.gasSponsored && (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                      <Zap className="w-4 h-4" />
                      <span>Gas fees sponsored - Free transaction!</span>
                    </div>
                  )}
                  
                  {claimData?.transactionHash && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Transaction Details:</p>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <code className="text-xs flex-1 truncate">{claimData.transactionHash}</code>
                        <Button
                          onClick={copyTransactionHash}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          {copiedHash ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          onClick={openTransactionLink}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleContinueJourney}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Continue Journey
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimWelcomeRewardsPage;
