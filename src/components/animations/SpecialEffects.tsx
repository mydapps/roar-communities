import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpecialEffectsProps {
  effect: 'buzz' | 'eth' | 'btc' | 'base' | 'sol' | 'dapps' | 'heart' | 'roar' | null;
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
      const duration = effect === 'dapps' ? 5000 : effect === 'roar' ? 4000 : 3000; // DAPPS gets 5s, ROAR gets 4s
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
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Love/Heart Effect - Big animated heart in center */}
      <AnimatePresence>
        {effect === 'heart' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Main heart animation */}
            <motion.div
              className="text-6xl sm:text-9xl"
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
              className="absolute text-6xl sm:text-9xl"
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

            {/* Floating hearts around - responsive positioning */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl sm:text-4xl"
                style={{
                  left: `${50 + Math.cos(i * 30 * Math.PI / 180) * (window.innerWidth < 640 ? 100 : 200)}px`,
                  top: `${50 + Math.sin(i * 30 * Math.PI / 180) * (window.innerWidth < 640 ? 100 : 200)}px`,
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
          <motion.div className="absolute inset-0">
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
                className="absolute text-4xl sm:text-6xl"
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
          <motion.div className="absolute inset-0 flex items-center justify-center">
            {/* Central explosion */}
            <motion.div
              className="text-6xl sm:text-8xl"
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
                className="absolute text-2xl sm:text-4xl"
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
                  x: Math.cos(i * 22.5 * Math.PI / 180) * (window.innerWidth < 640 ? 150 : 300),
                  y: Math.sin(i * 22.5 * Math.PI / 180) * (window.innerWidth < 640 ? 150 : 300),
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
          <motion.div className="absolute inset-0 flex items-center justify-center">
            {/* Spiral effect */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl sm:text-5xl"
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
                  x: Math.cos(i * 18 * Math.PI / 180 + Date.now() * 0.001) * (30 + i * (window.innerWidth < 640 ? 8 : 15)),
                  y: Math.sin(i * 18 * Math.PI / 180 + Date.now() * 0.001) * (30 + i * (window.innerWidth < 640 ? 8 : 15)),
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
          <motion.div className="absolute inset-0">
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
                className="absolute text-4xl sm:text-6xl"
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
          <motion.div className="absolute inset-0">
            {/* Stage 1: Epic screen flash with rainbow gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 via-purple-600 via-pink-500 to-orange-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.4, times: [0, 0.15, 1] }}
            />
            
            {/* Stage 2: Multiple DAPPS logos launching from corners - responsive */}
            {[
              { from: 'bottom-left', x: window.innerWidth < 640 ? -100 : -200, y: window.innerWidth < 640 ? 100 : 200 },
              { from: 'bottom-right', x: window.innerWidth < 640 ? 100 : 200, y: window.innerWidth < 640 ? 100 : 200 },
              { from: 'top-left', x: window.innerWidth < 640 ? -100 : -200, y: window.innerWidth < 640 ? -100 : -200 },
              { from: 'top-right', x: window.innerWidth < 640 ? 100 : 200, y: window.innerWidth < 640 ? -100 : -200 }
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
                  className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-2xl"
                />
              </motion.div>
            ))}
            
            {/* Stage 3: Central DAPPS logo explosion - responsive */}
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
                  className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-2xl"
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
            
            {/* Stage 4: Particle burst with DAPPS logos - responsive */}
            {Array.from({ length: 40 }).map((_, i) => {
              const angle = (i / 40) * 2 * Math.PI;
              const radius = (window.innerWidth < 640 ? 150 : 300) + Math.random() * (window.innerWidth < 640 ? 100 : 200);
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

      {/* ROAR Effect - EPIC LION KING EXPERIENCE */}
      <AnimatePresence>
        {effect === 'roar' && (
          <motion.div className="absolute inset-0">
            {/* Stage 1: Golden sunrise background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-yellow-300 via-orange-400 via-red-500 to-amber-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0.6, 0] }}
              transition={{ duration: 4, times: [0, 0.2, 0.8, 1] }}
            />

            {/* Stage 2: Majestic screen flash */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, times: [0, 0.3, 1] }}
            />

            {/* Stage 3: Giant lion emoji center stage - responsive */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: [0, window.innerWidth < 640 ? 2 : 3, window.innerWidth < 640 ? 1.8 : 2.5, window.innerWidth < 640 ? 2 : 2.8, window.innerWidth < 640 ? 1.6 : 2.2],
                rotate: [0, -15, 15, -10, 0],
              }}
              transition={{ 
                duration: 2,
                times: [0, 0.4, 0.6, 0.8, 1],
                ease: "backOut" 
              }}
            >
              <div className="text-6xl sm:text-9xl filter drop-shadow-2xl">🦁</div>
            </motion.div>

            {/* Stage 4: Crown appearing above lion - responsive */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{ marginTop: window.innerWidth < 640 ? '-80px' : '-120px' }}
              initial={{ scale: 0, y: -50, rotate: 0 }}
              animate={{ 
                scale: [0, window.innerWidth < 640 ? 1.2 : 1.5, window.innerWidth < 640 ? 1 : 1.2],
                y: [-50, window.innerWidth < 640 ? -60 : -80, window.innerWidth < 640 ? -55 : -70],
                rotate: [0, 360, 0],
              }}
              transition={{ 
                delay: 1.2,
                duration: 1.5,
                ease: "backOut" 
              }}
            >
              <div className="text-4xl sm:text-6xl filter drop-shadow-xl animate-pulse">👑</div>
            </motion.div>

            {/* Stage 5: Roaring sound waves - responsive */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`wave-${i}`}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, (window.innerWidth < 640 ? 2 : 4) + i * 0.3],
                  opacity: [0, 0.6, 0],
                }}
                transition={{ 
                  delay: 1.5 + i * 0.1,
                  duration: 1.5,
                  ease: "easeOut" 
                }}
              >
                <div 
                  className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-amber-400 rounded-full"
                  style={{ 
                    borderColor: `rgba(251, 191, 36, ${0.8 - i * 0.1})`,
                  }}
                />
              </motion.div>
            ))}

            {/* Stage 6: Pride of lions circling - responsive */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * 2 * Math.PI;
              const radius = window.innerWidth < 640 ? 150 : 250;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={`pride-${i}`}
                  className="absolute top-1/2 left-1/2"
                  initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 1, 0.8],
                    x: x,
                    y: y,
                    rotate: [0, 360],
                  }}
                  transition={{
                    delay: 2 + i * 0.08,
                    duration: 2,
                    ease: "easeOut"
                  }}
                >
                  <div className="text-3xl sm:text-4xl opacity-90">🦁</div>
                </motion.div>
              );
            })}

            {/* Stage 7: Golden particles explosion - responsive */}
            {Array.from({ length: 50 }).map((_, i) => {
              const angle = (i / 50) * 2 * Math.PI;
              const radius = (window.innerWidth < 640 ? 120 : 200) + Math.random() * (window.innerWidth < 640 ? 180 : 300);
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full"
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: x,
                    y: y,
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    delay: 2.5 + (i % 10) * 0.05,
                    duration: 1.5,
                    ease: "easeOut"
                  }}
                />
              );
            })}

            {/* Stage 8: Majestic text "ROAR!" - responsive */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{ marginTop: window.innerWidth < 640 ? '100px' : '150px' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, window.innerWidth < 640 ? 1.2 : 1.5, window.innerWidth < 640 ? 1 : 1.2, window.innerWidth < 640 ? 1.1 : 1.3, window.innerWidth < 640 ? 0.9 : 1.1],
                opacity: [0, 1, 1, 1, 0],
              }}
              transition={{ 
                delay: 2.8,
                duration: 1.2,
                ease: "backOut" 
              }}
            >
              <div 
                className="text-4xl sm:text-6xl font-bold text-amber-100 filter drop-shadow-2xl"
                style={{
                  textShadow: '0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.2em'
                }}
              >
                ROAR!
              </div>
            </motion.div>

            {/* Stage 9: Final sparkle burst */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 2, 0], 
                  opacity: [0, 1, 0] 
                }}
                transition={{
                  delay: 3.2 + Math.random() * 0.8,
                  duration: 0.6,
                  repeat: 1,
                  repeatType: "reverse"
                }}
              />
            ))}

            {/* Stage 10: Triumphant lion mane effect - responsive */}
            {[...Array(20)].map((_, i) => {
              const angle = (i / 20) * 2 * Math.PI;
              const radius = (window.innerWidth < 640 ? 80 : 120) + Math.sin(i * 0.5) * (window.innerWidth < 640 ? 25 : 40);
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={`mane-${i}`}
                  className="absolute top-1/2 left-1/2"
                  initial={{ scale: 0, x: 0, y: 0, rotate: 0, opacity: 0 }}
                  animate={{
                    scale: [0, window.innerWidth < 640 ? 1.2 : 1.5, 1],
                    x: x,
                    y: y,
                    rotate: [0, 180],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    delay: 1.8 + i * 0.03,
                    duration: 2.2,
                    ease: "easeOut"
                  }}
                >
                  <div 
                    className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    style={{
                      boxShadow: '0 0 10px rgba(251, 191, 36, 0.6)'
                    }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpecialEffects; 