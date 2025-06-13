import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpecialEffectsProps {
  effect: 'buzz' | 'eth' | 'btc' | 'base' | 'sol' | 'dapps' | 'heart' | null;
  onComplete: () => void;
}

const SpecialEffects: React.FC<SpecialEffectsProps> = ({ effect, onComplete }) => {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!effect) return;

    let timeout: NodeJS.Timeout;

    // Apply shake effect to the entire document body for /buzz
    if (effect === 'buzz') {
      setIsShaking(true);
      document.body.style.animation = 'earthquake 1s ease-in-out';
      
      timeout = setTimeout(() => {
        setIsShaking(false);
        document.body.style.animation = '';
        onComplete();
      }, 1000);
    } else {
      // For other effects, complete after animation duration
      const duration = effect === 'dapps' ? 5000 : 3000; // DAPPS gets longer duration
      timeout = setTimeout(() => {
        onComplete();
      }, duration);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
      document.body.style.animation = '';
    };
  }, [effect, onComplete]);

  // Add earthquake keyframes to document head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes earthquake {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        10% { transform: translate(-10px, -10px) rotate(-1deg); }
        20% { transform: translate(10px, -5px) rotate(1deg); }
        30% { transform: translate(-8px, 8px) rotate(0deg); }
        40% { transform: translate(8px, 5px) rotate(1deg); }
        50% { transform: translate(-5px, -8px) rotate(-1deg); }
        60% { transform: translate(5px, 8px) rotate(0deg); }
        70% { transform: translate(-3px, -5px) rotate(-1deg); }
        80% { transform: translate(3px, 3px) rotate(1deg); }
        90% { transform: translate(-1px, -1px) rotate(0deg); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Love/Heart Effect - Big animated heart in center */}
      <AnimatePresence>
        {effect === 'heart' && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Main heart animation */}
            <motion.div
              className="text-9xl"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 1.2, 1, 1.1, 0],
                rotate: [0, -10, 10, -5, 0],
              }}
              transition={{ 
                duration: 2.5,
                times: [0, 0.3, 0.6, 0.8, 1],
                ease: "easeInOut"
              }}
            >
              ❤️
            </motion.div>

            {/* Transform to kissing emoji */}
            <motion.div
              className="absolute text-9xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 0, 1.2, 1, 0],
                opacity: [0, 0, 1, 1, 0],
              }}
              transition={{ 
                duration: 2.5,
                times: [0, 0.6, 0.7, 0.9, 1],
                ease: "easeInOut"
              }}
            >
              😘
            </motion.div>

            {/* Floating hearts around */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                style={{
                  left: `${50 + Math.cos(i * 30 * Math.PI / 180) * 200}px`,
                  top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 200}px`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  y: [0, -50],
                }}
                transition={{ 
                  duration: 2,
                  delay: 0.5 + i * 0.1,
                  ease: "easeOut"
                }}
              >
                💕
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ETH Effect - Raining ETH with glow */}
      <AnimatePresence>
        {effect === 'eth' && (
          <motion.div className="fixed inset-0">
            {/* Background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-transparent to-blue-500/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 3 }}
            />
            
            {/* ETH symbols raining */}
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-6xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  color: '#627EEA',
                  textShadow: '0 0 20px rgba(98, 126, 234, 0.8)',
                }}
                initial={{ y: -100, opacity: 0, rotate: 0 }}
                animate={{ 
                  y: window.innerHeight + 100,
                  opacity: [0, 1, 1, 0],
                  rotate: 360,
                }}
                transition={{ 
                  duration: 3,
                  delay: i * 0.1,
                  ease: "easeIn"
                }}
              >
                ⟠
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BTC Effect - Golden Bitcoin explosion */}
      <AnimatePresence>
        {effect === 'btc' && (
          <motion.div className="fixed inset-0 flex items-center justify-center">
            {/* Central explosion */}
            <motion.div
              className="text-8xl"
              style={{ color: '#F7931A', textShadow: '0 0 30px rgba(247, 147, 26, 0.8)' }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              ₿
            </motion.div>

            {/* Radiating bitcoins */}
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                style={{ 
                  color: '#F7931A',
                  textShadow: '0 0 15px rgba(247, 147, 26, 0.6)'
                }}
                initial={{ 
                  scale: 0, 
                  x: 0, 
                  y: 0,
                  rotate: 0
                }}
                animate={{ 
                  scale: [0, 1, 0.5],
                  x: Math.cos(i * 22.5 * Math.PI / 180) * 300,
                  y: Math.sin(i * 22.5 * Math.PI / 180) * 300,
                  rotate: 720,
                }}
                transition={{ 
                  duration: 2.5,
                  delay: 0.5,
                  ease: "easeOut"
                }}
              >
                ₿
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOL Effect - Purple spiral */}
      <AnimatePresence>
        {effect === 'sol' && (
          <motion.div className="fixed inset-0 flex items-center justify-center">
            {/* Spiral effect */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-5xl"
                style={{ 
                  color: '#9945FF',
                  textShadow: '0 0 20px rgba(153, 69, 255, 0.8)'
                }}
                initial={{ 
                  scale: 0,
                  x: 0,
                  y: 0,
                  rotate: 0
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: Math.cos(i * 18 * Math.PI / 180 + Date.now() * 0.001) * (50 + i * 15),
                  y: Math.sin(i * 18 * Math.PI / 180 + Date.now() * 0.001) * (50 + i * 15),
                  rotate: i * 18,
                }}
                transition={{ 
                  duration: 3,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              >
                ◎
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BASE Effect - Blue wave */}
      <AnimatePresence>
        {effect === 'base' && (
          <motion.div className="fixed inset-0">
            {/* Wave effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-blue-400/30 to-blue-600/30"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            
            {/* Base logos in wave pattern */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-6xl"
                style={{
                  left: `${(i * 7) % 100}%`,
                  top: `${50 + Math.sin(i * 0.5) * 20}%`,
                  color: '#0052FF',
                  textShadow: '0 0 25px rgba(0, 82, 255, 0.8)',
                }}
                initial={{ scale: 0, y: 50 }}
                animate={{ 
                  scale: [0, 1.2, 1, 0],
                  y: [50, 0, -20, -50],
                }}
                transition={{ 
                  duration: 2.5,
                  delay: i * 0.15,
                  ease: "easeOut"
                }}
              >
                🔵
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DAPPS Effect - EPIC PLATFORM SHOWCASE */}
      <AnimatePresence>
        {effect === 'dapps' && (
          <motion.div className="fixed inset-0">
            {/* Stage 1: Epic screen flash with rainbow gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 via-purple-600 via-pink-500 to-orange-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.4, times: [0, 0.15, 1] }}
            />
            
            {/* Stage 2: Multiple DAPPS logos launching from corners */}
            {[
              { from: 'bottom-left', x: -200, y: 200 },
              { from: 'bottom-right', x: 200, y: 200 },
              { from: 'top-left', x: -200, y: -200 },
              { from: 'top-right', x: 200, y: -200 }
            ].map((corner, i) => (
              <motion.div
                key={corner.from}
                className="absolute top-1/2 left-1/2"
                initial={{ x: corner.x, y: corner.y, scale: 0.3, rotate: 0 }}
                animate={{ 
                  x: 0, 
                  y: 0, 
                  scale: [0.3, 1.2, 0.8], 
                  rotate: [0, 360, 720] 
                }}
                transition={{ 
                  delay: 0.4 + i * 0.1, 
                  duration: 1.2, 
                  ease: "easeOut" 
                }}
              >
                <img 
                  src="/dapps.png" 
                  alt="DAPPS" 
                  className="w-16 h-16 drop-shadow-2xl"
                />
              </motion.div>
            ))}
            
            {/* Stage 3: Central DAPPS logo explosion */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 3, 1.5], 
                rotate: [0, 180, 360] 
              }}
              transition={{ 
                delay: 1.6, 
                duration: 1, 
                ease: "backOut" 
              }}
            >
              <div className="relative">
                <img 
                  src="/dapps.png" 
                  alt="DAPPS" 
                  className="w-32 h-32 drop-shadow-2xl"
                />
                {/* Glowing ring around logo */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-cyan-400"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ 
                    scale: [1, 2, 3], 
                    opacity: [0, 1, 0] 
                  }}
                  transition={{ 
                    delay: 1.8, 
                    duration: 1.5, 
                    ease: "easeOut" 
                  }}
                />
              </div>
            </motion.div>
            
            {/* Stage 4: Particle burst with DAPPS logos */}
            {Array.from({ length: 40 }).map((_, i) => {
              const angle = (i / 40) * 2 * Math.PI;
              const radius = 300 + Math.random() * 200;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2"
                  initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 0.8, 0],
                    x: x,
                    y: y,
                    rotate: [0, 360],
                  }}
                  transition={{
                    delay: 2.2 + (i % 8) * 0.05,
                    duration: 2.5,
                    ease: "easeOut"
                  }}
                >
                  <img 
                    src="/dapps.png" 
                    alt="DAPPS" 
                    className="w-8 h-8 opacity-80"
                  />
                </motion.div>
              );
            })}
            

            
            {/* Stage 6: Final sparkle effect */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0], 
                  opacity: [0, 1, 0] 
                }}
                transition={{
                  delay: 3.5 + Math.random() * 1,
                  duration: 0.8,
                  repeat: 2,
                  repeatType: "reverse"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpecialEffects; 