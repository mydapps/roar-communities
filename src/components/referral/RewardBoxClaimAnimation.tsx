import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Sparkles, Crown, Diamond, ExternalLink, Copy, CheckCircle2, Zap, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { RewardToken } from '@/utils/referralApi';

interface RewardBoxClaimAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  tier: string;
  tokens: RewardToken[];
  transactionHash?: string;
  onViewTransaction?: (hash: string) => void;
}

type AnimationStep = 'closed' | 'shaking' | 'opening' | 'exploding' | 'revealing' | 'celebrating' | 'complete';

const tierConfigs = {
  tier1: {
    title: 'Starter Reward Box',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
    icon: <Gift className="w-12 h-12" />,
    particles: '🎁💎⭐',
    celebrationEmoji: '🎉'
  },
  tier2: {
    title: 'Power Reward Box',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
    icon: <Star className="w-12 h-12" />,
    particles: '⭐💫🌟',
    celebrationEmoji: '🚀'
  },
  tier3: {
    title: 'Diamond Reward Box',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
    icon: <Crown className="w-12 h-12" />,
    particles: '👑💎✨',
    celebrationEmoji: '🏆'
  }
};

export const RewardBoxClaimAnimation: React.FC<RewardBoxClaimAnimationProps> = ({
  isOpen,
  onClose,
  tier,
  tokens,
  transactionHash,
  onViewTransaction
}) => {
  const [step, setStep] = useState<AnimationStep>('closed');
  const [copiedHash, setCopiedHash] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  const config = tierConfigs[tier as keyof typeof tierConfigs] || tierConfigs.tier1;

  useEffect(() => {
    if (isOpen) {
      // Animation sequence
      setStep('closed');
      
      // Start shaking after a brief delay
      const shakeTimer = setTimeout(() => setStep('shaking'), 500);
      
      // Start opening
      const openTimer = setTimeout(() => setStep('opening'), 2000);
      
      // Explosion effect
      const explodeTimer = setTimeout(() => {
        setStep('exploding');
        triggerExplosionConfetti();
      }, 3500);
      
      // Reveal tokens
      const revealTimer = setTimeout(() => {
        setStep('revealing');
        setShowTokens(true);
        triggerTokenConfetti();
      }, 4500);
      
      // Final celebration
      const celebrateTimer = setTimeout(() => {
        setStep('celebrating');
        triggerCelebrationConfetti();
      }, 6000);
      
      // Complete
      const completeTimer = setTimeout(() => setStep('complete'), 7000);

      return () => {
        clearTimeout(shakeTimer);
        clearTimeout(openTimer);
        clearTimeout(explodeTimer);
        clearTimeout(revealTimer);
        clearTimeout(celebrateTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setStep('closed');
      setShowTokens(false);
    }
  }, [isOpen]);

  const triggerExplosionConfetti = () => {
    // Main explosion
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981']
    });

    // Side explosions
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0.2, y: 0.7 },
        colors: ['#3B82F6', '#8B5CF6']
      });
      
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 0.8, y: 0.7 },
        colors: ['#F59E0B', '#EF4444']
      });
    }, 200);
  };

  const triggerTokenConfetti = () => {
    // Token-specific confetti
    tokens.forEach((_, index) => {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { 
            x: 0.3 + (index * 0.2), 
            y: 0.8 
          },
          colors: ['#10B981', '#F59E0B', '#8B5CF6']
        });
      }, index * 300);
    });
  };

  const triggerCelebrationConfetti = () => {
    // Final celebration burst
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: randomInRange(0.2, 0.8)
        },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
      });
    }, 250);
  };

  const copyTransactionHash = async () => {
    if (transactionHash) {
      try {
        await navigator.clipboard.writeText(transactionHash);
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      } catch (err) {
        console.error('Failed to copy transaction hash:', err);
      }
    }
  };

  const getBoxVariants = () => {
    switch (step) {
      case 'shaking':
        return {
          rotate: [0, -2, 2, -2, 2, 0],
          scale: [1, 1.02, 0.98, 1.02, 0.98, 1],
          transition: { duration: 1.5, repeat: Infinity }
        };
      case 'opening':
        return {
          scale: [1, 1.1, 1.2],
          rotate: [0, 5, -5, 0],
          transition: { duration: 1.5 }
        };
      case 'exploding':
        return {
          scale: [1.2, 0.8, 1.5],
          rotate: [0, 180, 360],
          opacity: [1, 0.5, 0],
          transition: { duration: 1 }
        };
      default:
        return { scale: 1, rotate: 0, opacity: 1 };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && step === 'complete') {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-md mx-4"
        >
          <Card className={cn(
            "relative overflow-hidden border-2",
            `bg-gradient-to-br ${config.bgColor}`,
            step === 'complete' ? 'border-green-400' : 'border-primary/30'
          )}>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
                  <Badge className={cn(
                    "text-white",
                    `bg-gradient-to-r ${config.color}`
                  )}>
                    {tier.toUpperCase()} REWARD
                  </Badge>
                </div>

                {/* Box Animation */}
                <div className="relative h-32 flex items-center justify-center">
                  {step !== 'exploding' && step !== 'revealing' && step !== 'celebrating' && step !== 'complete' && (
                    <motion.div
                      animate={getBoxVariants()}
                      className={cn(
                        "w-24 h-24 rounded-2xl flex items-center justify-center",
                        `bg-gradient-to-br ${config.color}`,
                        "shadow-2xl"
                      )}
                    >
                      <div className="text-white">
                        {config.icon}
                      </div>
                    </motion.div>
                  )}

                  {/* Explosion particles */}
                  {(step === 'exploding' || step === 'revealing') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                            x: Math.cos((i * 30) * Math.PI / 180) * 60,
                            y: Math.sin((i * 30) * Math.PI / 180) * 60,
                          }}
                          transition={{
                            duration: 1.5,
                            delay: i * 0.1,
                            ease: "easeOut"
                          }}
                          className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                        />
                      ))}
                    </div>
                  )}

                  {/* Status Messages */}
                  {step === 'shaking' && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 text-sm text-muted-foreground"
                    >
                      The box is getting excited...
                    </motion.p>
                  )}

                  {step === 'opening' && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 text-sm text-primary font-medium"
                    >
                      Opening your reward box...
                    </motion.p>
                  )}

                  {step === 'exploding' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-6xl"
                    >
                      💥
                    </motion.div>
                  )}
                </div>

                {/* Token Reveal */}
                <AnimatePresence>
                  {showTokens && (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-xl font-bold">Congratulations!</h3>
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                      </div>

                      <p className="text-muted-foreground mb-4">
                        You've received these community tokens:
                      </p>

                      <div className="space-y-3">
                        {tokens.map((token, index) => (
                          <motion.div
                            key={token.ticker}
                            initial={{ opacity: 0, x: -50, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: index * 0.2 }}
                            className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <motion.div
                                animate={{ 
                                  rotate: [0, 360],
                                  scale: [1, 1.1, 1]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: index * 0.3
                                }}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold"
                              >
                                {token.ticker.charAt(0)}
                              </motion.div>
                              <div>
                                <p className="font-semibold">${token.ticker}</p>
                                <p className="text-sm text-muted-foreground">Community Token</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                +{parseFloat(token.amount).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">tokens</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Transaction Info */}
                      {transactionHash && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-700 dark:text-green-400">
                              Tokens Distributed Successfully!
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Transaction:</span>
                            <code className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono">
                              {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={copyTransactionHash}
                              className="h-6 px-2"
                            >
                              {copiedHash ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            {onViewTransaction && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onViewTransaction(transactionHash)}
                                className="h-6 px-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      {step === 'complete' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                          className="flex gap-3 pt-4"
                        >
                          <Button
                            onClick={onClose}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Awesome!
                          </Button>
                          <Button
                            onClick={() => window.location.href = '/wallet'}
                            variant="outline"
                            className="flex-1"
                          >
                            <Coins className="w-4 h-4 mr-2" />
                            View Wallet
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading states */}
                {!showTokens && step !== 'closed' && (
                  <div className="space-y-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 mx-auto"
                    >
                      <Sparkles className="w-8 h-8 text-primary" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">
                      {step === 'shaking' && "Preparing your reward..."}
                      {step === 'opening' && "Unlocking the magic..."}
                      {step === 'exploding' && "Distributing tokens..."}
                      {step === 'revealing' && "Almost there..."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  animate={{
                    x: [0, Math.random() * 400 - 200],
                    y: [0, Math.random() * 600 - 300],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
