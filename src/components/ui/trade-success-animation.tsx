import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TradeSuccessAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  amount: string;
  tokenSymbol: string;
  tokenAvatar?: string;
  action: 'buy' | 'sell';
}

const TradeSuccessAnimation: React.FC<TradeSuccessAnimationProps> = ({
  isVisible,
  onComplete,
  amount,
  tokenSymbol,
  tokenAvatar,
  action
}) => {
  useEffect(() => {
    if (isVisible) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const runConfetti = () => {
        confetti({
          particleCount: 50,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.3),
            y: Math.random() - 0.2
          },
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
        });
        confetti({
          particleCount: 50,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.7, 0.9),
            y: Math.random() - 0.2
          },
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
        });
      };

      // Initial burst
      runConfetti();
      
      // Additional bursts
      const interval = setInterval(() => {
        if (Date.now() < animationEnd) {
          runConfetti();
        } else {
          clearInterval(interval);
        }
      }, 250);

      // Auto close after 4 seconds
      const timeout = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
          className="fixed inset-0 z-[10000] overflow-hidden cursor-pointer"
          style={{ 
            background: action === 'buy' 
              ? 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)'
              : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)'
          }}
        >
          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 100,
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  y: -100,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                <Sparkles className="w-6 h-6 text-white/60" />
              </motion.div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex flex-col items-center justify-center h-full text-white px-8">
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
              className="mb-8"
            >
              <div className="relative">
                <CheckCircle className="w-24 h-24 text-white" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute -inset-4 border-4 border-white/30 rounded-full"
                />
              </div>
            </motion.div>

            {/* Action text */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center mb-6"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {action === 'buy' ? 'Purchase' : 'Sale'} Complete!
              </h1>
              <p className="text-xl md:text-2xl text-white/90">
                Order successfully placed
              </p>
            </motion.div>

            {/* Amount display */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                {action === 'buy' ? (
                  <TrendingUp className="w-8 h-8 text-white" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-white" />
                )}
                {tokenAvatar && (
                  <img 
                    src={tokenAvatar} 
                    alt={tokenSymbol}
                    className="w-12 h-12 rounded-full border-2 border-white/30"
                  />
                )}
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                <p className="text-2xl md:text-3xl font-bold">
                  {amount}
                </p>
                <p className="text-lg text-white/80">
                  {tokenSymbol} {action === 'buy' ? 'purchased' : 'sold'}
                </p>
              </div>
            </motion.div>

            {/* Tap to continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="text-center"
            >
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-lg text-white/70"
              >
                Tap anywhere to continue
              </motion.p>
            </motion.div>
          </div>

          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`bg-${i}`}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 0.1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 4,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-32 h-32 border border-white/10 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradeSuccessAnimation;

