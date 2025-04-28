import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, Sparkles, Award, Clock, AlertTriangle, TrendingUp, ChevronRight, Rocket } from 'lucide-react';
import { createAuthHeaders, fetchAvailableBoosters, AvailableBoostersResponse } from '@/utils/apiBase';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { BoosterDisplay, SimpleBoosterDisplay } from '@/components/shared/BoosterDisplay';
import { BoosterDetailModal } from '@/components/shared/BoosterDetailModal';
import confetti from 'canvas-confetti';
import { Badge } from '@/components/ui/badge';

// Constants
const PHASE_1_GOAL = 10_000_000;
const PHASE_2_GOAL = 100_000_000;
const PHASE_3_GOAL = 10_000_000_000; // 10 billion for Phase 3
const DEFAULT_FARMING_RATE = 0.1; // Default farming rate in Roar/s

interface FarmingStatus {
  farming: boolean;
  start_time: string;
  booster: number;
  server_time: string;
  elapsed_time: number;
  can_claim: boolean;
  time_remaining: number;
  time_remaining_formatted: string;
}

interface DigitProps {
  value: string;
  animate?: boolean;
  className?: string;
}

// Animated digit component for the timer
const AnimatedDigit: React.FC<DigitProps> = ({ value, animate = false, className = "" }) => {
  return (
    <div className={`bg-amber-100 dark:bg-amber-900/50 w-10 h-12 rounded-md flex items-center justify-center tabular-nums text-2xl font-bold text-amber-800 dark:text-amber-200 shadow-sm relative overflow-hidden ${className}`}>
      {value}
      {animate && (
        <motion.div 
          key={value}
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center bg-amber-100 dark:bg-amber-900/50"
        >
          {value}
        </motion.div>
      )}
    </div>
  );
};

const RoarFarmingPage = () => {
  const [totalRoars, setTotalRoars] = useState<number>(0);
  const [totalRoarsLoading, setTotalRoarsLoading] = useState<boolean>(true);
  const [isFarming, setIsFarming] = useState<boolean>(false);
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const [farmingStatus, setFarmingStatus] = useState<FarmingStatus | null>(null);
  const [earnedRoars, setEarnedRoars] = useState<number>(0);
  const [displayedEarnedRoars, setDisplayedEarnedRoars] = useState<number>(0);
  const [farmStartTime, setFarmStartTime] = useState<number | null>(null);
  const [booster, setBooster] = useState<number>(1);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [farmingProgress, setFarmingProgress] = useState<number>(0);
  
  // Animation states
  const [lionScale, setLionScale] = useState<number>(1);
  const [lionRotate, setLionRotate] = useState<number>(0);
  const [progressPulse, setProgressPulse] = useState<boolean>(false);
  
  // Animation intervals
  const farmingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeEarningsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add this to the component state declarations at the top
  const [secondsKey, setSecondsKey] = useState<number>(0);
  
  // Add new state variables for boosters
  const [boosterData, setBoosterData] = useState<AvailableBoostersResponse | null>(null);
  const [isLoadingBoosters, setIsLoadingBoosters] = useState<boolean>(false);
  const [boosterModalOpen, setBoosterModalOpen] = useState<boolean>(false);
  
  // State for Phase transitions (updated to include Phase 3)
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [displayGoal, setDisplayGoal] = useState<number>(PHASE_1_GOAL);
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  
  const navigate = useNavigate();
  const progressAnimationControls = useAnimation(); // Animation controls for progress bar
  
  // Load total roars and farming status on mount and when farming state changes
  useEffect(() => {
    // Call these at the start of the effect
    fetchTotalRoars();
    checkFarmingStatus();
    
    // Setup polling for farming status (more frequent polling when actively farming)
    const statusInterval = setInterval(() => {
      checkFarmingStatus();
    }, isFarming ? 15000 : 30000); // Check more frequently when farming
    
    return () => {
      clearInterval(statusInterval);
      if (farmingIntervalRef.current) {
        clearInterval(farmingIntervalRef.current);
      }
      if (timeRemainingIntervalRef.current) {
        clearInterval(timeRemainingIntervalRef.current);
      }
      if (realtimeEarningsIntervalRef.current) {
        clearInterval(realtimeEarningsIntervalRef.current);
      }
    };
  }, [isFarming]); // Re-setup when farming state changes
  
  // Add new useEffect to fetch boosters when not farming
  useEffect(() => {
    if (!isFarming) {
      fetchBoosterData();
    }
  }, [isFarming]);
  
  // Fetch total roars from API
  const fetchTotalRoars = async () => {
    try {
      setTotalRoarsLoading(true);
      const response = await fetch('/api/roar_total', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTotalRoars(data.total_roars);

        // --- Phase Transition Logic (updated for Phase 3) --- 
        let currentPhase: 1 | 2 | 3;
        
        if (data.total_roars >= PHASE_2_GOAL) {
          currentPhase = 3; // Phase 3 if we've passed Phase 2 goal
        } else if (data.total_roars >= PHASE_1_GOAL) {
          currentPhase = 2; // Phase 2 if we've passed Phase 1 goal but not Phase 2
        } else {
          currentPhase = 1; // Still in Phase 1
        }
        
        setPhase(currentPhase);

        // Skip transition animations and set directly to phase3Active state
        if (currentPhase === 3) {
          setDisplayGoal(PHASE_3_GOAL);
          const currentDisplayProgress = (data.total_roars / PHASE_3_GOAL) * 100;
          setDisplayProgress(currentDisplayProgress);
          progressAnimationControls.start({ width: `${currentDisplayProgress}%` }, { duration: 0 }); // Set initial progress without animation
        } else if (currentPhase === 2) {
          // Already in Phase 2, just set the correct goal and progress
          setDisplayGoal(PHASE_2_GOAL);
          const currentDisplayProgress = (data.total_roars / PHASE_2_GOAL) * 100;
          setDisplayProgress(currentDisplayProgress);
          progressAnimationControls.start({ width: `${currentDisplayProgress}%` }, { duration: 0 }); // Set initial progress without animation
        } else {
          // Still in Phase 1
          setDisplayGoal(PHASE_1_GOAL);
          const currentDisplayProgress = (data.total_roars / PHASE_1_GOAL) * 100;
          setDisplayProgress(currentDisplayProgress);
          progressAnimationControls.start({ width: `${currentDisplayProgress}%` }, { duration: 0 }); // Set initial progress without animation
        }
        // --- End Phase Transition Logic ---
      }
    } catch (error) {
      console.error('Error fetching total roars:', error);
      // Set defaults even on error
      setDisplayGoal(PHASE_1_GOAL);
      setDisplayProgress(0);
    } finally {
      setTotalRoarsLoading(false);
    }
  };
  
  // Check if user is currently farming
  const checkFarmingStatus = async () => {
    try {
      const userId = localStorage.getItem('dapps_user_id');
      if (!userId) return;
      
      const response = await fetch('/api/roar_farming_status', {
        method: 'GET',
        headers: createAuthHeaders(),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setFarmingStatus(data);
        
        if (data.farming) {
          // User is farming
          setIsFarming(true);
          setBooster(data.booster || 1);
          
          // Store the farm start time for real-time calculations
          if (data.start_time) {
            const startTimeMs = new Date(data.start_time).getTime();
            setFarmStartTime(startTimeMs);
          }
          
          // Check if farming should be active or completed
          if (data.can_claim) {
            // Farming is complete (6 hours passed)
            setCanClaim(true);
            setTimeRemaining('Ready to claim');
            setFarmingProgress(100);
            setSecondsRemaining(0);
            
            // Calculate earned roars for the full 6-hour period
            const earnedAmount = 6 * 3600 * DEFAULT_FARMING_RATE * data.booster;
            setEarnedRoars(earnedAmount);
            setDisplayedEarnedRoars(earnedAmount);
            
            // Stop time tracking but keep animation going
            if (timeRemainingIntervalRef.current) {
              clearInterval(timeRemainingIntervalRef.current);
              timeRemainingIntervalRef.current = null;
            }
          } else {
            // Still farming
            setCanClaim(false);
            setTimeRemaining(data.time_remaining_formatted || '');
            setSecondsRemaining(data.time_remaining || 0);
            
            // Calculate progress percentage (elapsed time / total farming time)
            const totalFarmingTime = 6 * 60 * 60; // 6 hours in seconds
            const elapsedTime = data.elapsed_time;
            const progressPercentage = Math.min(100, (elapsedTime / totalFarmingTime) * 100);
            setFarmingProgress(progressPercentage);
            
            // Calculate earned roars
            const earnedAmount = (elapsedTime / 3600) * 3600 * DEFAULT_FARMING_RATE * data.booster;
            setEarnedRoars(earnedAmount);
            setDisplayedEarnedRoars(earnedAmount);
            
            // Start animation and time tracking if not already running
            if (!farmingIntervalRef.current) {
              startFarmingAnimation();
            }
            
            if (!timeRemainingIntervalRef.current) {
              startTimeTracker(data.time_remaining);
            }
            
            // Start real-time earnings updates
            startRealTimeEarningsUpdate();
          }
        } else {
          // Not farming
          setIsFarming(false);
          setCanClaim(false);
          setEarnedRoars(0);
          setDisplayedEarnedRoars(0);
          setFarmingProgress(0);
          setFarmStartTime(null);
          stopFarmingAnimation();
          stopRealTimeEarningsUpdate();
        }
      }
    } catch (error) {
      console.error('Error checking farming status:', error);
    }
  };
  
  // Start time tracker to show remaining time
  const startTimeTracker = (remainingSeconds: number) => {
    // Clear any existing interval
    if (timeRemainingIntervalRef.current) {
      clearInterval(timeRemainingIntervalRef.current);
      timeRemainingIntervalRef.current = null;
    }
    
    // Ensure we don't exceed the maximum 6 hours (21600 seconds)
    let initialSeconds = Math.min(remainingSeconds, 21600);
    setSecondsRemaining(initialSeconds);
    
    // Record start time for more accurate calculations
    const startTime = Date.now();
    const endTime = startTime + (initialSeconds * 1000);
    
    // Use requestAnimationFrame for smoother animation
    const updateCountdown = () => {
      const now = Date.now();
      const timeLeft = Math.max(0, endTime - now);
      const secondsLeft = Math.ceil(timeLeft / 1000);
      
      // Update state only when the value changes to reduce renders
      if (secondsLeft !== secondsRemaining) {
        setSecondsRemaining(secondsLeft);
        // Force animation update for seconds by changing key
        setSecondsKey(prev => prev + 1);

        // Format the time remaining
        const hours = Math.floor(secondsLeft / 3600);
        const minutes = Math.floor((secondsLeft % 3600) / 60);
        const seconds = secondsLeft % 60;
        
        const formatted = `${hours}h ${minutes}m ${seconds}s`;
        setTimeRemaining(formatted);
        
        // Update progress percentage
        const totalFarmingTime = 6 * 60 * 60; // 6 hours in seconds
        const elapsedTime = totalFarmingTime - secondsLeft;
        const progressPercentage = Math.min(100, (elapsedTime / totalFarmingTime) * 100);
        setFarmingProgress(progressPercentage);
        
        // Update earned roars based on elapsed time - capped at 6 hours worth
        const earnedAmount = Math.min(
          (elapsedTime / 3600) * 3600 * DEFAULT_FARMING_RATE * booster,
          6 * 3600 * DEFAULT_FARMING_RATE * booster
        );
        setEarnedRoars(earnedAmount);
      }

      // When countdown completes
      if (secondsLeft <= 0) {
        // Time's up - can claim now
        setCanClaim(true);
        setTimeRemaining('Ready to claim');
        setFarmingProgress(100);
        
        // Stop the animation frame updates
        // Note: No need to clear interval here, rely on the backup interval clear
        return;
      }
      
      // Continue animation loop
      requestAnimationFrame(updateCountdown);
    };
    
    // Start the animation frame loop for smoother updating
    requestAnimationFrame(updateCountdown);
    
    // As a backup, also update at regular intervals for reliability
    // This ensures updates happen even if the tab is not visible
    timeRemainingIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, endTime - now);
      const secondsLeft = Math.ceil(timeLeft / 1000);
      
      // Update only if different to avoid unnecessary renders
      if (secondsLeft !== secondsRemaining) {
        setSecondsRemaining(secondsLeft);
      }
      
      if (secondsLeft <= 0 && timeRemainingIntervalRef.current) {
        clearInterval(timeRemainingIntervalRef.current);
        timeRemainingIntervalRef.current = null;
      }
    }, 1000);
  };
  
  // Start farming animation
  const startFarmingAnimation = () => {
    // Stop any existing animation first
    stopFarmingAnimation();
    
    // Lion pulse animation
    const lionInterval = setInterval(() => {
      setLionScale(prev => {
        if (prev === 1) return 1.05;
        return 1;
      });
      
      setLionRotate(prev => {
        if (prev === 0) return 5;
        if (prev === 5) return -5;
        return 0;
      });
    }, 2000);
    
    // Progress pulse animation (every 10 seconds)
    const progressInterval = setInterval(() => {
      setProgressPulse(true);
      setTimeout(() => setProgressPulse(false), 1000);
    }, 10000);
    
    // Store both intervals for cleanup
    farmingIntervalRef.current = setInterval(() => {}, 10000); // Adjust interval time as needed
    
    // Clean up function needs to clear both intervals
    const cleanup = () => {
      clearInterval(lionInterval);
      clearInterval(progressInterval);
      if (farmingIntervalRef.current) {
         clearInterval(farmingIntervalRef.current);
      farmingIntervalRef.current = null;
      }
    };

    return cleanup;
  };
  
  // Stop farming animation
  const stopFarmingAnimation = () => {
    // No need to clear intervals here, the cleanup function handles it
    // Just reset the visual state
    setLionScale(1);
    setLionRotate(0);
    setProgressPulse(false);
  };
  
  // Add a function to update earnings in real-time
  const startRealTimeEarningsUpdate = () => {
    // Clear any existing interval
    if (realtimeEarningsIntervalRef.current) {
      clearInterval(realtimeEarningsIntervalRef.current);
    }
    
    // Update earnings multiple times per second for smooth animation
    realtimeEarningsIntervalRef.current = setInterval(() => {
      if (!isFarming || canClaim || !farmStartTime) return;
      
      const now = Date.now();
      const elapsedSeconds = Math.min((now - farmStartTime) / 1000, 6 * 60 * 60); // Cap at 6 hours
      const currentEarnings = elapsedSeconds * DEFAULT_FARMING_RATE * booster;
      
      // Update the displayed value (capped at 6 hours max)
      const maxEarnings = 6 * 3600 * DEFAULT_FARMING_RATE * booster;
      setDisplayedEarnedRoars(Math.min(currentEarnings, maxEarnings));
      
    }, 50); // Update roughly 20 times per second for smooth animation
  };
  
  // Function to stop real-time earnings updates
  const stopRealTimeEarningsUpdate = () => {
    if (realtimeEarningsIntervalRef.current) {
      clearInterval(realtimeEarningsIntervalRef.current);
      realtimeEarningsIntervalRef.current = null;
    }
  };
  
  // Start farming
  const startFarming = async () => {
    try {
      setIsStarting(true);
      
      const response = await fetch('/api/roar_farming_start', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({}),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store farm start time for real-time calculations
        const startTimeMs = Date.now();
        setFarmStartTime(startTimeMs);
        
        // Properly set farming status
        setIsFarming(true);
        setBooster(data.booster || 1);
        
        // Set initial time remaining before the tracker starts
        setTimeRemaining(data.time_remaining_formatted || '6h 0m 0s');
        
        // Start animation and time tracking
        startFarmingAnimation();
        startTimeTracker(21600); // 6 hours in seconds
        startRealTimeEarningsUpdate();
        
        // Refresh farming status after a short delay
        setTimeout(() => {
          checkFarmingStatus();
        }, 1000);
      } else {
        console.error(data.message || 'Failed to start farming');
      }
    } catch (error) {
      console.error('Error starting farming:', error);
    } finally {
      setIsStarting(false);
    }
  };
  
  // Claim farmed roars
  const claimRoars = async () => {
    try {
      setIsClaiming(true);
      
      const response = await fetch('/api/roar_farming_claim', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({}),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Create an exciting celebration effect
        celebrateSuccessfulClaim(displayedEarnedRoars);
        
        // Reset all farming states
        setIsFarming(false);
        setCanClaim(false);
        setEarnedRoars(0);
        setDisplayedEarnedRoars(0);
        setFarmingProgress(0);
        setFarmStartTime(null);
        setSecondsRemaining(0);
        
        // Stop all animations and intervals
        stopFarmingAnimation();
        stopRealTimeEarningsUpdate();
        
        if (timeRemainingIntervalRef.current) {
          clearInterval(timeRemainingIntervalRef.current);
          timeRemainingIntervalRef.current = null;
        }
        
        // Refresh total roars
        fetchTotalRoars();
      } else {
        console.error(data.message || 'Failed to claim roars');
      }
    } catch (error) {
      console.error('Error claiming roars:', error);
    } finally {
      setIsClaiming(false);
    }
  };
  
  // Add celebration animation function
  const celebrateSuccessfulClaim = (earnedAmount: number) => {
    // Create and add CSS for celebration animations if not present
    if (!document.getElementById('celebration-styles')) {
      const style = document.createElement('style');
      style.id = 'celebration-styles';
      style.innerHTML = `
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
        
        @keyframes scale-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes rotate-glow {
          0% { transform: rotate(0deg); filter: hue-rotate(0deg); }
          100% { transform: rotate(360deg); filter: hue-rotate(360deg); }
        }
        
        .celebration-roar {
          position: fixed;
          font-size: 24px;
          color: #F59E0B;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
          user-select: none;
          pointer-events: none;
          z-index: 9999;
          animation: float-up 2s ease-out forwards;
          will-change: transform, opacity;
        }
        
        .claim-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fade-in 0.3s ease-out;
        }
        
        .claim-card {
          background: radial-gradient(circle, #FEF3C7, #F59E0B);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.7);
          max-width: 90%;
          width: 350px;
          position: relative;
          overflow: hidden;
        }
        
        .rotating-glow {
          position: absolute;
          inset: -100px;
          background: conic-gradient(
            rgba(245, 158, 11, 0),
            rgba(245, 158, 11, 0.3),
            rgba(245, 158, 11, 0.7),
            rgba(245, 158, 11, 0.3),
            rgba(245, 158, 11, 0)
          );
          animation: rotate-glow 8s linear infinite;
          z-index: -1;
        }
        
        .glow-bg {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: radial-gradient(circle at center, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
          animation: scale-pulse 2s ease-in-out infinite;
          z-index: -1;
        }
        
        @keyframes lion-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shine {
          0% { background-position: -100px; }
          60% { background-position: 200px; }
          100% { background-position: 200px; }
        }
        
        .shine-text {
          position: relative;
          overflow: hidden;
        }
        
        .shine-text::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.8) 50%, 
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200px 100%;
          background-repeat: no-repeat;
          background-position: -100px;
          animation: shine 2s infinite;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Fire multiple confetti bursts at different angles
    const fireConfetti = () => {
      // Center burst
        confetti({
        particleCount: 100,
        spread: 120,
        origin: { x: 0.5, y: 0.7 },
        colors: ['#FFD700', '#F59E0B', '#FEF3C7', '#92400E', '#FBBF24'],
          shapes: ['circle', 'square'],
        gravity: 1,
        scalar: 1.2,
        drift: 0,
        ticks: 300
        });
        
      // Left burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.8 },
          colors: ['#FFD700', '#F59E0B', '#FEF3C7'],
          gravity: 0.7,
          drift: 1,
          ticks: 250
        });
      }, 200);
      
      // Right burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.8 },
          colors: ['#FFD700', '#F59E0B', '#FEF3C7'],
          gravity: 0.7,
          drift: -1,
          ticks: 250
        });
      }, 400);
      
      // Add top "firework" bursts
      setTimeout(() => {
        const x = 0.3 + Math.random() * 0.4;
        const y = 0.3 + Math.random() * 0.2;
          confetti({
          particleCount: 40,
          startVelocity: 30,
          spread: 360,
          origin: { x, y },
          gravity: 0.8,
          ticks: 200,
          colors: ['#FFD700', '#F59E0B', '#D97706']
        });
      }, 600);
      
          setTimeout(() => {
        const x = 0.3 + Math.random() * 0.4;
        const y = 0.3 + Math.random() * 0.2;
            confetti({
          particleCount: 40,
              startVelocity: 30,
              spread: 360,
              origin: { x, y },
              gravity: 0.8,
          ticks: 200,
          colors: ['#FFD700', '#F59E0B', '#D97706']
        });
      }, 900);
    };
    
    // Create floating ROAR numbers animation
    const createFloatingRoars = () => {
      const count = 10;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const roar = document.createElement('div');
          roar.className = 'celebration-roar';
          const randomValue = (Math.random() * earnedAmount * 0.2 + earnedAmount * 0.1).toFixed(1);
          roar.textContent = `+${randomValue} 🦁`;
          
          // Position randomly on the screen with a bias toward the center
          const x = 30 + Math.random() * 60; // Between 30-90% of screen width
          const y = 30 + Math.random() * 60; // Between 30-90% of screen height
          
          roar.style.left = `${x}vw`;
          roar.style.top = `${y}vh`;
          
          document.body.appendChild(roar);
          
          // Remove after animation completes
          setTimeout(() => {
            roar.remove();
          }, 2000);
        }, i * 200); // Stagger the appearances
      }
    };
    
    // Create a modal with a counting animation
    const showClaimModal = () => {
      // Create modal structure
      const overlay = document.createElement('div');
      overlay.className = 'claim-overlay';
      
      const card = document.createElement('div');
      card.className = 'claim-card';
      
      // Add rotating glow effect
      const rotatingGlow = document.createElement('div');
      rotatingGlow.className = 'rotating-glow';
      card.appendChild(rotatingGlow);
      
      // Add pulsing background
      const glowBg = document.createElement('div');
      glowBg.className = 'glow-bg';
      card.appendChild(glowBg);
      
      // Add lion emoji
      const lion = document.createElement('div');
      lion.style.fontSize = '72px';
      lion.style.marginBottom = '10px';
      lion.style.animation = 'lion-bounce 1s ease-in-out infinite';
      lion.textContent = '🦁';
      card.appendChild(lion);
      
      // Add success text
      const title = document.createElement('h2');
      title.className = 'shine-text';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.color = '#92400E';
      title.style.marginBottom = '8px';
      title.textContent = 'Roars Claimed!';
      card.appendChild(title);
      
      // Add amount with counting animation
      const amount = document.createElement('div');
      amount.style.fontSize = '36px';
      amount.style.fontWeight = 'bold';
      amount.style.color = '#92400E';
      amount.style.margin = '16px 0';
      amount.style.fontFamily = 'monospace';
      
      // Start counting animation
      let displayAmount = 0;
      const step = earnedAmount / 40; // Complete in 40 steps
      const countInterval = setInterval(() => {
        displayAmount += step;
        if (displayAmount >= earnedAmount) {
          displayAmount = earnedAmount;
          clearInterval(countInterval);
          
          // Add sparkle animation when counting is complete
          amount.style.textShadow = '0 0 10px rgba(245, 158, 11, 0.8)';
          amount.style.transition = 'text-shadow 0.3s ease-out';
        }
        amount.textContent = `${displayAmount.toFixed(2)} ROAR`;
      }, 50);
      
      card.appendChild(amount);
      
      // Add close button
      const button = document.createElement('button');
      button.style.backgroundColor = '#92400E';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '8px';
      button.style.padding = '10px 20px';
      button.style.fontSize = '16px';
      button.style.fontWeight = 'bold';
      button.style.marginTop = '10px';
      button.style.cursor = 'pointer';
      button.style.transition = 'transform 0.2s ease, background-color 0.2s ease';
      button.textContent = 'Awesome!';
      
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#78350F';
        button.style.transform = 'scale(1.05)';
      });
      
      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#92400E';
        button.style.transform = 'scale(1)';
      });
      
      button.addEventListener('click', () => {
        // Fade out and remove the overlay
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease-out';
        
        setTimeout(() => {
          overlay.remove();
        }, 300);
      });
      
      card.appendChild(button);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
    };
    
    // Execute all celebration effects
    fireConfetti();
    createFloatingRoars();
    
    // Show modal after a slight delay
    setTimeout(() => {
      showClaimModal();
    }, 300);
  };
  
  // Update the formatLargeNumber function to handle billions
  const formatLargeNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1)}B`;
    } else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };
  
  // Use displayProgress for the gradient calculation
  const getProgressGradient = () => {
    if (phase === 3) {
      // Special gradient for Phase 3
      return "bg-gradient-to-r from-amber-500 via-blue-500 to-purple-500";
    } else if (displayProgress > 80) {
      return "bg-gradient-to-r from-amber-500 via-red-500 to-amber-500";
    } else if (displayProgress > 50) {
      return "bg-gradient-to-r from-amber-400 to-amber-500";
    } else {
      return "bg-amber-400";
    }
  };
  
  // Add new function to fetch booster data
  const fetchBoosterData = async () => {
    try {
      setIsLoadingBoosters(true);
      const data = await fetchAvailableBoosters();
      if (data && data.success) {
        setBoosterData(data);
      } else {
        // Handle case where fetchAvailableBoosters fails or returns success: false
        console.warn('Failed to fetch booster data or API returned unsuccessful status.');
        setBoosterData(null); // Or set to a default error state if needed
      }
    } catch (error) {
      console.error('Error fetching booster data:', error);
      setBoosterData(null); // Ensure boosterData is null on error
    } finally {
      setIsLoadingBoosters(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Roar Farming | Dapps Community</title>
      </Helmet>
      
      {/* Add booster modal */}
      <BoosterDetailModal 
        open={boosterModalOpen} 
        onOpenChange={setBoosterModalOpen} 
        boosterData={boosterData}
      />
      
      {/* Added extra top margin to prevent content from being cut off by navigation */}
      <div className="container max-w-md mx-auto px-4 py-6 mt-14">
        {/* Global progress card - now a separate section */}
        <Card className="border-amber-200 dark:border-amber-800/40 shadow-md mb-5 relative overflow-hidden">
          <CardContent className="p-4">
            <motion.div
              initial={false}
              animate={{ filter: 'blur(0px)' }}
              transition={{ duration: 0.5 }}
            >
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Global Roar Progress 
                    {phase === 3 ? (
                      <span className="ml-1 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full">Phase 3</span>
                    ) : phase === 2 ? (
                      <span className="ml-1 text-xs text-purple-700">(Phase 2)</span>
                    ) : (
                      <span className="ml-1 text-xs text-amber-700">(Phase 1)</span>
                    )}
                  </h3>
                <span className="text-xs text-muted-foreground">
                    {/* Use displayProgress */}
                    {displayProgress.toFixed(1)}% Complete
                </span>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Community Goal</span>
                <span className="font-medium tabular-nums">
                    {/* Use totalRoars and displayGoal */}
                    {formatLargeNumber(totalRoars)} / {formatLargeNumber(displayGoal)} ROAR
                </span>
              </div>
              
                {/* Animated Progress Bar */}
                 <motion.div className="h-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${getProgressGradient()}`} 
                    initial={{ width: "0%" }}
                    animate={progressAnimationControls}
              />
                </motion.div>
              
                {/* Warning label - enhanced for Phase 3 */}
                {phase === 3 && totalRoars / PHASE_3_GOAL > 0.7 && (
                <div className="mt-2 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.03, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-pink-50 text-amber-800 px-2 py-1 rounded text-xs font-medium border border-amber-200"
                  >
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span>Final phase ending soon! Farm now!</span>
                  </motion.div>
                </div>
              )}
              
                {/* Booster link */}
              <div className="flex justify-end mt-3">
                <Link 
                  to="/boosters" 
                  className="text-xs flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  View all boosters
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            </motion.div>
          </CardContent>
        </Card>
        
        {/* Main farming card */}
        <Card className="border-amber-200 dark:border-amber-800/40 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Roar Farming
            </CardTitle>
            
            <div className="text-center text-sm text-muted-foreground">
              Earn ROAR tokens by actively participating in the community
            </div>
            
            {/* Show current farming rate when farming */}
            {isFarming && (
              <div className="flex justify-center mt-1.5">
                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="tabular-nums">{(DEFAULT_FARMING_RATE * booster).toFixed(2)} 🦁/s</span>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col items-center">
              {/* Lion farming indicator */}
              <div className="relative w-44 h-44 mb-4">
                {/* Circular progress indicator */}
                <div className="absolute inset-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="#FEF3C7" 
                      strokeWidth="8" 
                      fill="none" 
                      className="dark:opacity-30"
                    />
                    {isFarming && (
                      <motion.circle 
                        cx="50" cy="50" r="40" 
                        stroke="url(#gradient)" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: `${2 * Math.PI * 40}` }}
                        animate={{ strokeDashoffset: `${2 * Math.PI * 40 * (1 - farmingProgress / 100)}`}}
                        transition={{ duration: 0.5, ease: "linear" }}
                        className={`transition-all duration-500 ${progressPulse ? 'opacity-80' : 'opacity-100'}`}
                      />
                    )}
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Inner area for the lion */}
                <div className="absolute inset-[18px] rounded-full bg-background"></div>
                
                {/* Lion icon */}
                <motion.div
                  animate={{ 
                    scale: lionScale,
                    rotate: lionRotate,
                  }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative flex items-center justify-center w-32 h-32 bg-amber-50 rounded-full shadow-lg border-4 border-amber-100">
                    <span className="text-7xl select-none">🦁</span>
                    
                    {/* Circle pulse when approaching completion */}
                    {isFarming && farmingProgress > 90 && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.7, 0, 0.7],
                        }}
                        transition={{ 
                          repeat: Infinity,
                          duration: 1.5,
                        }}
                        className="absolute inset-0 bg-amber-300 rounded-full"
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </div>
                </motion.div>
              </div>
              
              {/* Earned amount with dynamic animation */}
              {isFarming && (
                <div className="text-center mb-6">
                  <div className="text-sm text-muted-foreground mb-1">Earned so far</div>
                  <div className="text-3xl font-bold text-amber-600 tabular-nums transition-all duration-300">
                    {displayedEarnedRoars.toFixed(2)}
                  </div>
                </div>
              )}
              
              {/* Action buttons with improved dynamic styling */}
              <div className="w-full flex flex-col items-center gap-3 mt-2 relative z-10">
                {canClaim ? (
                  <Button
                    size="lg"
                    className="w-full max-w-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg transition-all duration-300 hover:scale-105"
                    onClick={claimRoars}
                    disabled={isClaiming}
                  >
                    {isClaiming ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Award className="h-5 w-5 mr-2 animate-pulse" />
                    )}
                    <span className="tabular-nums">Claim {displayedEarnedRoars.toFixed(2)} Roars</span>
                  </Button>
                ) : isFarming ? (
                  <div className="w-full max-w-xs">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-700/40 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Time Remaining</span>
                        </div>
                        <span className="text-xs font-medium text-amber-600/70 bg-amber-100/50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                          {Math.floor((100 - farmingProgress))}% left
                        </span>
                      </div>
                      
                      <div className="flex justify-center mt-3 mb-1 font-mono">
                        <div className="flex items-center gap-1">
                          {/* Hours */}
                          <div className="flex items-end">
                            <AnimatedDigit value={Math.floor(secondsRemaining / 3600).toString().padStart(2, '0').charAt(0)} />
                            <AnimatedDigit value={Math.floor(secondsRemaining / 3600).toString().padStart(2, '0').charAt(1)} className="ml-1" />
                            <span className="mx-1 text-xl text-amber-500 animate-pulse">:</span>
                          </div>
                          
                          {/* Minutes */}
                          <div className="flex items-end">
                            <AnimatedDigit value={Math.floor((secondsRemaining % 3600) / 60).toString().padStart(2, '0').charAt(0)} />
                            <AnimatedDigit value={Math.floor((secondsRemaining % 3600) / 60).toString().padStart(2, '0').charAt(1)} className="ml-1" />
                            <span className="mx-1 text-xl text-amber-500 animate-pulse">:</span>
                          </div>
                          
                          {/* Seconds - always animated */}
                          <div className="flex items-end">
                            <AnimatedDigit 
                              key={`sec1-${secondsKey}`}
                              value={(secondsRemaining % 60).toString().padStart(2, '0').charAt(0)} 
                              animate={true} 
                            />
                            <AnimatedDigit 
                              key={`sec2-${secondsKey}`}
                              value={(secondsRemaining % 60).toString().padStart(2, '0').charAt(1)} 
                              animate={true}
                              className="ml-1" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-amber-100/50 dark:bg-amber-900/30">
                          <motion.div
                            style={{ width: `${farmingProgress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-400 to-amber-500"
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="lg"
                      className="w-full bg-amber-200/80 hover:bg-amber-200/80 text-amber-800 cursor-not-allowed"
                      disabled
                    >
                      <Clock className="h-5 w-5 mr-2" />
                      Claim after time expires
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Display available boosters above the button when not farming */}
                    {!isLoadingBoosters && boosterData && boosterData.total > 0 && (
                      <SimpleBoosterDisplay 
                        boosters={boosterData} 
                        onClick={() => setBoosterModalOpen(true)} 
                      />
                    )}
                    
                    <Button
                      size="lg"
                      className="w-full max-w-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg transition-all duration-300 hover:scale-105"
                      onClick={startFarming}
                      disabled={isStarting}
                    >
                      {isStarting ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5 mr-2" />
                      )}
                      Start Farming
                    </Button>
                  </>
                )}
                
                {/* Booster link - now positioned directly after the information section */}
                <Link 
                  to="/boosters"
                  className="flex justify-between items-center px-4 py-3 mt-4 mb-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
                >
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                    <span className="font-medium">Boost your Farming</span>
                  </div>
                  <div className="flex items-center text-amber-600 dark:text-amber-400">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default RoarFarmingPage; 