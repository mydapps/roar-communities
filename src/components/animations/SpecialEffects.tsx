import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpecialEffectsProps {
  effect: 'buzz' | 'eth' | 'btc' | 'base' | 'sol' | 'dapps' | 'heart' | 'roar' | 'yoga' | 'magic' | 'gm' | 'dussehra' | 'halloween' | null;
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
      const duration = effect === 'dapps' ? 5000 : effect === 'roar' ? 4000 : effect === 'yoga' ? 6000 : effect === 'magic' ? 7000 : effect === 'gm' ? 4000 : effect === 'dussehra' ? 5000 : effect === 'halloween' ? 6000 : 3000; // DAPPS gets 5s, ROAR gets 4s, YOGA gets 6s, MAGIC gets 7s, GM gets 4s, DUSSEHRA gets 5s, HALLOWEEN gets 6s
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

      {/* Yoga Effect - Journey from Chaos to Inner Peace */}
      <AnimatePresence>
        {effect === 'yoga' && (
          <motion.div className="absolute inset-0">
            
            {/* Stage 1: Chaos/Stress - Scattered anxious thoughts */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`stress-${i}`}
                className="absolute text-2xl sm:text-3xl"
                style={{
                  left: `${Math.random() * 90 + 5}%`,
                  top: `${Math.random() * 90 + 5}%`,
                  color: '#ef4444',
                }}
                initial={{ scale: 0, opacity: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1.2, 0.8, 1, 0],
                  opacity: [0, 1, 1, 0.5, 0],
                  rotate: [0, Math.random() * 360],
                  x: [0, (Math.random() - 0.5) * 100],
                  y: [0, (Math.random() - 0.5) * 100]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
              >
                {['💭', '😰', '😵', '🤯', '😤'][Math.floor(Math.random() * 5)]}
              </motion.div>
            ))}

            {/* Stage 2: Deep Breathing - Calming blue waves */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 0.3] }}
              transition={{ duration: 6, times: [0, 0.3, 0.4, 0.7, 1] }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`breath-${i}`}
                  className="absolute border-2 border-blue-400 rounded-full"
                  style={{
                    width: `${(i + 1) * (window.innerWidth < 640 ? 60 : 120)}px`,
                    height: `${(i + 1) * (window.innerWidth < 640 ? 60 : 120)}px`,
                    borderColor: `rgba(59, 130, 246, ${0.8 - i * 0.1})`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1, 1.2, 1],
                    opacity: [0, 0.8, 0.6, 0.8, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    delay: 1.5 + i * 0.2,
                    repeat: 1,
                    ease: "easeInOut"
                  }}
                />
              ))}
              
              {/* Breathing text */}
              <motion.div
                className="text-lg sm:text-2xl text-blue-600 font-medium text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  y: [20, 0, 0, -20],
                  scale: [0.8, 1, 1, 0.8]
                }}
                transition={{ 
                  duration: 3,
                  delay: 1.8,
                  ease: "easeInOut"
                }}
              >
                Breathe...
              </motion.div>
            </motion.div>

            {/* Stage 3: Yoga Poses Sequence */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 0.5] }}
              transition={{ duration: 6, times: [0, 0.4, 0.5, 0.8, 1] }}
            >
              {/* Tree Pose */}
              <motion.div
                className="absolute text-6xl sm:text-8xl"
                initial={{ scale: 0, y: 50, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  y: [50, 0, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 2.5,
                  ease: "backOut"
                }}
              >
                🧘‍♀️
              </motion.div>

              {/* Warrior Pose */}
              <motion.div
                className="absolute text-6xl sm:text-8xl"
                initial={{ scale: 0, x: -100, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  x: [-100, 0, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 3.2,
                  ease: "backOut"
                }}
              >
                🧘‍♂️
              </motion.div>

              {/* Lotus Position */}
              <motion.div
                className="absolute text-6xl sm:text-8xl"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.3, 1],
                  opacity: [0, 1, 1],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 2,
                  delay: 3.8,
                  ease: "backOut"
                }}
              >
                🧘
              </motion.div>
            </motion.div>

            {/* Stage 4: Chakra Activation - Rainbow energy centers */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 0.7] }}
              transition={{ duration: 6, times: [0, 0.6, 0.65, 0.85, 1] }}
            >
              {/* 7 Chakras with colors */}
              {[
                { emoji: '🔴', color: '#ef4444', name: 'Root' },
                { emoji: '🟠', color: '#f97316', name: 'Sacral' },
                { emoji: '🟡', color: '#eab308', name: 'Solar' },
                { emoji: '🟢', color: '#22c55e', name: 'Heart' },
                { emoji: '🔵', color: '#3b82f6', name: 'Throat' },
                { emoji: '🟣', color: '#8b5cf6', name: 'Third Eye' },
                { emoji: '⚪', color: '#f8fafc', name: 'Crown' }
              ].map((chakra, i) => (
                <motion.div
                  key={`chakra-${i}`}
                  className="absolute text-3xl sm:text-5xl"
                  style={{
                    top: `${20 + i * 10}%`,
                    filter: `drop-shadow(0 0 20px ${chakra.color})`,
                  }}
                  initial={{ scale: 0, opacity: 0, x: -200 }}
                  animate={{ 
                    scale: [0, 1.5, 1.2, 1],
                    opacity: [0, 1, 1, 0.8],
                    x: [-200, 0, 0, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 3.5 + i * 0.15,
                    ease: "backOut"
                  }}
                >
                  {chakra.emoji}
                </motion.div>
              ))}

              {/* Energy flow lines */}
              <motion.div
                className="absolute w-1 bg-gradient-to-b from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
                style={{ 
                  height: '70%',
                  left: '50%',
                  top: '15%',
                  filter: 'blur(2px)',
                  boxShadow: '0 0 20px rgba(147, 51, 234, 0.6)'
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ 
                  scaleY: [0, 1, 1, 0.8],
                  opacity: [0, 0.8, 0.8, 0.4]
                }}
                transition={{ 
                  duration: 2,
                  delay: 4.2,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Stage 5: Lotus Bloom Transformation */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1] }}
              transition={{ duration: 6, times: [0, 0.7, 0.75, 1] }}
            >
              {/* Lotus petals blooming */}
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * 2 * Math.PI;
                const radius = window.innerWidth < 640 ? 80 : 120;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <motion.div
                    key={`petal-${i}`}
                    className="absolute text-4xl sm:text-6xl"
                    style={{
                      filter: 'drop-shadow(0 0 15px rgba(236, 72, 153, 0.6))',
                    }}
                    initial={{ scale: 0, x: 0, y: 0, rotate: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1.2, 1],
                      x: [0, x * 0.7, x],
                      y: [0, y * 0.7, y],
                      rotate: [0, 180, 360],
                      opacity: [0, 1, 1],
                    }}
                    transition={{
                      duration: 2,
                      delay: 4.2 + i * 0.1,
                      ease: "backOut"
                    }}
                  >
                    🌸
                  </motion.div>
                );
              })}
              
              {/* Central lotus */}
              <motion.div
                className="absolute text-8xl sm:text-9xl"
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(236, 72, 153, 0.8))',
                }}
                initial={{ scale: 0, rotate: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.3, 1.1, 1],
                  rotate: [0, 360],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{ 
                  duration: 2.5,
                  delay: 4.5,
                  ease: "backOut"
                }}
              >
                🪷
              </motion.div>
            </motion.div>

            {/* Stage 6: Enlightenment / Inner Peace */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ duration: 6, times: [0, 0.8, 1] }}
            >
              {/* Golden aura */}
              <motion.div
                className="absolute rounded-full bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200"
                style={{
                  width: window.innerWidth < 640 ? '200px' : '300px',
                  height: window.innerWidth < 640 ? '200px' : '300px',
                  filter: 'blur(40px)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1.2],
                  opacity: [0, 0.6, 0.4],
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 5,
                  ease: "easeOut"
                }}
              />

              {/* Peaceful emoji transformation */}
              <motion.div
                className="absolute text-8xl sm:text-9xl z-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1],
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 5.2,
                  ease: "backOut"
                }}
              >
                😌
              </motion.div>

              {/* Floating "Om" symbols */}
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * 2 * Math.PI;
                const radius = window.innerWidth < 640 ? 150 : 250;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <motion.div
                    key={`om-${i}`}
                    className="absolute text-2xl sm:text-3xl text-purple-600"
                    style={{
                      filter: 'drop-shadow(0 0 10px rgba(147, 51, 234, 0.8))',
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1, 0.8],
                      x: x,
                      y: y,
                      opacity: [0, 0.8, 0.6],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      delay: 5.3 + i * 0.08,
                      ease: "easeOut"
                    }}
                  >
                    ॐ
                  </motion.div>
                );
              })}

              {/* Final message */}
              <motion.div
                className="absolute bottom-1/4 text-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: [0, 1, 1],
                  y: [50, 0, 0],
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 5.8,
                  ease: "easeOut"
                }}
              >
                <div 
                  className="text-2xl sm:text-3xl font-light text-purple-800"
                  style={{
                    textShadow: '0 0 20px rgba(147, 51, 234, 0.5)',
                    fontFamily: 'serif',
                  }}
                >
                  ✨ Inner Peace Found ✨
                </div>
                <motion.div
                  className="text-lg sm:text-xl text-purple-600 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1] }}
                  transition={{ delay: 6.3, duration: 0.8 }}
                >
                  Namaste 🙏
                </motion.div>
              </motion.div>

              {/* Gentle sparkles */}
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={`sparkle-yoga-${i}`}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                  style={{
                    top: `${10 + Math.random() * 80}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 0], 
                    opacity: [0, 0.8, 0] 
                  }}
                  transition={{
                    delay: 5.5 + Math.random() * 1,
                    duration: 1.2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                />
              ))}
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Magic Effect - Spectacular Mobile-Optimized Experience */}
      <AnimatePresence>
        {effect === 'magic' && (
          <motion.div className="absolute inset-0">
            
            {/* Stage 1: Reality Glitch Effect (0-0.8s) - Instant Impact */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, times: [0, 0.3, 1] }}
            >
              {/* Screen glitch overlay */}
                <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30"
                  animate={{ 
                  opacity: [0, 0.8, 0.3, 0.9, 0],
                  scale: [1, 1.02, 0.98, 1.01, 1],
                  }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              
              {/* Digital glitch lines */}
              {[...Array(8)].map((_, i) => (
              <motion.div
                  key={`glitch-${i}`}
                  className="absolute w-full h-1 bg-white/80"
                style={{
                    top: `${10 + i * 12}%`,
                    filter: 'blur(0.5px)',
                }}
                  initial={{ x: '-100%', opacity: 0 }}
                animate={{ 
                    x: ['100%', '-100%', '100%'],
                    opacity: [0, 1, 0],
                }}
                transition={{ 
                    duration: 0.6,
                    delay: i * 0.05,
                    ease: "linear"
                }}
                />
              ))}

              {/* Reality crack effect */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.8, ease: "backOut" }}
              >
                <div 
                  className="text-6xl sm:text-8xl font-bold text-white"
                  style={{
                    textShadow: '0 0 40px rgba(255, 255, 255, 0.8)',
                    filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.8))',
                }}
              >
                  ⚡
                </div>
              </motion.div>
            </motion.div>

            {/* Stage 2: Portal Opening (0.8-1.8s) - First AHA Moment */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1] }}
              transition={{ duration: 2, times: [0.4, 0.5, 1] }}
            >
              {/* Magical portal background */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: window.innerWidth < 640 ? '250px' : '350px',
                  height: window.innerWidth < 640 ? '250px' : '350px',
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, rgba(59, 130, 246, 0.6) 30%, rgba(16, 185, 129, 0.4) 60%, transparent 100%)',
                  filter: 'blur(20px)',
                }}
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ 
                  duration: 1.2,
                  delay: 0.8,
                  ease: "easeOut"
                }}
              />

              {/* Portal ring effect */}
              <motion.div
                className="absolute rounded-full border-4 border-purple-400"
                style={{
                  width: window.innerWidth < 640 ? '200px' : '300px',
                  height: window.innerWidth < 640 ? '200px' : '300px',
                  boxShadow: '0 0 50px rgba(139, 92, 246, 0.8), inset 0 0 50px rgba(139, 92, 246, 0.4)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.1, 1],
                  opacity: [0, 1, 0.8],
                  rotate: [0, -360],
                }}
                transition={{ 
                  duration: 1,
                  delay: 0.9,
                  ease: "backOut"
                }}
              />

              {/* Portal center glow */}
              <motion.div
                className="absolute text-8xl sm:text-9xl z-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.3, 1],
                  opacity: [0, 1, 1],
                }}
                transition={{ 
                  duration: 0.8,
                  delay: 1.2,
                  ease: "backOut"
                }}
              >
                🌀
              </motion.div>
            </motion.div>

            {/* Stage 3: Magic Explosion (1.8-3.2s) - Second AHA Moment */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1] }}
              transition={{ duration: 2, delay: 1.8 }}
            >
              {/* Massive magical explosion */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: window.innerWidth < 640 ? '400px' : '600px',
                  height: window.innerWidth < 640 ? '400px' : '600px',
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.9) 0%, rgba(255, 165, 0, 0.7) 20%, rgba(255, 20, 147, 0.5) 40%, rgba(138, 43, 226, 0.3) 60%, transparent 100%)',
                  filter: 'blur(30px)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 2.5, 1.8],
                  opacity: [0, 1, 0.6],
                }}
                transition={{ 
                  duration: 1.4,
                  delay: 1.8,
                  ease: "easeOut"
                }}
              />

              {/* Magical creatures bursting out */}
              {[
                { emoji: '🦄', delay: 1.9, angle: 0 },
                { emoji: '🐉', delay: 2.0, angle: 72 },
                { emoji: '🧚‍♀️', delay: 2.1, angle: 144 },
                { emoji: '🦋', delay: 2.2, angle: 216 },
                { emoji: '✨', delay: 2.3, angle: 288 },
              ].map((creature, i) => {
                const radius = window.innerWidth < 640 ? 120 : 180;
                const x = Math.cos((creature.angle * Math.PI) / 180) * radius;
                const y = Math.sin((creature.angle * Math.PI) / 180) * radius;
                
                return (
              <motion.div
                    key={`creature-${i}`}
                    className="absolute text-6xl sm:text-8xl z-20"
                style={{
                      filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))',
                }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
                animate={{ 
                      scale: [0, 1.4, 1.2, 1],
                      x: [0, x * 0.7, x, x * 1.2],
                      y: [0, y * 0.7, y, y * 1.2],
                      opacity: [0, 1, 1, 0.8],
                      rotate: [0, 180, 360],
                }}
                transition={{ 
                      duration: 1.3,
                      delay: creature.delay,
                  ease: "backOut"
                }}
              >
                    {creature.emoji}
              </motion.div>
                );
              })}

              {/* Central magic wand with sparkle burst */}
              <motion.div
                className="absolute text-7xl sm:text-9xl z-30"
                style={{
                  filter: 'drop-shadow(0 0 25px rgba(255, 215, 0, 1))',
                }}
                initial={{ scale: 0, rotate: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1.2, 1],
                  rotate: [0, 360, 720],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{ 
                  duration: 1.2,
                  delay: 2.2,
                  ease: "backOut"
                }}
              >
                🪄
              </motion.div>
              </motion.div>

            {/* Stage 4: Reality Transformation (3.0-4.0s) - Final AHA Moment */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1] }}
              transition={{ duration: 1, delay: 3.0 }}
            >
              {/* Rainbow wave sweep */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
                  opacity: 0.3,
                }}
                initial={{ x: '-100%', skewX: -20 }}
                animate={{ x: '100%', skewX: 20 }}
                transition={{ 
                  duration: 0.8,
                  delay: 3.0,
                  ease: "easeInOut"
                }}
              />

              {/* Floating magical elements everywhere */}
              {[...Array(25)].map((_, i) => {
                const emojis = ['⭐', '✨', '🌟', '💫', '🔮', '🎭', '🎪', '🎨', '🌈', '🦄'];
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                
                return (
                  <motion.div
                    key={`floating-magic-${i}`}
                    className="absolute text-3xl sm:text-4xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
                    }}
                    initial={{ scale: 0, opacity: 0, rotate: 0 }}
                    animate={{
                      scale: [0, 1.2, 1, 0.8, 0],
                      opacity: [0, 1, 0.8, 0.6, 0],
                      rotate: [0, 360, 720],
                      y: [0, -50, -100],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 3.1 + i * 0.03,
                      ease: "easeOut"
                    }}
                  >
                    {emoji}
                  </motion.div>
                );
              })}

              {/* Final magical message */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 1],
                  scale: [0, 1.2, 1],
                }}
                transition={{ 
                  duration: 1,
                  delay: 3.5,
                  ease: "backOut"
                }}
              >
                <div className="text-center">
                <motion.div 
                    className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))',
                    }}
                  animate={{ 
                      scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                      ease: "easeInOut"
                  }}
                >
                    ✨ MAGIC! ✨
              </motion.div>

              <motion.div
                    className="text-2xl sm:text-3xl text-amber-500 font-semibold"
                    style={{
                      textShadow: '0 0 15px rgba(245, 158, 11, 0.6)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                animate={{ 
                      opacity: [0, 1],
                      y: [20, 0],
                }}
                transition={{ 
                      duration: 0.8,
                      delay: 4.0,
                  ease: "easeOut"
                }}
              >
                    Reality has been transformed! 🌟
                  </motion.div>
                </div>
              </motion.div>

              {/* Persistent magical sparkles */}
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={`persistent-sparkle-${i}`}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    top: `${10 + Math.random() * 80}%`,
                    left: `${10 + Math.random() * 80}%`,
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 1, 1.2, 0], 
                    opacity: [0, 1, 0.8, 0.6, 0],
                  }}
                  transition={{
                    delay: 3.8 + Math.random() * 0.5,
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                />
              ))}
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* GM Effect - The Network Awakening: Your GM Lights Up Web3 */}
      <AnimatePresence>
        {effect === 'gm' && (
          <motion.div className="absolute inset-0">
            
            {/* Dark background for better contrast */}
            <motion.div
              className="absolute inset-0 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0.6] }}
              transition={{ duration: 4, times: [0, 0.25, 1] }}
            />

            {/* Stage 1: You Start the GM (0-0.8s) */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1]
              }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              {/* You - the starting point */}
              <div 
                className="relative text-6xl sm:text-8xl"
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(34, 197, 94, 0.9))',
                }}
              >
                😊
                {/* Your energy pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-green-400"
                  animate={{
                    scale: [1, 3, 5],
                    opacity: [0.8, 0.4, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: 0.5,
                    ease: "easeOut"
                  }}
                />
              </div>
            </motion.div>

            {/* Stage 2: Perfect Network Grid - GM Spreads Through Network (0.8-2.2s) */}
            {/* Perfectly aligned network nodes using polar coordinates */}
            {(() => {
              const center = { x: 50, y: 50 };
              const networks = [
                // Inner ring - 4 major ecosystems
                ...Array.from({ length: 4 }, (_, i) => {
                  const angle = (i * 90) * Math.PI / 180;
                  const radius = 20;
                  return {
                    x: center.x + Math.cos(angle) * radius,
                    y: center.y + Math.sin(angle) * radius,
                    delay: 0.9 + i * 0.15,
                    size: 'text-5xl sm:text-6xl',
                    emoji: ['🌍', '⟠', '₿', '◎'][i],
                  };
                }),
                // Middle ring - 8 protocols  
                ...Array.from({ length: 8 }, (_, i) => {
                  const angle = (i * 45) * Math.PI / 180;
                  const radius = 35;
                  return {
                    x: center.x + Math.cos(angle) * radius,
                    y: center.y + Math.sin(angle) * radius,
                    delay: 1.5 + i * 0.08,
                    size: 'text-3xl sm:text-4xl',
                    emoji: ['🚀', '💎', '🔥', '⚡', '🌟', '✨', '💫', '🎉'][i],
                  };
                }),
                // Outer ring - 12 communities
                ...Array.from({ length: 12 }, (_, i) => {
                  const angle = (i * 30) * Math.PI / 180;
                  const radius = 48;
                  return {
                    x: center.x + Math.cos(angle) * radius,
                    y: center.y + Math.sin(angle) * radius,
                    delay: 1.9 + i * 0.05,
                    size: 'text-2xl sm:text-3xl',
                    emoji: ['🔵', '🟣', '🟡', '🟠', '🔴', '🟢', '⭐', '💠', '🔮', '⚪', '🌈', '💯'][i],
                  };
                }),
              ];
              
              return networks.map((node, i) => (
                <motion.div
                  key={`network-node-${i}`}
                  className={`absolute ${node.size} transform -translate-x-1/2 -translate-y-1/2`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.4, 1],
                    opacity: [0, 1, 0.9]
                  }}
                  transition={{ 
                    duration: 0.6,
                    delay: node.delay,
                    ease: "backOut"
                  }}
                >
                  {node.emoji}
                  
                  {/* Perfect connection lines to center */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 w-0.5 bg-gradient-to-b from-blue-400 to-transparent origin-top"
                    style={{
                      height: Math.sqrt(Math.pow(node.x - 50, 2) + Math.pow(node.y - 50, 2)) * (window.innerWidth < 640 ? 4 : 6),
                      transform: `translate(-50%, -50%) rotate(${Math.atan2(50 - node.y, 50 - node.x) * 180 / Math.PI + 90}deg)`,
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ 
                      scaleY: [0, 1, 0.8],
                      opacity: [0, 0.8, 0.4]
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: node.delay + 0.2,
                      ease: "easeOut"
                    }}
                  />
                </motion.div>
              ));
            })()}

            {/* Stage 3: Network Wave & Clear Message (1.8-4.0s) */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1] }}
              transition={{ duration: 2.2, delay: 1.8, times: [0, 0.2, 1] }}
            >
              {/* Expanding network wave */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 20] }}
                transition={{ duration: 1.2, delay: 1.8, ease: "easeOut" }}
              >
                <div 
                  className="w-20 h-20 rounded-full border-2 border-green-400/60"
                  style={{
                    background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0) 70%)',
                  }}
                />
              </motion.div>

              {/* High Contrast GM Message with Background */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, y: 20, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  y: [20, 0, 0],
                  opacity: [0, 1, 1]
                }}
                transition={{ 
                  duration: 0.8,
                  delay: 2.0,
                  ease: "backOut"
                }}
              >
                <div className="text-center">
                  {/* Main GM message with strong background */}
                  <div 
                    className="relative px-8 py-4 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <div 
                      className="text-4xl sm:text-6xl font-bold mb-2 text-white"
                      style={{
                        textShadow: '0 0 30px rgba(16, 185, 129, 0.8), 0 2px 10px rgba(0, 0, 0, 0.9)',
                        filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.8))',
                      }}
                    >
                      GM Web3! 
                    </div>
                    <motion.div
                      className="text-lg sm:text-xl font-medium text-green-300"
                      style={{
                        textShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 2px 5px rgba(0, 0, 0, 0.8)',
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: [0, 1], y: [10, 0] }}
                      transition={{ delay: 2.3, duration: 0.5 }}
                    >
                      You just lit up the network! 🌐
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Better positioned floating GM messages */}
              {['GM!', 'gm 🌅', 'GM fren!', '☀️ GM', 'gm wagmi'].map((msg, i) => {
                const positions = [
                  { x: 20, y: 25 },
                  { x: 75, y: 20 },
                  { x: 15, y: 75 },
                  { x: 80, y: 80 },
                  { x: 50, y: 85 },
                ];
                return (
                  <motion.div
                    key={`floating-gm-${i}`}
                    className="absolute text-base sm:text-lg font-semibold text-green-300 px-3 py-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${positions[i].x}%`,
                      top: `${positions[i].y}%`,
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                      textShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 1px 3px rgba(0, 0, 0, 0.8)',
                    }}
                    initial={{ scale: 0, y: 20, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.1, 1],
                      y: [20, 0, -5],
                      opacity: [0, 1, 0.9]
                    }}
                    transition={{ 
                      duration: 0.6,
                      delay: 2.1 + i * 0.1,
                      ease: "backOut"
                    }}
                  >
                    {msg}
                  </motion.div>
                );
              })}
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* DUSSEHRA Effect - The Burning of Ravana: Good Triumphs Over Evil */}
      <AnimatePresence>
        {effect === 'dussehra' && (
          <motion.div className="absolute inset-0">
            
            {/* Stage 1: Festival Evening Sky (0-5s) */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-purple-900/90 via-indigo-800/70 to-orange-600/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 5, times: [0, 0.3, 0.9, 1] }}
            />

            {/* Stage 2: Towering Ravana Effigy (0-2s) */}
            <motion.div
              className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2"
              initial={{ scale: 0, y: 100, opacity: 0 }}
              animate={{ 
                scale: [0, 1.8, 1.5],
                y: [100, 0, 0],
                opacity: [0, 1, 1]
              }}
              transition={{ duration: 2, ease: "backOut" }}
            >
              {/* Massive Ravana effigy */}
              <div className="relative flex flex-col items-center">
                {/* Ravana's 10 heads stacked */}
                <div className="relative mb-2">
                  <div 
                    className="text-7xl sm:text-8xl"
                    style={{
                      filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 0.9))',
                    }}
                  >
                    👹
                  </div>
                  {/* Additional heads around main head */}
                  {Array.from({ length: 4 }, (_, i) => (
                    <motion.div
                      key={`ravana-head-${i}`}
                      className="absolute text-3xl"
                      style={{
                        left: `${[-40, 40, -60, 60][i]}px`,
                        top: `${[10, 10, -20, -20][i]}px`,
                        filter: 'drop-shadow(0 0 15px rgba(220, 38, 38, 0.7))',
                      }}
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    >
                      👹
                    </motion.div>
                  ))}
                </div>
                
                {/* Ravana's body */}
                <div 
                  className="text-6xl"
                  style={{
                    filter: 'drop-shadow(0 0 25px rgba(220, 38, 38, 0.8))',
                  }}
                >
                  🧙‍♂️
                </div>
              </div>
            </motion.div>

            {/* Stage 3: Rama's Flaming Arrow (1.5-2.5s) */}
            <motion.div
              className="absolute top-1/3 left-0"
              initial={{ x: -150, opacity: 0 }}
              animate={{ 
                x: [0, window.innerWidth * 0.6],
                opacity: [0, 1, 1],
                rotate: [0, 720]
              }}
              transition={{ 
                duration: 1, 
                delay: 1.5,
                ease: "easeInOut"
              }}
            >
              <div className="relative">
                <div 
                  className="text-5xl"
                  style={{
                    filter: 'drop-shadow(0 0 30px rgba(34, 197, 94, 1))',
                  }}
                >
                  🏹
                </div>
                {/* Fire trail behind arrow */}
                <motion.div
                  className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-3xl"
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity
                  }}
                >
                  🔥
                </motion.div>
              </div>
            </motion.div>

            {/* Stage 4: SPECTACULAR BURNING SEQUENCE (2.5-4.5s) */}
            <motion.div
              className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2"
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.1, 0.9, 0.7, 0.3],
                opacity: [1, 1, 0.8, 0.4, 0]
              }}
              transition={{ 
                duration: 2, 
                delay: 2.5,
                ease: "easeOut"
              }}
            >
              {/* Ravana burning and shrinking */}
              <div className="relative">
                <div 
                  className="text-7xl sm:text-8xl"
                  style={{
                    filter: 'drop-shadow(0 0 40px rgba(249, 115, 22, 1))',
                  }}
                >
                  👹
                </div>
              </div>
            </motion.div>

            {/* Stage 5: MASSIVE FIRE EXPLOSION (2.5-4s) */}
            <motion.div
              className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 6, 4, 2],
                opacity: [0, 1, 0.8, 0.3]
              }}
              transition={{ 
                duration: 1.5, 
                delay: 2.5,
                ease: "easeOut"
              }}
            >
              <div 
                className="text-9xl"
                style={{
                  filter: 'drop-shadow(0 0 60px rgba(249, 115, 22, 1))',
                }}
              >
                🔥
              </div>
            </motion.div>

            {/* Stage 6: Multiple Fire Bursts (2.8-4.2s) */}
            {Array.from({ length: 8 }, (_, i) => {
              const positions = [
                { x: 30, y: 60 }, { x: 70, y: 60 }, { x: 40, y: 50 }, { x: 60, y: 50 },
                { x: 25, y: 70 }, { x: 75, y: 70 }, { x: 50, y: 40 }, { x: 50, y: 75 }
              ];
              return (
                <motion.div
                  key={`fire-burst-${i}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 2.5, 1.5, 0],
                    opacity: [0, 1, 0.7, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 1.4,
                    delay: 2.8 + i * 0.1,
                    ease: "easeOut"
                  }}
                >
                  <div 
                    className="text-5xl"
                    style={{
                      filter: 'drop-shadow(0 0 30px rgba(249, 115, 22, 0.9))',
                    }}
                  >
                    🔥
                  </div>
                </motion.div>
              );
            })}

            {/* Stage 7: Victory Celebration - Festival Joy (3.5-5s) */}
            {['🎆', '🎇', '✨', '🌟', '🎉', '🪔'].map((symbol, i) => {
              const positions = [
                { x: 20, y: 20 }, { x: 80, y: 25 }, { x: 15, y: 80 },
                { x: 85, y: 75 }, { x: 50, y: 10 }, { x: 50, y: 90 }
              ];
              return (
                <motion.div
                  key={`celebration-${i}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}
                  initial={{ scale: 0, y: 30, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.4, 1.1],
                    y: [30, 0, -5],
                    opacity: [0, 1, 0.9],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 1.2,
                    delay: 3.5 + i * 0.2,
                    ease: "backOut"
                  }}
                >
                  <div 
                    className="text-4xl"
                    style={{
                      filter: 'drop-shadow(0 0 25px rgba(251, 191, 36, 0.9))',
                    }}
                  >
                    {symbol}
                  </div>
                </motion.div>
              );
            })}

            {/* Stage 8: Victory Message (4-5s) */}
            <motion.div
              className="absolute bottom-1/6 left-1/2 transform -translate-x-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.3, 1],
                opacity: [0, 1, 0.95]
              }}
              transition={{ 
                duration: 1,
                delay: 4,
                ease: "backOut"
              }}
            >
              <div 
                className="text-xl sm:text-2xl font-bold text-center px-6 py-3 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.95), rgba(251, 191, 36, 0.95))',
                  backdropFilter: 'blur(25px)',
                  border: '2px solid rgba(251, 191, 36, 0.7)',
                  textShadow: '0 0 20px rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  boxShadow: '0 0 40px rgba(249, 115, 22, 0.6)'
                }}
              >
                🏹 Evil Burns, Good Prevails! 🔥
              </div>
            </motion.div>

            {/* Stage 9: Sparkling Ash Particles (4.5-5s) */}
            {Array.from({ length: 25 }, (_, i) => (
              <motion.div
                key={`ash-particle-${i}`}
                className="absolute w-1.5 h-1.5 bg-orange-300 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  filter: 'drop-shadow(0 0 6px rgba(251, 146, 60, 0.8))',
                }}
                initial={{ y: window.innerHeight * 0.7, opacity: 0 }}
                animate={{ 
                  y: [0, -window.innerHeight * 0.3],
                  x: [0, (Math.random() - 0.5) * 100],
                  opacity: [0, 1, 0.7, 0],
                  scale: [0.3, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 4.5 + Math.random() * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}

          </motion.div>
        )}
      </AnimatePresence>

      {/* HALLOWEEN Effect - Spooky & Fun Haunted House Experience */}
      <AnimatePresence>
        {effect === 'halloween' && (
          <motion.div className="absolute inset-0">
            
            {/* Stage 1: Spooky Night Sky (0-6s) */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-purple-950/90 via-indigo-950/80 to-orange-900/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.9, 0] }}
              transition={{ duration: 6, times: [0, 0.2, 0.9, 1] }}
            />

            {/* Stage 2: Lightning Flash (0.5s) */}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0, 0.7, 0] }}
              transition={{ 
                duration: 0.8,
                times: [0, 0.1, 0.2, 0.3, 0.4],
                delay: 0.5
              }}
            />

            {/* Stage 3: Haunted Moon Rising (0-2s) */}
            <motion.div
              className="absolute top-[15%] right-[20%]"
              initial={{ scale: 0, y: 100, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 1.2],
                y: [100, 0, 0],
                opacity: [0, 1, 0.95]
              }}
              transition={{ duration: 2, ease: "backOut" }}
            >
              <div 
                className="text-7xl sm:text-9xl"
                style={{
                  filter: 'drop-shadow(0 0 40px rgba(251, 191, 36, 0.8))',
                }}
              >
                🌕
              </div>
              {/* Spooky bats flying across moon */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`bat-moon-${i}`}
                  className="absolute text-2xl sm:text-3xl"
                  initial={{ x: -100, y: 0, opacity: 0 }}
                  animate={{ 
                    x: [0, 150, 300],
                    y: [0, -20, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    delay: 1 + i * 0.3,
                    ease: "linear"
                  }}
                >
                  🦇
                </motion.div>
              ))}
            </motion.div>

            {/* Stage 4: Giant Jack-o'-Lantern Center Stage (1-3s) */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, rotate: 0, opacity: 0 }}
              animate={{ 
                scale: [0, window.innerWidth < 640 ? 2.5 : 3.5, window.innerWidth < 640 ? 2 : 3],
                rotate: [0, -15, 15, -10, 0],
                opacity: [0, 1, 1]
              }}
              transition={{ 
                duration: 2,
                delay: 1,
                ease: "backOut"
              }}
            >
              <div 
                className="text-8xl sm:text-9xl"
                style={{
                  filter: 'drop-shadow(0 0 50px rgba(249, 115, 22, 1))',
                }}
              >
                🎃
              </div>
              {/* Pulsing glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Stage 5: Spooky Ghost Army (1.5-3.5s) */}
            {[...Array(8)].map((_, i) => {
              const positions = [
                { x: 15, y: 20, delay: 1.5 },
                { x: 85, y: 25, delay: 1.7 },
                { x: 10, y: 70, delay: 1.9 },
                { x: 90, y: 75, delay: 2.1 },
                { x: 25, y: 40, delay: 2.3 },
                { x: 75, y: 45, delay: 2.5 },
                { x: 40, y: 15, delay: 2.7 },
                { x: 60, y: 85, delay: 2.9 },
              ];
              return (
                <motion.div
                  key={`ghost-${i}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}
                  initial={{ scale: 0, x: -50, y: 50, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.3, 1.1],
                    x: [-50, 0, 10, 0],
                    y: [50, 0, -10, 0],
                    opacity: [0, 1, 0.9],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: positions[i].delay,
                    ease: "backOut"
                  }}
                >
                  <div 
                    className="text-4xl sm:text-6xl"
                    style={{
                      filter: 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.8))',
                    }}
                  >
                    👻
                  </div>
                  {/* Floating animation */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      y: [0, -15, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: Math.random() * 1
                    }}
                  />
                </motion.div>
              );
            })}

            {/* Stage 6: Witch Flying Across (2-3.5s) */}
            <motion.div
              className="absolute top-[30%]"
              initial={{ x: -200, opacity: 0, rotate: -20 }}
              animate={{ 
                x: [0, window.innerWidth + 200],
                opacity: [0, 1, 1, 0],
                rotate: [-20, 0, -10]
              }}
              transition={{ 
                duration: 2.5,
                delay: 2,
                ease: "easeInOut"
              }}
            >
              <div 
                className="text-6xl sm:text-8xl"
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(124, 58, 237, 0.8))',
                }}
              >
                🧙‍♀️
              </div>
            </motion.div>

            {/* Stage 7: Zombie Hands Rising from Bottom (2.5-4s) */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`zombie-${i}`}
                className="absolute bottom-0 text-5xl sm:text-7xl"
                style={{
                  left: `${15 + i * 15}%`,
                }}
                initial={{ y: 150, opacity: 0, rotate: 0 }}
                animate={{ 
                  y: [150, 20, 0, 20],
                  opacity: [0, 1, 1, 0.8],
                  rotate: [0, -15, 15, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 2.5 + i * 0.15,
                  ease: "easeOut"
                }}
              >
                <div 
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.7))',
                  }}
                >
                  🧟
                </div>
              </motion.div>
            ))}

            {/* Stage 8: Swirling Candy & Treats (3-5s) */}
            {['🍬', '🍭', '🍫', '🍩', '🍪', '🧁'].map((candy, i) => {
              const angle = (i / 6) * 2 * Math.PI;
              const radius = window.innerWidth < 640 ? 150 : 250;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={`candy-${i}`}
                  className="absolute top-1/2 left-1/2 text-3xl sm:text-5xl"
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 1.3, 1.1],
                    x: [0, x * 0.5, x],
                    y: [0, y * 0.5, y],
                    opacity: [0, 1, 0.9],
                    rotate: [0, 360, 720],
                  }}
                  transition={{
                    duration: 2,
                    delay: 3 + i * 0.15,
                    ease: "backOut"
                  }}
                >
                  {candy}
                </motion.div>
              );
            })}

            {/* Stage 9: Spooky Eyes Appearing in Darkness (3.5-5.5s) */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`eyes-${i}`}
                className="absolute text-2xl sm:text-3xl"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1, 1.1, 1],
                  opacity: [0, 1, 0.8, 1, 0.7],
                }}
                transition={{ 
                  duration: 2,
                  delay: 3.5 + i * 0.1,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  animate={{
                    opacity: [1, 0.3, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                >
                  👀
                </motion.div>
              </motion.div>
            ))}

            {/* Stage 10: Epic Halloween Message (4-6s) */}
            <motion.div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{ 
                top: '50%',
                transform: 'translateY(-50%)',
                marginTop: window.innerWidth < 640 ? '100px' : '180px',
                paddingLeft: '1rem',
                paddingRight: '1rem',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: window.innerWidth < 640 
                  ? [0, 1, 1, 1, 1]  // No scale animation on mobile - just appear
                  : [0, 1.3, 1.1, 1.2, 1],     // Original scale on desktop
                opacity: [0, 1, 1, 1, 0.9],
              }}
              transition={{ 
                duration: 2,
                delay: 4,
                ease: "backOut"
              }}
            >
              <div className="w-full max-w-[90vw] sm:max-w-none">
                <div 
                  className="text-base xs:text-lg sm:text-5xl md:text-6xl font-bold text-center px-2 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.9), rgba(249, 115, 22, 0.9))',
                    backdropFilter: 'blur(20px)',
                    border: window.innerWidth < 640 ? '2px solid rgba(249, 115, 22, 0.8)' : '3px solid rgba(249, 115, 22, 0.8)',
                    textShadow: '0 0 30px rgba(0, 0, 0, 0.9), 0 0 60px rgba(249, 115, 22, 0.5)',
                    color: 'white',
                    boxShadow: '0 0 50px rgba(249, 115, 22, 0.6)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    lineHeight: window.innerWidth < 640 ? '1.4' : '1.2',
                    fontSize: window.innerWidth < 640 ? 'clamp(0.875rem, 4vw, 1.125rem)' : undefined,
                  }}
                >
                  🎃 HAPPY HALLOWEEN! 👻
                </div>
                <motion.div
                  className="text-xs xs:text-sm sm:text-xl md:text-2xl text-orange-200 text-center mt-2 sm:mt-3 font-semibold px-2"
                  style={{
                    textShadow: '0 0 15px rgba(0, 0, 0, 0.8)',
                    lineHeight: '1.4',
                    fontSize: window.innerWidth < 640 ? 'clamp(0.75rem, 3.5vw, 0.875rem)' : undefined,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: [0, 1],
                    y: [20, 0],
                  }}
                  transition={{ 
                    duration: 0.8,
                    delay: 4.5,
                    ease: "easeOut"
                  }}
                >
                  Trick or Treat! 🍬🍭
                </motion.div>
              </div>
            </motion.div>

            {/* Stage 11: Floating Jack-o'-Lanterns Circle (4.5-6s) */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * 2 * Math.PI;
              const radius = window.innerWidth < 640 ? 180 : 280;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={`pumpkin-circle-${i}`}
                  className="absolute top-1/2 left-1/2"
                  initial={{ scale: 0, x: 0, y: 0, rotate: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    x: x,
                    y: y,
                    rotate: [0, 360],
                    opacity: [0, 1, 0.9],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 4.5 + i * 0.08,
                    ease: "backOut"
                  }}
                >
                  <div 
                    className="text-3xl sm:text-5xl"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.8))',
                    }}
                  >
                    🎃
                  </div>
                  {/* Bob animation */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      y: [0, -12, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2
                    }}
                  />
                </motion.div>
              );
            })}

            {/* Stage 12: Purple Magic Sparkles Everywhere (5-6s) */}
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={`sparkle-halloween-${i}`}
                className="absolute w-2 h-2 bg-purple-400 rounded-full"
                style={{
                  top: `${10 + Math.random() * 80}%`,
                  left: `${10 + Math.random() * 80}%`,
                  boxShadow: '0 0 15px rgba(167, 139, 250, 0.9)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 2, 1.5, 0], 
                  opacity: [0, 1, 0.8, 0],
                }}
                transition={{
                  delay: 5 + Math.random() * 0.8,
                  duration: 1,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Stage 13: Final Spider Web Decoration (5.5-6s) */}
            <motion.div
              className="absolute top-[5%] right-[5%]"
              initial={{ scale: 0, opacity: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 1.5, 1.2],
                opacity: [0, 0.9, 0.8],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 1,
                delay: 5.5,
                ease: "backOut"
              }}
            >
              <div className="text-4xl sm:text-6xl">
                🕸️
              </div>
              {/* Dangling spider */}
              <motion.div
                className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-3xl"
                animate={{
                  y: [0, 20, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🕷️
              </motion.div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpecialEffects; 