import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, cubicBezier } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Coins, Users, ArrowRight, Zap, Sparkles, MessageCircle, Share2, Heart } from 'lucide-react';
import { DeviceInfo } from '@/utils/deviceUtils';

interface MobileAppLandingProps {
  onGetStarted: () => void;
  isLoggingIn: boolean;
  deviceInfo: DeviceInfo | null;
  isAndroidApp: boolean;
  isIOSApp: boolean;
  onPrivyClosed?: () => void; // Add callback for when Privy is closed
}

const MobileAppLanding: React.FC<MobileAppLandingProps> = ({
  onGetStarted,
  isLoggingIn,
  deviceInfo,
  isAndroidApp,
  isIOSApp,
  onPrivyClosed
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  // Handle fake button reset after 5 seconds in case onPrivyClosed isn't called
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoggingIn) {
      timer = setTimeout(() => {
        if (onPrivyClosed) onPrivyClosed();
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [isLoggingIn, onPrivyClosed]);
  
  // Theme colors
  const colors = {
    primary: '#31bcc3',
    secondary: '#0891b2',
    tertiary: '#06b6d4',
    highlight: '#0ea5e9',
    accent: '#7dd3fc',
    white: '#ffffff'
  };
  
  // Setup animation when component mounts
  useEffect(() => {
    if (containerRef.current) {
      controls.start("visible");
    }
    
    // Create stars animation using direct DOM manipulation for better performance
    if (animationRef.current) {
      setupParticleAnimation();
    }
    
    return () => {
      // Cleanup animation
      if (window.particleAnimationFrame) {
        cancelAnimationFrame(window.particleAnimationFrame);
      }
    };
  }, [controls]);
  
  // Create and manage particle animation directly with DOM for better performance
  const setupParticleAnimation = () => {
    if (!animationRef.current) return;
    
    const animationContainer = animationRef.current;
    animationContainer.innerHTML = ''; // Clear previous animation
    
    // Animation canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas to full size of container
    const updateCanvasSize = () => {
      canvas.width = animationContainer.clientWidth;
      canvas.height = animationContainer.clientHeight;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Add canvas to container
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    animationContainer.appendChild(canvas);
    
    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      color: string;
      opacity: number;
      connections: Particle[] = [];
      
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 1.5; // Start some below screen
        this.size = 1 + Math.random() * 1.5;
        this.speed = 0.5 + Math.random() * 0.8;
        
        // Color distribution
        const colorRoll = Math.random();
        this.color = colorRoll > 0.85 ? colors.primary : 
                     colorRoll > 0.7 ? colors.secondary :
                     colorRoll > 0.55 ? colors.highlight : 
                     colors.white;
                     
        this.opacity = 0.3 + Math.random() * 0.4; // Slightly higher opacity for debug
      }
      
      update() {
        // Move upward
        this.y -= this.speed;
        
        // Wrap around when off screen
        if (this.y < -10) {
          this.y = canvas.height + 10;
          this.x = Math.random() * canvas.width;
        }
        
        // Slight horizontal drift using sine
        this.x += Math.sin(Date.now() * 0.001 * this.speed) * 0.5;
        
        // Keep within canvas
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width) this.x = canvas.width;
      }
      
      draw() {
        if (!ctx) return;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
      }
    }
    
    // Create particles
    const particleCount = 250;
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    
    // Function to draw connections between particles
    const drawConnections = () => {
      if (!ctx) return;
      
      ctx.lineWidth = 0.3;
      ctx.strokeStyle = colors.primary;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Connect if close enough
          if (distance < 100) {
            // Fade out with distance
            const opacity = 0.2 * (1 - distance / 100);
            
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.globalAlpha = opacity;
            ctx.stroke();
          }
        }
      }
    };
    
    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw connections
      drawConnections();
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Continue animation
      window.particleAnimationFrame = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
  };
  
  // Rising glow effects
  const GlowEffects = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div 
            key={`glow-${i}`}
            className="absolute w-20 h-20 rounded-full opacity-0"
            style={{
              left: `${10 + (i * 16)}%`,
              bottom: "-5%",
              background: `radial-gradient(circle, ${colors.primary}30 0%, ${colors.secondary}10 70%, rgba(0,0,0,0) 100%)`,
              filter: "blur(10px)"
            }}
            animate={{
              y: [0, -window.innerHeight * 1.2],
              scale: [1, i % 2 === 0 ? 2 : 1.5],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 10 + (i * 2),
              repeat: Infinity,
              delay: i * 3,
              ease: cubicBezier(0.25, 0.1, 0.25, 1)
            }}
          />
        ))}
      </div>
    );
  };
  
  // Button click handler - prevent button from getting stuck
  const handleButtonClick = () => {
    onGetStarted();
    // The parent component should handle the isLoggingIn state
  };
  
  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-[100vh] justify-between relative overflow-hidden bg-background text-foreground"
    >
      {/* Animation layers */}
      <GlowEffects />
      
      {/* Star particles animation container */}
      <div 
        ref={animationRef}
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      />
      
      {/* Main Content Section */}
      <main className="flex-1 flex flex-col justify-center px-8 z-10 overflow-hidden">
        {/* Logo moved to top of main content */}
        <motion.div 
          className="flex justify-center items-center relative mb-6"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <img 
            src="/images/logo1.png" 
            alt="Dapps.co Logo" 
            className="h-12 relative z-10"
          />
          {/* Logo glow effect */}
          <motion.div
            className="absolute h-24 w-24 rounded-full"
            style={{ 
              background: "radial-gradient(circle, rgba(49,188,195,0.2) 0%, rgba(8,145,178,0.1) 60%, rgba(0,0,0,0) 100%)",
              filter: "blur(2px)"
            }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
              background: [
                "radial-gradient(circle, rgba(49,188,195,0.2) 0%, rgba(8,145,178,0.1) 60%, rgba(0,0,0,0) 100%)",
                "radial-gradient(circle, rgba(49,188,195,0.3) 0%, rgba(8,145,178,0.2) 60%, rgba(0,0,0,0) 100%)",
                "radial-gradient(circle, rgba(49,188,195,0.2) 0%, rgba(8,145,178,0.1) 60%, rgba(0,0,0,0) 100%)"
              ]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        </motion.div>
        
        {/* Badge */}
        <motion.div
          className="self-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="px-4 py-1.5 bg-gradient-to-r from-[#31bcc3]/20 to-primary/10 rounded-full flex items-center gap-2 relative overflow-hidden">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)"
                ],
                left: ["-100%", "200%"]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
            <Sparkles className="h-3.5 w-3.5 text-[#31bcc3]" />
            <motion.span 
              className="text-xs font-medium"
              animate={{ color: ["#31bcc3", "#0891b2", "#31bcc3"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="font-bold">85,000+</span> members on waitlist
            </motion.span>
          </div>
        </motion.div>
        
        {/* Main heading with dramatic animation */}
        <div className="text-center mx-auto mb-6 max-w-sm">
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.h1
              className="text-3xl font-bold leading-tight mb-2"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.5 }}
            >
              Communities Create Revolutions
            </motion.h1>
          </motion.div>
          
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <motion.p
              className="text-muted-foreground text-lg px-4"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.9 }}
            >
              Join the first web3 platform where communities own, govern, and share in the value they create together.
            </motion.p>
          </motion.div>
        </div>
        
        {/* Social features hint */}
        <div className="flex justify-center gap-6 mb-12">
          {[
            { Icon: Users, text: "Connect" },
            { Icon: MessageCircle, text: "Engage" },
            { Icon: Coins, text: "Earn" }
          ].map(({ Icon, text }, index) => (
            <motion.div
              key={`feature-${index}`}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + (index * 0.2) }}
            >
              <motion.div
                className="bg-gradient-to-br from-[#31bcc3]/20 to-primary/20 backdrop-blur-sm p-2 rounded-lg mb-2"
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  y: [0, -5, 0],
                  boxShadow: [
                    "0 0 0 rgba(49, 188, 195, 0)",
                    "0 0 10px rgba(49, 188, 195, 0.3)",
                    "0 0 0 rgba(49, 188, 195, 0)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
              >
                <Icon className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="text-xs font-medium text-muted-foreground">{text}</span>
            </motion.div>
          ))}
        </div>
      </main>
      
      {/* Bottom Section - Call to Action */}
      <footer className="pb-10 px-8 z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 100 }}
        >
          <div className="relative group">
            {/* Button glow effect */}
            <motion.div
              className="absolute -inset-1 rounded-xl blur-md opacity-70 group-hover:opacity-100"
              animate={{
                background: [
                  "linear-gradient(45deg, #31bcc3 0%, #0891b2 100%)",
                  "linear-gradient(45deg, #0891b2 0%, #31bcc3 100%)",
                  "linear-gradient(45deg, #31bcc3 0%, #0891b2 100%)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            <Button
              className="w-full py-7 bg-black group-hover:bg-black/90 text-white dark:border-none relative overflow-hidden z-10"
              onClick={handleButtonClick}
              disabled={isLoggingIn}
            >
              {/* Button light reflection */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  left: ["-100%", "200%"]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              />
              
              {isLoggingIn ? (
                <motion.div
                  className="flex items-center justify-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <motion.div
                    className="w-4 h-4 mr-2 rounded-full border-2 border-t-transparent border-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Processing...</span>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center justify-center font-medium text-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="mr-1.5">Get Started</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      repeatType: "mirror",
                      repeatDelay: 0.5
                    }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </motion.div>
              )}
            </Button>
          </div>
        </motion.div>
      </footer>
    </div>
  );
};

// Add this type declaration to fix the TypeScript error
declare global {
  interface Window {
    particleAnimationFrame: number;
  }
}

export default MobileAppLanding; 