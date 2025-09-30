import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Gift, 
  Star, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  ArrowLeft,
  Zap,
  Coins,
  Trophy,
  Diamond,
  Heart,
  Flame,
  Rocket,
  Plus,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Share2,
  Download,
  Camera,
  Repeat,
  RotateCcw,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

// Import API functions
import { claimReward, claimReferrerReward, getReferrerRewards } from '@/utils/referralApi';

interface TokenReward {
  ticker: string;
  amount: string;
}

interface ClaimData {
  tier: string;
  boxId?: number;
  tokens: TokenReward[];
  transactionHash?: string;
  totalValue?: number;
}

const ClaimRewardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const tier = searchParams.get('tier') || 'tier1';
  const boxId = searchParams.get('boxId');
  const useMockData = searchParams.get('mock') === 'true';
  
  const [currentStage, setCurrentStage] = useState<'intro' | 'anticipation' | 'countdown' | 'shaking' | 'cracking' | 'explosion' | 'tokens_rain' | 'tokens_collect' | 'final_celebration' | 'share_moment'>('intro');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [collectedTokens, setCollectedTokens] = useState<number>(0);
  const [countdown, setCountdown] = useState(3);
  const [boxRotation, setBoxRotation] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const [availableBoxes, setAvailableBoxes] = useState<any[]>([]);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(true);
  const [hasAvailableBoxes, setHasAvailableBoxes] = useState(false);
  const [boxStatistics, setBoxStatistics] = useState<{
    total_boxes: number;
    available_boxes: number;
    opened_boxes: number;
  } | null>(null);

  // Enhanced mock data with 3 tokens per box
  const getMockClaimData = (tier: string): ClaimData => {
    const mockData = {
      tier1: {
        tier: 'tier1',
        tokens: [
          { ticker: 'BUILD', amount: '125.50' },
          { ticker: 'ROAR', amount: '89.25' },
          { ticker: 'FIRST', amount: '67.75' }
        ],
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
        totalValue: 282.50
      },
      tier2: {
        tier: 'tier2',
        tokens: [
          { ticker: 'BUILD', amount: '345.80' },
          { ticker: 'ROAR', amount: '267.45' },
          { ticker: 'ALPHA', amount: '198.30' }
        ],
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        totalValue: 811.55
      },
      tier3: {
        tier: 'tier3',
        tokens: [
          { ticker: 'BUILD', amount: '1,250.00' },
          { ticker: 'ROAR', amount: '987.65' },
          { ticker: 'DIAMOND', amount: '743.20' }
        ],
        transactionHash: '0xfedcba0987654321fedcba0987654321fedcba09',
        totalValue: 2980.85
      }
    };
    
    return mockData[tier as keyof typeof mockData] || mockData.tier1;
  };

  // Fetch available reward boxes on component mount
  useEffect(() => {
    const fetchAvailableBoxes = async () => {
      if (useMockData) {
        // Mock data - simulate having boxes available
        setAvailableBoxes([{ box_id: 123, tier: tier }]);
        setHasAvailableBoxes(true);
        setBoxStatistics({
          total_boxes: 3,
          available_boxes: 3,
          opened_boxes: 0
        });
        setIsLoadingBoxes(false);
        return;
      }

      try {
        setIsLoadingBoxes(true);
        const response = await getReferrerRewards();
        
        if (response.success && response.data) {
          const boxes = response.data.available_boxes || [];
          setAvailableBoxes(boxes);
          setHasAvailableBoxes(boxes.length > 0);
          
          // Store box statistics for display
          if (response.data.box_statistics) {
            setBoxStatistics(response.data.box_statistics);
          }
        } else {
          setHasAvailableBoxes(false);
          setAvailableBoxes([]);
          setBoxStatistics(null);
        }
      } catch (error) {
        console.error('Error fetching available boxes:', error);
        setHasAvailableBoxes(false);
        setAvailableBoxes([]);
        setBoxStatistics(null);
        toast.error('Failed to load reward boxes');
      } finally {
        setIsLoadingBoxes(false);
      }
    };

    fetchAvailableBoxes();
  }, [tier, useMockData]);

  const getTierInfo = (tier: string) => {
    const tierInfo = {
      tier1: {
        name: 'Reward Box',
        subtitle: 'Community Token Rewards',
        icon: Gift,
        color: 'from-blue-400 via-cyan-400 to-teal-500',
        bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
        textColor: 'text-blue-600 dark:text-blue-400',
        glowColor: 'shadow-blue-500/50',
        particles: ['💎', '⭐', '🎉', '✨', '🔥']
      },
      tier2: {
        name: 'Reward Box',
        subtitle: 'Premium Token Collection',
        icon: Star,
        color: 'from-purple-400 via-pink-400 to-rose-500',
        bgColor: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
        textColor: 'text-purple-600 dark:text-purple-400',
        glowColor: 'shadow-purple-500/50',
        particles: ['🌟', '💫', '🎆', '⚡', '🔮']
      },
      tier3: {
        name: 'Reward Box',
        subtitle: 'Elite Token Vault',
        icon: Crown,
        color: 'from-yellow-400 via-orange-400 to-red-500',
        bgColor: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        glowColor: 'shadow-yellow-500/50',
        particles: ['👑', '💰', '🏆', '🎊', '🌈']
      }
    };
    
    return tierInfo[tier as keyof typeof tierInfo] || tierInfo.tier1;
  };

  // Advanced confetti system
  const triggerMegaConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      // Right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });

      // Center burst
      confetti({
        ...defaults,
        particleCount: particleCount * 2,
        origin: { x: 0.5, y: 0.3 }
      });
    }, 250);
  };

  const triggerTokenRain = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      shapes: ['square'],
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    // Multiple waves
    fire(0.25, { spread: 26, startVelocity: 55 });
    setTimeout(() => fire(0.2, { spread: 60 }), 200);
    setTimeout(() => fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 }), 400);
    setTimeout(() => fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 }), 600);
    setTimeout(() => fire(0.1, { spread: 120, startVelocity: 45 }), 800);
  };


  const handleClaim = async () => {
    // Check if boxes are available
    if (!hasAvailableBoxes && !useMockData) {
      toast.error('No reward boxes available to claim');
      return;
    }

    setIsClaiming(true);
    
    try {
      if (useMockData) {
        // Enhanced multi-stage experience
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
        
        // Explosion stage
        setTimeout(() => {
          setCurrentStage('explosion');
          triggerMegaConfetti();
        }, 8000);
        
        // Token rain stage
        setTimeout(() => {
          const mockData = getMockClaimData(tier);
          setClaimData(mockData);
          setCurrentStage('tokens_rain');
          triggerTokenRain();
        }, 9000);
        
        // Token collection stage
        setTimeout(() => {
          setCurrentStage('tokens_collect');
          // Simulate collecting tokens one by one
          const mockData = getMockClaimData(tier);
          let collected = 0;
          const collectInterval = setInterval(() => {
            collected++;
            setCollectedTokens(collected);
            
            if (collected >= mockData.tokens.length) {
              clearInterval(collectInterval);
              setTimeout(() => {
                setCurrentStage('final_celebration');
                triggerMegaConfetti();
              }, 1000);
            }
          }, 800);
        }, 11000);
        
      } else {
        // Real API implementation
        let response;
        
        // Use the first available box if no specific boxId is provided
        const targetBoxId = boxId ? parseInt(boxId) : availableBoxes[0]?.box_id;
        
        if (!targetBoxId) {
          throw new Error('No valid box ID found');
        }

        response = await claimReferrerReward(targetBoxId);
        
        if (response.success && response.data) {
          // Follow same animation sequence with real data
          const rewardData = {
            tier: response.data.reward_box.tier || tier,
            boxId: targetBoxId,
            tokens: response.data.reward_box.tokens || [],
            transactionHash: response.data.distribution?.transaction_hash,
            totalValue: response.data.reward_box.tokens?.reduce((sum, token) => sum + parseFloat(token.amount), 0) || 0
          };
          
          setClaimData(rewardData);
          
          // Start same animation sequence as mock
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
          
          // Explosion stage
          setTimeout(() => {
            setCurrentStage('explosion');
            triggerMegaConfetti();
          }, 8000);
          
          // Token rain stage
          setTimeout(() => {
            setCurrentStage('tokens_rain');
            triggerTokenRain();
          }, 9000);
          
          // Token collection stage
          setTimeout(() => {
            setCurrentStage('tokens_collect');
            // Simulate collecting tokens one by one
            let collected = 0;
            const collectInterval = setInterval(() => {
              collected++;
              setCollectedTokens(collected);
              
              if (collected >= rewardData.tokens.length) {
                clearInterval(collectInterval);
                setTimeout(() => {
                  setCurrentStage('final_celebration');
                  triggerMegaConfetti();
                }, 1000);
              }
            }, 800);
          }, 11000);
          
        } else {
          throw new Error(response.message || 'Failed to claim reward');
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward. Please try again.');
      setIsClaiming(false);
    }
  };

  const copyTransactionHash = async () => {
    if (claimData?.transactionHash) {
      try {
        await navigator.clipboard.writeText(claimData.transactionHash);
        setCopiedHash(true);
        toast.success('🎉 Transaction hash copied!');
        setTimeout(() => setCopiedHash(false), 3000);
      } catch (err) {
        toast.error('Failed to copy transaction hash');
      }
    }
  };

  const shareReward = async () => {
    const tierInfo = getTierInfo(tier);
    const text = `🎉 Just claimed my ${tierInfo.name} on dapps.co! Got ${claimData?.tokens.length} exclusive tokens worth $${claimData?.totalValue?.toFixed(2)}! 🚀`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reward Claimed!',
          text: text,
          url: 'https://dapps.co'
        });
      } catch (err) {
        // Fallback to copy
        navigator.clipboard.writeText(text + ' https://dapps.co');
        toast.success('🎉 Shared to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(text + ' https://dapps.co');
      toast.success('🎉 Shared to clipboard!');
    }
  };

  const restartExperience = () => {
    setCurrentStage('intro');
    setIsClaiming(false);
    setClaimData(null);
    setCollectedTokens(0);
    setCountdown(3);
    setShowTokenDetails(false);
  };

  const tierInfo = getTierInfo(tier);
  const IconComponent = tierInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>


      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 pt-24 md:pt-20">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {/* Intro Stage */}
            {currentStage === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="text-center space-y-12"
              >
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="relative"
                >
                  <div className={cn(
                    "w-48 h-48 mx-auto rounded-3xl flex items-center justify-center shadow-2xl relative",
                    `bg-gradient-to-br ${tierInfo.color}`,
                    tierInfo.glowColor
                  )}>
                    {/* Floating particles around box */}
                    {tierInfo.particles.map((particle, index) => (
                      <motion.div
                        key={index}
                        className="absolute text-2xl"
                        animate={{
                          x: [0, Math.cos(index * 60) * 80, 0],
                          y: [0, Math.sin(index * 60) * 80, 0],
                          rotate: [0, 360],
                          scale: [1, 1.5, 1]
                        }}
                        transition={{
                          duration: 3 + index * 0.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: index * 0.2
                        }}
                      >
                        {particle}
                      </motion.div>
                    ))}
                    
                    <IconComponent className="w-24 h-24 text-white relative z-10" />
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-3xl bg-white/20 animate-pulse"></div>
                  </div>
                </motion.div>
                
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h1 className="text-6xl md:text-7xl font-black mb-4">
                      <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", `${tierInfo.color}`)}>
                        {tierInfo.name}
                      </span>
                    </h1>
                    <p className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 font-light">
                      {tierInfo.subtitle}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20"
                  >
                    <div className="grid grid-cols-2 gap-8 text-center">
                      <div>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {isLoadingBoxes ? '...' : (useMockData ? '3' : (boxStatistics?.available_boxes ?? availableBoxes.length))}
                        </div>
                        <div className="text-sm text-gray-500">Reward Boxes Available</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-green-600">
                          {isLoadingBoxes ? '...' : (useMockData ? '0' : (boxStatistics?.opened_boxes ?? 0))}
                        </div>
                        <div className="text-sm text-gray-500">Boxes Claimed</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full max-w-sm mx-auto"
                  >
                    <Button
                      onClick={handleClaim}
                      size="lg"
                      disabled={isClaiming || (isLoadingBoxes || (!hasAvailableBoxes && !useMockData))}
                      className={cn(
                        "w-full px-8 py-6 text-lg md:text-xl font-black shadow-2xl transition-all duration-500 relative overflow-hidden group",
                        (!hasAvailableBoxes && !useMockData) 
                          ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed"
                          : `bg-gradient-to-r ${tierInfo.color} hover:shadow-3xl text-white border-0`
                      )}
                    >
                      {/* Button glow effect */}
                      {(hasAvailableBoxes || useMockData) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      )}
                      
                      {isLoadingBoxes ? (
                        <>
                          <Sparkles className="w-6 h-6 mr-3 animate-spin" />
                          LOADING...
                          <Sparkles className="w-6 h-6 ml-3 animate-spin" />
                        </>
                      ) : (!hasAvailableBoxes && !useMockData) ? (
                        <>
                          <CheckCircle2 className="w-6 h-6 mr-3" />
                          ALL REWARDS CLAIMED
                          <CheckCircle2 className="w-6 h-6 ml-3" />
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 mr-3 animate-spin" />
                          CLAIM YOUR TREASURE
                          <Rocket className="w-6 h-6 ml-3" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Show guidance when all rewards are claimed */}
                  {!isLoadingBoxes && !hasAvailableBoxes && !useMockData && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-indigo-200/50 dark:border-indigo-700/50"
                    >
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Want More Reward Boxes?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          Invite more friends to earn additional reward boxes! Each friend who completes their first trade unlocks new rewards for both of you.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.location.href = '/referral'}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
                        >
                          <Share2 className="w-5 h-5" />
                          Share Your Referral Link
                          <ExternalLink className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                </div>
              </motion.div>
            )}

            {/* Anticipation Stage */}
            {currentStage === 'anticipation' && (
              <motion.div
                key="anticipation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-8"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className={cn(
                    "w-40 h-40 mx-auto rounded-3xl flex items-center justify-center shadow-2xl",
                    `bg-gradient-to-br ${tierInfo.color}`,
                    tierInfo.glowColor
                  )}
                >
                  <IconComponent className="w-20 h-20 text-white" />
                </motion.div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Preparing Your Treasure...
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Countdown Stage */}
            {currentStage === 'countdown' && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="text-center space-y-12"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity
                  }}
                  className={cn(
                    "w-48 h-48 mx-auto rounded-3xl flex items-center justify-center shadow-2xl",
                    `bg-gradient-to-br ${tierInfo.color}`,
                    tierInfo.glowColor
                  )}
                >
                  <IconComponent className="w-24 h-24 text-white" />
                </motion.div>
                
                <motion.div
                  key={countdown}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-9xl font-black"
                >
                  <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", `${tierInfo.color}`)}>
                    {countdown}
                  </span>
                </motion.div>
                
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Opening in...
                </h2>
              </motion.div>
            )}

            {/* Shaking Stage */}
            {currentStage === 'shaking' && (
              <motion.div
                key="shaking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-8"
              >
                <motion.div
                  animate={{ 
                    x: [-20, 20, -15, 15, -10, 10, -5, 5, 0],
                    y: [-10, 10, -8, 8, -5, 5, -3, 3, 0],
                    rotate: [-5, 5, -4, 4, -3, 3, -2, 2, 0],
                    scale: [1, 1.1, 1.05, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.8,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                  className={cn(
                    "w-48 h-48 mx-auto rounded-3xl flex items-center justify-center shadow-2xl relative",
                    `bg-gradient-to-br ${tierInfo.color}`,
                    tierInfo.glowColor
                  )}
                >
                  <IconComponent className="w-24 h-24 text-white" />
                  
                  {/* Crack effects */}
                  <div className="absolute inset-0 rounded-3xl border-4 border-white/30"></div>
                  <div className="absolute top-1/4 left-1/4 w-1 h-8 bg-white/50 rotate-45"></div>
                  <div className="absolute top-1/3 right-1/4 w-1 h-6 bg-white/50 -rotate-12"></div>
                </motion.div>
                
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Something's happening...
                </h2>
              </motion.div>
            )}

            {/* Cracking Stage */}
            {currentStage === 'cracking' && (
              <motion.div
                key="cracking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-8"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1.1, 1.4, 1.2]
                  }}
                  transition={{ 
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className={cn(
                    "w-48 h-48 mx-auto rounded-3xl flex items-center justify-center shadow-2xl relative",
                    `bg-gradient-to-br ${tierInfo.color}`,
                    tierInfo.glowColor
                  )}
                >
                  <IconComponent className="w-24 h-24 text-white" />
                  
                  {/* Multiple crack effects */}
                  <div className="absolute inset-0 rounded-3xl border-8 border-white/50"></div>
                  <div className="absolute top-0 left-1/2 w-2 h-full bg-white/70 -translate-x-1/2"></div>
                  <div className="absolute left-0 top-1/2 w-full h-2 bg-white/70 -translate-y-1/2"></div>
                  <div className="absolute top-1/4 left-1/4 w-2 h-1/2 bg-white/60 rotate-45"></div>
                  <div className="absolute top-1/4 right-1/4 w-2 h-1/2 bg-white/60 -rotate-45"></div>
                </motion.div>
                
                <motion.h2
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  className="text-4xl font-bold text-gray-900 dark:text-white"
                >
                  CRACK! 💥
                </motion.h2>
              </motion.div>
            )}

            {/* Explosion Stage */}
            {currentStage === 'explosion' && (
              <motion.div
                key="explosion"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 2 }}
                className="text-center space-y-8"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 3, 2],
                    rotate: [0, 180, 360],
                    opacity: [1, 0.8, 0]
                  }}
                  transition={{ duration: 1.5 }}
                  className="w-48 h-48 mx-auto rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 flex items-center justify-center shadow-2xl"
                >
                  <Zap className="w-24 h-24 text-white" />
                </motion.div>
                
                <motion.h1
                  animate={{ 
                    scale: [0, 1.5, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 1 }}
                  className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent"
                >
                  BOOM! 🎆
                </motion.h1>
              </motion.div>
            )}

            {/* Token Rain Stage */}
            {currentStage === 'tokens_rain' && claimData && (
              <motion.div
                key="tokens_rain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-8"
              >
                <motion.h1
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-5xl font-black mb-8"
                >
                  <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                    TREASURE REVEALED! 🎉
                  </span>
                </motion.h1>

                <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
                  {claimData.tokens.map((token, index) => (
                    <motion.div
                      key={token.ticker}
                      initial={{ 
                        opacity: 0, 
                        y: -200,
                        rotate: Math.random() * 360,
                        scale: 0
                      }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        rotate: 0,
                        scale: 1
                      }}
                      transition={{ 
                        delay: index * 0.3,
                        duration: 0.8,
                        type: "spring",
                        bounce: 0.6
                      }}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, 5, -5, 0],
                        transition: { duration: 0.3 }
                      }}
                    >
                      <Card className="border-4 border-gradient-to-r from-yellow-400 to-orange-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer"></div>
                        
                        <CardContent className="p-8 text-center relative">
                          <motion.div
                            animate={{ 
                              rotate: [0, 360],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                              scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                            }}
                            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl"
                          >
                            <Coins className="w-10 h-10 text-white" />
                          </motion.div>
                          
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg px-4 py-2 mb-4">
                            ${token.ticker}
                          </Badge>
                          
                          <div className="text-4xl font-black text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text mb-2">
                            {token.amount}
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            tokens
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: claimData.tokens.length * 0.3 + 0.5 }}
                  className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md mx-auto"
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    💰 Total Value
                  </h3>
                  <div className="text-5xl font-black text-transparent bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text">
                    ${claimData.totalValue?.toFixed(2)}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Token Collection Stage */}
            {currentStage === 'tokens_collect' && claimData && (
              <motion.div
                key="tokens_collect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-8"
              >
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Collecting Your Tokens...
                </h2>
                
                <div className="text-6xl font-black">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                    {collectedTokens}/{claimData.tokens.length}
                  </span>
                </div>
                
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl"
                >
                  <Coins className="w-16 h-16 text-white" />
                </motion.div>
              </motion.div>
            )}

            {/* Final Celebration Stage */}
            {currentStage === 'final_celebration' && claimData && (
              <motion.div
                key="final_celebration"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="space-y-6">
                  <motion.h1
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl md:text-5xl font-black"
                  >
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                      Reward Box Opened!
                    </span>
                  </motion.h1>
                  
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                    Your rewards have been delivered to your wallet
                  </p>

                  {/* Show the rewards earned */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20 max-w-md mx-auto"
                  >
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                      🎁 Your Rewards
                    </h3>
                    <div className="space-y-3">
                      {claimData.tokens.map((token, index) => (
                        <motion.div
                          key={token.ticker}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                              <Coins className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ${token.ticker}
                            </span>
                          </div>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {token.amount}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 justify-center max-w-md mx-auto">
                  <Button
                    onClick={() => navigate('/wallet')}
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-2xl hover:shadow-3xl text-lg px-6 py-4"
                  >
                    <Coins className="w-5 h-5 mr-2" />
                    View My Wallet
                  </Button>
                  
                  <Button
                    onClick={shareReward}
                    variant="outline"
                    size="lg"
                    className="w-full border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950 text-lg px-6 py-4"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share Victory
                  </Button>
                </div>

                {/* Transaction Details */}
                {claimData.transactionHash && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 max-w-2xl mx-auto"
                  >
                    <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center justify-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      Transaction Confirmed
                    </h3>
                    
                    <div className="flex items-center gap-4 justify-center flex-wrap">
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg font-mono">
                        {claimData.transactionHash.slice(0, 12)}...{claimData.transactionHash.slice(-10)}
                      </code>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyTransactionHash}
                        className={copiedHash ? "text-green-600 border-green-300" : ""}
                      >
                        {copiedHash ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copiedHash ? 'Copied!' : 'Copy'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://basescan.org/tx/${claimData.transactionHash}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on BaseScan
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Next Steps */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-8 space-y-6 max-w-2xl mx-auto"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                    <Rocket className="w-6 h-6" />
                    What's Next?
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                    <div className="space-y-3">
                      <div className="text-4xl">🔄</div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Keep Trading</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Complete more trades to unlock higher tier rewards
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-4xl">👥</div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Invite Friends</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Share your referral link to earn more reward boxes
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => navigate('/referral')}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Earn More Rewards
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ClaimRewardPage;