import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, TrendingUp, Sparkles, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  amount: string;
  tokenSymbol: string;
  tokenAvatar: string;
  action: 'buy' | 'sell';
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  isVisible,
  onComplete,
  amount,
  tokenSymbol,
  tokenAvatar,
  action
}) => {
  useEffect(() => {
    if (isVisible) {
      // Enhanced confetti with token-themed colors
      const duration = 4000;
      const animationEnd = Date.now() + duration;
      const defaults = { 
        startVelocity: 30, 
        spread: 360, 
        ticks: 80, 
        zIndex: 0,
        gravity: 0.8,
        drift: 0.1
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      // Multiple confetti bursts
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = Math.floor(60 * (timeLeft / duration));
        
        // Center burst
        confetti({
          ...defaults,
          particleCount: particleCount * 2,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#10B981', '#059669', '#047857']
        });
        
        // Left side cascade
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.2, 0.4) },
          colors: ['#10B981', '#059669', '#047857']
        });
        
        // Right side cascade
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.2, 0.4) },
          colors: ['#10B981', '#059669', '#047857']
        });
      }, 200);

      // Auto-complete after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
          className="fixed inset-0 backdrop-blur-md z-[9999] overflow-hidden"
          style={{ backgroundColor: '#2fbcc3' }}
        >
          {/* Token Avatar Confetti */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: -100,
                  opacity: 0,
                  scale: 0,
                  rotate: 0
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 1, 0.5],
                  rotate: [0, 360, 720, 1080]
                }}
                transition={{ 
                  delay: i * 0.1,
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
                className="absolute text-4xl"
                style={{
                  left: Math.random() * (window.innerWidth - 60),
                }}
              >
                {tokenAvatar}
              </motion.div>
            ))}
          </div>

          {/* Subtle Floating Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`element-${i}`}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  opacity: [0, 0.3, 0],
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  delay: 0.5 + i * 0.3,
                  duration: 3,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                <CheckCircle className="w-6 h-6 text-white/40" />
              </motion.div>
            ))}
          </div>

          {/* Central Success Content */}
          <div className="flex items-center justify-center min-h-screen p-8">
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
              className="text-center"
            >
              {/* Professional Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.1, 1] }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-8"
              >
                <div className="relative">
                  <CheckCircle className="w-24 h-24 text-white mx-auto drop-shadow-2xl" />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1], 
                      opacity: [0.2, 0, 0.2] 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 w-24 h-24 border-2 border-white/30 rounded-full mx-auto"
                  />
                </div>
              </motion.div>

              {/* Success Message */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mb-8"
              >
                <motion.h1 
                  className="text-5xl font-bold mb-4 text-white"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  Order Placed
                </motion.h1>
                
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-2xl font-semibold text-white/90 mb-4"
                >
                  {action === 'buy' ? 'Purchased' : 'Sold'} {amount} {tokenSymbol}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center justify-center gap-3 text-lg text-white/80"
                >
                  <span>Your order has been successfully processed</span>
                  <CheckCircle className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>

              {/* Tap to Continue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="text-lg text-muted-foreground"
              >
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  Tap anywhere to continue
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;
