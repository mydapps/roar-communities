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
  const [hasSeenPhase2Transition, setHasSeenPhase2Transition] = useState<boolean>(false);
  const [hasSeenPhase3Transition, setHasSeenPhase3Transition] = useState<boolean>(false);
  const [animationStep, setAnimationStep] = useState<'idle' | 'completingPhase2' | 'phase2Done' | 'startingPhase3' | 'phase3Active'>('idle');
  const [showPhase3Blink, setShowPhase3Blink] = useState<boolean>(false);
  
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

        const seenPhase2Transition = localStorage.getItem('hasSeenPhase2Transition') === 'true';
        const seenPhase3Transition = localStorage.getItem('hasSeenPhase3Transition') === 'true';
        setHasSeenPhase2Transition(seenPhase2Transition);
        setHasSeenPhase3Transition(seenPhase3Transition);

        // Calculate current progress based on current phase
        let currentDisplayProgress;
        let currentGoal;
        
        if (currentPhase === 3) {
          currentDisplayProgress = (data.total_roars / PHASE_3_GOAL) * 100;
          currentGoal = PHASE_3_GOAL;
        } else if (currentPhase === 2) {
          currentDisplayProgress = (data.total_roars / PHASE_2_GOAL) * 100;
          currentGoal = PHASE_2_GOAL;
        } else {
          currentDisplayProgress = (data.total_roars / PHASE_1_GOAL) * 100;
          currentGoal = PHASE_1_GOAL;
        }

        // Handle Phase 3 transition animation
        if (currentPhase === 3 && !seenPhase3Transition && animationStep === 'idle') {
          // Start the Phase 3 transition animation
          setDisplayGoal(PHASE_2_GOAL); // Start with Phase 2 goal
          setDisplayProgress((data.total_roars / PHASE_2_GOAL) * 100); // Calculate initial progress based on Phase 2
          progressAnimationControls.start({ width: `${(data.total_roars / PHASE_2_GOAL) * 100}%` }, { duration: 0 }); // Set initial width
          console.log("Starting Phase 3 transition animation");
          setAnimationStep('completingPhase2');
        } else if (currentPhase === 3 && seenPhase3Transition) {
          // Phase 3 already active and seen, just set goal and trigger blink
          setDisplayGoal(PHASE_3_GOAL);
          setDisplayProgress(currentDisplayProgress);
          progressAnimationControls.start({ width: `${currentDisplayProgress}%` }, { duration: 0 }); // Set initial progress without animation
          setShowPhase3Blink(true);
          setTimeout(() => setShowPhase3Blink(false), 3000); // Blink for 3 seconds
          setAnimationStep('phase3Active'); // Ensure animation state is correct
        } else if (currentPhase === 2) {
          // Already in Phase 2, just set the correct goal and progress
          setDisplayGoal(PHASE_2_GOAL);
          setDisplayProgress(currentDisplayProgress);
          progressAnimationControls.start({ width: `${currentDisplayProgress}%` }, { duration: 0 }); // Set initial progress without animation
          setAnimationStep('idle'); // Reset animation state if needed
        } else {
          // Still in Phase 1
          setDisplayGoal(PHASE_1_GOAL);
          setDisplayProgress(currentDisplayProgress);
          progressAnimationControls.start({ width: `${currentDisplayProgress}%` }, { duration: 0 }); // Set initial progress without animation
          setAnimationStep('idle'); // Reset animation state if needed
        }
        // --- End Phase Transition Logic ---
      }
    } catch (error) {
      console.error('Error fetching total roars:', error);
      toast.error('Failed to load total roars data');
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
        
        toast.success('Roar farming started successfully!');
        
        // Start animation and time tracking
        startFarmingAnimation();
        startTimeTracker(21600); // 6 hours in seconds
        startRealTimeEarningsUpdate();
        
        // Refresh farming status after a short delay
        setTimeout(() => {
          checkFarmingStatus();
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to start farming');
      }
    } catch (error) {
      console.error('Error starting farming:', error);
      toast.error('Failed to start farming');
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
        toast.success(`Successfully claimed ${data.amount.toFixed(2)} Roars! 🦁`);
        
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
        toast.error(data.message || 'Failed to claim roars');
      }
    } catch (error) {
      console.error('Error claiming roars:', error);
      toast.error('Failed to claim roars');
    } finally {
      setIsClaiming(false);
    }
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

  // Add CSS for shake and highlight animations
  useEffect(() => {
    // Insert the style for flash animation if not already present
    if (!document.getElementById('animation-styles')) {
      const style = document.createElement('style');
      style.id = 'animation-styles';
      style.innerHTML = `
        @keyframes screen-flash {
          0% { background-color: transparent; }
          10% { background-color: rgba(255, 255, 255, 0.9); }
          100% { background-color: transparent; }
        }
        .flash-animation::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: transparent;
          z-index: 9999;
          pointer-events: none;
          animation: screen-flash 0.5s ease-out forwards;
        }
        
        @keyframes shake {
          0% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-5px, -5px) rotate(-1deg); }
          20% { transform: translate(5px, 0) rotate(1deg); }
          30% { transform: translate(-5px, 5px) rotate(0deg); }
          40% { transform: translate(5px, 5px) rotate(1deg); }
          50% { transform: translate(-5px, -5px) rotate(-1deg); }
          60% { transform: translate(5px, 0) rotate(0deg); }
          70% { transform: translate(-5px, 5px) rotate(-1deg); }
          80% { transform: translate(5px, 5px) rotate(1deg); }
          90% { transform: translate(-5px, -5px) rotate(0deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        
        .shake-animation {
          animation: shake 3s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes highlight-pulse {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(79, 70, 229, 0); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        
        .phase3-highlight {
          animation: highlight-pulse 2s ease-out infinite;
          border: 3px solid #4F46E5;
        }
        
        .lion-emoji {
          position: fixed;
          font-size: 24px;
          user-select: none;
          pointer-events: none;
          z-index: 9999;
          will-change: transform, opacity;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Optional: Remove style on component unmount
    };
  }, []);

  // Modified useEffect for animation steps with lion emoji confetti and shake effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let confettiIntervalId: NodeJS.Timeout | null = null;
    let particleIntervalId: NodeJS.Timeout | null = null;
    let lionEmojiIntervalId: NodeJS.Timeout | null = null;
    let lionEmojis: HTMLElement[] = [];

    const playSound = (sound: 'complete' | 'start') => {
      // Placeholder for sound effect logic
      console.log(`SOUND: Playing sound - ${sound}`);
      // try { const audio = new Audio(`/sounds/${sound}.mp3`); audio.play(); } catch(e) {}
    }

    // Function to create lion emoji confetti
    const createLionEmoji = () => {
      const lion = document.createElement('div');
      lion.className = 'lion-emoji';
      lion.textContent = '🦁';
      lion.style.left = `${Math.random() * 100}vw`;
      lion.style.top = `-50px`;
      
      // Random size variations for lions
      const size = Math.random() * 30 + 20;
      lion.style.fontSize = `${size}px`;
      
      // Random rotation
      const rotation = Math.random() * 360;
      lion.style.transform = `rotate(${rotation}deg)`;
      
      document.body.appendChild(lion);
      lionEmojis.push(lion);
      
      // Animate lion falling with random horizontal movement
      const duration = Math.random() * 3000 + 3000;
      const finalX = Math.random() * 200 - 100; // Random x offset
      const finalRotation = rotation + (Math.random() * 360 - 180);
      
      lion.animate([
        { transform: `translateX(0) translateY(0) rotate(${rotation}deg)`, opacity: 1 },
        { transform: `translateX(${finalX}px) translateY(${window.innerHeight + 100}px) rotate(${finalRotation}deg)`, opacity: 0 }
      ], {
        duration,
        easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)'
      }).onfinish = () => {
        lion.remove();
        lionEmojis = lionEmojis.filter(l => l !== lion);
      };
    }

    if (animationStep === 'completingPhase2') {
      // Animate progress to 100% with a more dynamic easing
      const duration = 2000; // Animation duration in ms
      progressAnimationControls.start({ 
        width: "100%", 
        transition: { 
          duration: duration / 1000, 
          ease: [0.34, 1.56, 0.64, 1], // Custom spring-like ease
        } 
      });

      // Play more exciting sound
      playSound('complete');

      // Start lion emoji confetti
      lionEmojiIntervalId = setInterval(() => {
        for (let i = 0; i < 3; i++) {
          createLionEmoji();
        }
      }, 300);

      // Trigger super enhanced confetti effect for Phase 3
      const endConfetti = Date.now() + 9000; // Extended confetti for 9 seconds
      const confettiTick = () => {
        // Golden burst from the center with more particles
        confetti({
          particleCount: 30,
          spread: 360,
          origin: { x: 0.5, y: 0.5 },
          gravity: 0.5,
          colors: ['#FFD700', '#FFC107', '#FFEB3B', '#F57C00'],
          shapes: ['circle', 'square'],
          scalar: 1.2
        });
        
        // Multiple side bursts with varied colors
        confetti({
          particleCount: 15,
          angle: 60,
          spread: 80,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFC107', '#3F51B5', '#2196F3'],
          ticks: 300
        });
        
        confetti({
          particleCount: 15,
          angle: 120,
          spread: 80,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFC107', '#3F51B5', '#2196F3'],
          ticks: 300
        });

        // Add some slower falling star-shaped confetti
        if (Date.now() % 300 < 150) {
          confetti({
            particleCount: 5,
            shapes: ['star'],
            scalar: 1.8,
            ticks: 300,
            gravity: 0.2,
            drift: Math.random() * 2 - 1,
            origin: { x: Math.random(), y: 0.1 },
            colors: ['#FFD700', '#f06292'],
          });
        }

        // Add occasional firework-like bursts
        if (Date.now() % 1200 < 50) {
          const x = Math.random();
          const y = Math.random() * 0.5;
          setTimeout(() => {
            confetti({
              particleCount: 80,
              startVelocity: 30,
              spread: 360,
              origin: { x, y },
              colors: ['#FFD700', '#FF9800', '#F44336', '#2196F3', '#9C27B0'],
              gravity: 0.8,
              scalar: 0.9,
              ticks: 300
            });
          }, Math.random() * 500);
        }

        if (Date.now() < endConfetti) {
          confettiIntervalId = setTimeout(confettiTick, 100);
        } else {
          if (confettiIntervalId) clearTimeout(confettiIntervalId);
          if (lionEmojiIntervalId) clearInterval(lionEmojiIntervalId);
        }
      };
      confettiTick(); // Start the confetti

      // Transition to next step after progress animation finishes
      timeoutId = setTimeout(() => {
        setAnimationStep('phase2Done');
      }, duration + 100); // Wait for progress animation + buffer

    } else if (animationStep === 'phase2Done') {
      // Enhanced "Phase 2 Completed" screen with floating particles
      const createParticles = () => {
        const particles = document.createElement('div');
        particles.classList.add('absolute', 'inset-0', 'overflow-hidden', 'pointer-events-none');
        particles.style.zIndex = '30';
        document.body.appendChild(particles);
        
        const particleElements: HTMLElement[] = [];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          const size = Math.random() * 10 + 5;
          
          particle.style.position = 'absolute';
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          particle.style.background = `radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%)`;
          particle.style.borderRadius = '50%';
          particle.style.pointerEvents = 'none';
          
          // Random positions
          particle.style.left = `${Math.random() * 100}%`;
          particle.style.top = `${Math.random() * 100}%`;
          
          // Random floating animation
          particle.style.animation = `float ${Math.random() * 3 + 3}s ease-in-out infinite`;
          particle.style.animationDelay = `${Math.random() * 3}s`;
          
          particles.appendChild(particle);
          particleElements.push(particle);
        }
        
        // Add keyframes for floating animation if not already defined
        if (!document.querySelector('#particle-keyframes')) {
          const style = document.createElement('style');
          style.id = 'particle-keyframes';
          style.innerHTML = `
            @keyframes float {
              0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
              25% { opacity: 0.8; }
              75% { opacity: 0.8; }
              100% { transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) rotate(${Math.random() * 360}deg); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }
        
        // Continue lion emoji confetti but at a slower rate
        lionEmojiIntervalId = setInterval(() => {
          createLionEmoji();
        }, 700);
        
        return () => {
          particleElements.forEach(el => el.remove());
          particles.remove();
          if (lionEmojiIntervalId) clearInterval(lionEmojiIntervalId);
          lionEmojis.forEach(lion => lion.remove());
          lionEmojis = [];
        };
      };
      
      // Start particle effect
      const cleanup = createParticles();
      
      // Hold the "Phase 2 Completed" message with visual enhancements
      timeoutId = setTimeout(() => {
        cleanup(); // Clean up particle effects
        setAnimationStep('startingPhase3');
      }, 3500); // Hold for 3.5 seconds for better effect

    } else if (animationStep === 'startingPhase3') {
      // Play phase 3 start sound
      playSound('start');

      // Calculate new progress target
      const targetProgress = (totalRoars / PHASE_3_GOAL) * 100;
      setDisplayGoal(PHASE_3_GOAL);

      // Add shake effect to the entire page for 3 seconds
      document.body.classList.add('shake-animation');
      setTimeout(() => {
        document.body.classList.remove('shake-animation');
      }, 3000);

      // Create a more dramatic reveal animation
      // First flash the screen then reveal the new goal with a progressive animation
      document.body.classList.add('flash-animation');
      setTimeout(() => document.body.classList.remove('flash-animation'), 500);

      // Add highlighting effect to the card after shaking
      const card = document.querySelector('.card') as HTMLElement;
      if (card) {
        setTimeout(() => {
          card.classList.add('phase3-highlight');
          // Remove the highlight after 6 seconds
          setTimeout(() => {
            card.classList.remove('phase3-highlight');
          }, 6000);
        }, 3000); // Apply after shaking completes
      }

      // Continue with lion emoji confetti
      lionEmojiIntervalId = setInterval(() => {
        for (let i = 0; i < 2; i++) {
          createLionEmoji();
        }
      }, 500);

      // Animate progress bar with a much more dramatic sequence
      progressAnimationControls.start(
        { 
          width: [
            "100%", // Start fully filled
            "120%", // Overflow dramatically (visual effect)
            "105%", // Pulse back slightly
            "115%", // Pulse forward again
            `${targetProgress}%` // Final position
          ],
          opacity: [1, 1, 1, 1, 1],
          scale: [1, 1.08, 1.05, 1.03, 1],
          backgroundColor: ["#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6", undefined], // Color transition
        }, 
        { 
          duration: 2.8, 
          ease: "easeInOut",
          times: [0, 0.2, 0.4, 0.6, 1] // Keyframe timing distribution
        }
      ).then(() => {
          // Animation complete, move to final state
        localStorage.setItem('hasSeenPhase3Transition', 'true');
        setHasSeenPhase3Transition(true);
        setAnimationStep('phase3Active');
          // Manually set displayProgress state after animation
          setDisplayProgress(targetProgress);
        });

      // Create dynamic particles that follow cursor during the transition
      const createDynamicParticles = () => {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        
        // Track mouse position
        const trackMouse = (e: MouseEvent) => {
          mouseX = e.clientX;
          mouseY = e.clientY;
        };
        
        document.addEventListener('mousemove', trackMouse);
        
        // Create particles that follow the cursor
        const emitParticles = () => {
          if (animationStep !== 'startingPhase3') return;
          
          const particle = document.createElement('div');
          const size = Math.random() * 15 + 5;
          const lifespan = Math.random() * 1000 + 800;
          
          particle.style.position = 'fixed';
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          particle.style.left = `${mouseX}px`;
          particle.style.top = `${mouseY}px`;
          particle.style.pointerEvents = 'none';
          particle.style.zIndex = '9999';
          particle.style.borderRadius = '50%';
          
          // Random colors from a sparkly palette
          const colors = [
            'rgba(255, 215, 0, 0.8)', // Gold
            'rgba(176, 196, 222, 0.8)', // Light blue
            'rgba(147, 112, 219, 0.8)', // Purple
            'rgba(255, 182, 193, 0.8)', // Pink
            'rgba(135, 206, 250, 0.8)', // Sky blue
          ];
          
          particle.style.background = colors[Math.floor(Math.random() * colors.length)];
          
          // Add to body
          document.body.appendChild(particle);
          
          // Animate particle
          const angle = Math.random() * Math.PI * 2;
          const velocity = Math.random() * 3 + 1;
          const startTime = Date.now();
          
          const animateParticle = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > lifespan) {
              particle.remove();
              return;
            }
            
            const progress = elapsed / lifespan;
            const translateX = Math.cos(angle) * velocity * elapsed * 0.1;
            const translateY = Math.sin(angle) * velocity * elapsed * 0.1 - (progress * progress * 100); // Parabolic arc
            
            particle.style.transform = `translate(${translateX}px, ${translateY}px)`;
            particle.style.opacity = `${1 - progress}`;
            
            requestAnimationFrame(animateParticle);
          };
          
          requestAnimationFrame(animateParticle);
        };
        
        // Emit particles on interval
        particleIntervalId = setInterval(emitParticles, 50);
        
        return () => {
          document.removeEventListener('mousemove', trackMouse);
          if (particleIntervalId) clearInterval(particleIntervalId);
          // Clean up any remaining particles
          document.querySelectorAll('.particle').forEach(el => el.remove());
          if (lionEmojiIntervalId) clearInterval(lionEmojiIntervalId);
          lionEmojis.forEach(lion => lion.remove());
          lionEmojis = [];
        };
      };
      
      // Start dynamic particles
      const cleanup = createDynamicParticles();

      // Hold "Starting Phase 3" text for slightly longer than progress animation
      timeoutId = setTimeout(() => {
        // Clean up particle effects
        cleanup(); 
        
        // If animation didn't complete, force state update (fallback)
        if (animationStep === 'startingPhase3') {
           localStorage.setItem('hasSeenPhase3Transition', 'true');
           setHasSeenPhase3Transition(true);
           setAnimationStep('phase3Active');
           setDisplayProgress(targetProgress);
        }
      }, 3500); // Extended hold time for 3.5s
    } 

    return () => { 
      if (timeoutId) clearTimeout(timeoutId); 
      if (confettiIntervalId) clearTimeout(confettiIntervalId); 
      if (particleIntervalId) clearInterval(particleIntervalId);
      if (lionEmojiIntervalId) clearInterval(lionEmojiIntervalId);
      lionEmojis.forEach(lion => lion.remove());
    };
  }, [animationStep, totalRoars, progressAnimationControls]);
  
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
            <AnimatePresence mode="wait">
              {animationStep === 'completingPhase2' || animationStep === 'phase2Done' ? (
                <motion.div
                  key="phase2-complete"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center z-10 p-4 text-center"
                >
                  {/* Enhanced Phase 2 Complete Visuals */}
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                  >
                    <Award className="h-16 w-16 text-white mb-3 drop-shadow-lg" />
                  </motion.div>
                  <motion.h3 
                    className="text-3xl font-bold text-white drop-shadow-md"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Phase 2 Completed!
                  </motion.h3>
                  <motion.p
                    className="text-white/80 mt-2"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    We've reached 100 million ROAR!
                  </motion.p>

                  {/* Add animated stars for celebration */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`star-${i}`}
                      className="absolute text-white text-xl"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        x: `${Math.random() * 160 - 80}%`, // Random horizontal position
                        y: `${Math.random() * 160 - 80}%`, // Random vertical position
                        rotate: [0, 180]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5 + Math.random() * 1,
                        delay: 0.5 + Math.random() * 1,
                      }}
                    >⭐</motion.div>
                  ))}
                </motion.div>
              ) : animationStep === 'startingPhase3' ? (
                <motion.div
                  key="phase3-starting"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center z-10 p-4 text-center"
                >
                  {/* Enhanced Phase 3 Starting Visuals */}
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ 
                      scale: [0.5, 1.1, 1],
                      opacity: 1,
                      y: 0
                    }}
                    transition={{ 
                      duration: 0.8,
                      times: [0, 0.7, 1],
                      ease: "easeOut"
                    }}
                    className="relative"
                  >
                    {/* Pulsing halo behind the icon */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white/30"
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0.2, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                    
                    {/* Enhanced rocket with lion emoji */}
                    <div className="relative">
                      <Rocket className="h-20 w-20 text-white mb-3 drop-shadow-lg" />
                      <motion.div 
                        className="absolute top-0 right-0 text-4xl"
                        animate={{
                          rotate: [0, 15, -15, 0],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        🦁
                  </motion.div>
                    </div>
                  </motion.div>
                  
                  <motion.h3 
                    className="text-5xl font-bold text-white drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    Phase 3 Begins!
                  </motion.h3>
                  
                  <motion.p
                    className="text-xl text-white/90 mt-2 font-medium"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    10 Billion ROAR Goal Unlocked!
                  </motion.p>
                  
                  {/* Lion emoji ring */}
                  <motion.div
                    className="absolute w-full h-full pointer-events-none"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`lion-ring-${i}`}
                        className="absolute text-4xl"
                        style={{ 
                          left: '50%', 
                          top: '50%', 
                          transform: `rotate(${i * 45}deg) translateY(-120px) rotate(-${i * 45}deg)` 
                        }}
                        animate={{ 
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.25,
                        }}
                      >
                        🦁
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  {/* Particle effects in the background */}
                  <motion.div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={`particle-${i}`}
                        className="absolute w-2 h-2 rounded-full bg-white/60"
                        initial={{ 
                          x: `${Math.random() * 100}%`,
                          y: `${Math.random() * 100}%`,
                          scale: 0,
                          opacity: 0
                        }}
                        animate={{ 
                          x: `${Math.random() * 100}%`,
                          y: `${Math.random() * 100}%`,
                          scale: [0, Math.random() * 0.5 + 0.5, 0],
                          opacity: [0, 0.7, 0]
                        }}
                        transition={{
                          duration: 2 + Math.random() * 3,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                  />
                    ))}
                </motion.div>
                  
                  {/* Energy waves emanating from center */}
                  {[...Array(3)].map((_, i) => (
                <motion.div
                      key={`wave-${i}`}
                      className="absolute inset-0 border-2 border-white/10 rounded-lg"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ 
                        scale: [0.6, 1.2],
                        opacity: [0.8, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.7,
                      }}
                    />
                  ))}
                </motion.div>
              ) : showPhase3Blink ? (
                <motion.div
                  key="phase3-active-blink"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, times: [0, 0.5, 1], repeat: 2, repeatType: "loop" }}
                  className="absolute top-2 right-2 z-10"
                >
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-md animate-pulse">
                    Phase 3 Farming Active!
                  </Badge>
                </motion.div>
              ) : null}
            </AnimatePresence>
            
            <motion.div
              initial={false}
              animate={{ filter: animationStep !== 'idle' && animationStep !== 'phase3Active' ? 'blur(4px)' : 'blur(0px)' }}
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