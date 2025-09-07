import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Crown, Users, TrendingUp, Sparkles, Star, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommunityCreationSuccessProps {
  isVisible: boolean;
  onComplete: () => void;
  communityName: string;
  ticker: string;
  ethAmount: string;
  rewardPercent?: number;
  tokenData?: any;
}

const CommunityCreationSuccess: React.FC<CommunityCreationSuccessProps> = ({
  isVisible,
  onComplete,
  communityName,
  ticker,
  ethAmount,
  rewardPercent,
  tokenData
}) => {
  useEffect(() => {
    if (isVisible) {
      // Enhanced confetti with community-themed colors
      const duration = 5000;
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

      // Multiple confetti bursts with community colors
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = Math.floor(60 * (timeLeft / duration));
        
        // Center burst - Crown colors (gold/yellow)
        confetti({
          ...defaults,
          particleCount: particleCount * 2,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B']
        });
        
        // Left side cascade - Community colors (blue/purple)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.2, 0.4) },
          colors: ['#3B82F6', '#2563EB', '#1D4ED8', '#8B5CF6', '#A855F7']
        });
        
        // Right side cascade - Success colors (green/emerald)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.2, 0.4) },
          colors: ['#10B981', '#059669', '#047857', '#34D399', '#6EE7B7']
        });
      }, 200);

      // Auto-complete after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);

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
          className="fixed inset-0 backdrop-blur-md z-50 overflow-hidden cursor-pointer"
          style={{ backgroundColor: '#1e40af' }} // Blue background
        >
          {/* Floating Community Images or Crown Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
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
                  scale: [0, 1.2, 1, 0.3],
                  rotate: [0, 180, 360, 540]
                }}
                transition={{ 
                  delay: i * 0.15,
                  duration: 3.5 + Math.random() * 2,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
                className="absolute"
                style={{
                  left: Math.random() * (window.innerWidth - 80),
                }}
              >
                {tokenData?.image ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                    <img 
                      src={tokenData.image} 
                      alt="Community Token"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Floating Community Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`community-${i}`}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.2, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  delay: 0.5 + i * 0.3,
                  duration: 3,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                {i % 3 === 0 ? (
                  <Users className="w-6 h-6 text-white/60" />
                ) : i % 3 === 1 ? (
                  <TrendingUp className="w-6 h-6 text-green-400/60" />
                ) : (
                  <Sparkles className="w-6 h-6 text-yellow-400/60" />
                )}
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
              {/* Success Icon with Crown or Community Image */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-8"
              >
                <div className="relative">
                  <div className="relative">
                    {tokenData?.image ? (
                      <div className="relative w-28 h-28 mx-auto">
                        <img 
                          src={tokenData.image} 
                          alt={communityName}
                          className="w-28 h-28 rounded-full object-cover border-4 border-white/20 drop-shadow-2xl"
                          onError={(e) => {
                            // Fallback to default icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <CheckCircle className="w-28 h-28 text-white mx-auto drop-shadow-2xl hidden" />
                      </div>
                    ) : (
                      <CheckCircle className="w-28 h-28 text-white mx-auto drop-shadow-2xl" />
                    )}
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8, type: 'spring' }}
                      className="absolute -top-4 -right-4"
                    >
                      <Crown className="w-12 h-12 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                    </motion.div>
                  </div>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.4, 1], 
                      opacity: [0.3, 0, 0.3] 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 w-28 h-28 border-4 border-white/40 rounded-full mx-auto"
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
                  🎉 Community Created!
                </motion.h1>
                
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-2xl font-semibold text-white/90 mb-4"
                >
                  Welcome to <span className="text-yellow-400">{communityName}</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="space-y-2 text-white/80"
                >
                  <p className="text-lg">
                    Token: <span className="font-bold text-yellow-400">${ticker}</span>
                  </p>
                  <p className="text-lg">
                    Initial Investment: <span className="font-bold text-green-400">{ethAmount} ETH</span>
                  </p>
                </motion.div>
              </motion.div>

              {/* Achievement Badges */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
                >
                  <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-white/80 font-semibold">Community Founder</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
                >
                  <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-white/80 font-semibold">Earning 0.25%</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
                >
                  <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-white/80 font-semibold">DAO Leader</p>
                </motion.div>
              </motion.div>

              {/* Tap to Continue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="text-center"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-flex items-center gap-2 text-white/60 text-sm"
                >
                  <Rocket className="w-4 h-4" />
                  Tap anywhere to continue to your community
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommunityCreationSuccess;






