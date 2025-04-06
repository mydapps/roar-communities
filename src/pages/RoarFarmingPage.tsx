import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, Sparkles, Award, Clock, AlertTriangle } from 'lucide-react';
import { createAuthHeaders } from '@/utils/apiBase';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Constants
const TOTAL_ROARS_GOAL = 10_000_000; // 10 million roars goal (updated from 1 billion)
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

const RoarFarmingPage = () => {
  const [totalRoars, setTotalRoars] = useState<number>(0);
  const [totalRoarsLoading, setTotalRoarsLoading] = useState<boolean>(true);
  const [isFarming, setIsFarming] = useState<boolean>(false);
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const [farmingStatus, setFarmingStatus] = useState<FarmingStatus | null>(null);
  const [earnedRoars, setEarnedRoars] = useState<number>(0);
  const [booster, setBooster] = useState<number>(1);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [farmingProgress, setFarmingProgress] = useState<number>(0);
  
  // Animation states
  const [lionScale, setLionScale] = useState<number>(1);
  const [lionRotate, setLionRotate] = useState<number>(0);
  const [progressPulse, setProgressPulse] = useState<boolean>(false);
  
  // Animation intervals
  const farmingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load total roars and farming status on mount
  useEffect(() => {
    fetchTotalRoars();
    checkFarmingStatus();
    
    // Setup polling for farming status
    const statusInterval = setInterval(() => {
      checkFarmingStatus();
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(statusInterval);
      if (farmingIntervalRef.current) {
        clearInterval(farmingIntervalRef.current);
      }
      if (timeRemainingIntervalRef.current) {
        clearInterval(timeRemainingIntervalRef.current);
      }
    };
  }, []);
  
  // Fetch total roars from API
  const fetchTotalRoars = async () => {
    try {
      setTotalRoarsLoading(true);
      const response = await fetch('https://api.dapps.co/roar_total');
      const data = await response.json();
      
      if (data.success) {
        setTotalRoars(data.total_roars);
      }
    } catch (error) {
      console.error('Error fetching total roars:', error);
      toast.error('Failed to load total roars data');
    } finally {
      setTotalRoarsLoading(false);
    }
  };
  
  // Check if user is currently farming
  const checkFarmingStatus = async () => {
    try {
      const userKey = localStorage.getItem('dapps_user_key');
      if (!userKey) return;
      
      const response = await fetch('https://api.dapps.co/roar_farming_status', {
        method: 'GET',
        headers: createAuthHeaders()
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setFarmingStatus(data);
        
        if (data.farming) {
          // User is farming
          setIsFarming(true);
          setCanClaim(data.can_claim);
          setBooster(data.booster || 1);
          setTimeRemaining(data.time_remaining_formatted || '');
          
          // Calculate progress percentage (elapsed time / total farming time)
          const totalFarmingTime = data.elapsed_time + data.time_remaining;
          const progressPercentage = (data.elapsed_time / totalFarmingTime) * 100;
          setFarmingProgress(progressPercentage);
          
          // Calculate earned roars
          const earnedAmount = (data.elapsed_time / 3600) * 3600 * DEFAULT_FARMING_RATE * data.booster;
          setEarnedRoars(earnedAmount);
          
          // Start animation and time tracking
          startFarmingAnimation();
          startTimeTracker(data.time_remaining);
        } else {
          // Not farming
          setIsFarming(false);
          setCanClaim(false);
          setEarnedRoars(0);
          setFarmingProgress(0);
          stopFarmingAnimation();
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
    }
    
    let secondsRemaining = remainingSeconds;
    
    const updateRemainingTime = () => {
      if (secondsRemaining <= 0) {
        // Time's up - can claim now
        setCanClaim(true);
        setTimeRemaining('0h 0m 0s');
        
        if (timeRemainingIntervalRef.current) {
          clearInterval(timeRemainingIntervalRef.current);
          timeRemainingIntervalRef.current = null;
        }
        
        // Check status from server
        checkFarmingStatus();
        return;
      }
      
      // Decrement time and format
      secondsRemaining -= 1;
      const hours = Math.floor(secondsRemaining / 3600);
      const minutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;
      
      const formatted = `${hours}h ${minutes}m ${seconds}s`;
      setTimeRemaining(formatted);
      
      // Update progress percentage
      const totalFarmingTime = 6 * 60 * 60; // 6 hours in seconds
      const elapsedTime = totalFarmingTime - secondsRemaining;
      const progressPercentage = (elapsedTime / totalFarmingTime) * 100;
      setFarmingProgress(progressPercentage);
      
      // Update earned roars
      const earnedAmount = (elapsedTime / 3600) * 3600 * DEFAULT_FARMING_RATE * booster;
      setEarnedRoars(earnedAmount);
    };
    
    // Update immediately
    updateRemainingTime();
    
    // Update every second
    timeRemainingIntervalRef.current = setInterval(updateRemainingTime, 1000);
  };
  
  // Start farming animation
  const startFarmingAnimation = () => {
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
    
    farmingIntervalRef.current = lionInterval;
    
    return () => {
      clearInterval(lionInterval);
      clearInterval(progressInterval);
    };
  };
  
  // Stop farming animation
  const stopFarmingAnimation = () => {
    if (farmingIntervalRef.current) {
      clearInterval(farmingIntervalRef.current);
      farmingIntervalRef.current = null;
    }
    
    setLionScale(1);
    setLionRotate(0);
    setProgressPulse(false);
  };
  
  // Start farming
  const startFarming = async () => {
    try {
      setIsStarting(true);
      
      const response = await fetch('https://api.dapps.co/roar_farming_start', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.farming) {
        setIsFarming(true);
        setCanClaim(data.can_claim);
        setBooster(data.booster || 1);
        setTimeRemaining(data.time_remaining_formatted || '');
        
        toast.success('Roar farming started successfully!');
        
        // Start animation and time tracking
        startFarmingAnimation();
        startTimeTracker(data.time_remaining);
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
      
      const response = await fetch('https://api.dapps.co/roar_farming_claim', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully claimed ${data.amount.toFixed(2)} Roars! 🦁`);
        setIsFarming(false);
        setCanClaim(false);
        setEarnedRoars(0);
        setFarmingProgress(0);
        stopFarmingAnimation();
        
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
  
  const formatLargeNumber = (num: number): string => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };
  
  const getProgressGradient = () => {
    if (totalRoars / TOTAL_ROARS_GOAL > 0.8) {
      return "bg-gradient-to-r from-amber-500 via-red-500 to-amber-500";
    } else if (totalRoars / TOTAL_ROARS_GOAL > 0.5) {
      return "bg-gradient-to-r from-amber-400 to-amber-500";
    } else {
      return "bg-amber-400";
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Roar Farming | dapps.co</title>
      </Helmet>
      
      <div className="flex flex-col gap-6 max-w-3xl mx-auto pt-14 pb-20">
        {/* Global progress card */}
        <Card className="border-amber-200/20 overflow-hidden">
          <CardContent className="p-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium">Global Roar Progress</h2>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {totalRoarsLoading ? (
                      <Loader2 className="h-5 w-5 inline animate-spin" />
                    ) : (
                      `${formatLargeNumber(totalRoars)}`
                    )}
                    <span className="text-muted-foreground text-sm font-normal"> / {formatLargeNumber(TOTAL_ROARS_GOAL)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalRoarsLoading ? "" : `${((totalRoars / TOTAL_ROARS_GOAL) * 100).toFixed(2)}% claimed`}
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <Progress 
                  value={(totalRoars / TOTAL_ROARS_GOAL) * 100}
                  className="h-3 rounded-full bg-muted/50"
                  indicatorClassName={getProgressGradient()}
                />
                
                {/* Animated warning labels */}
                {totalRoars / TOTAL_ROARS_GOAL > 0.7 && (
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 mt-1">
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded text-xs font-medium border border-amber-200"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>Running out fast!</span>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main farming card */}
        <Card className="border-amber-200/20 overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="flex justify-between items-center">
              <span>Roar Farming</span>
              {isFarming && (
                <span className="text-sm font-normal bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  {(DEFAULT_FARMING_RATE * booster).toFixed(2)} 🦁/s
                </span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6 pb-8">
            <div className="flex flex-col items-center">
              {/* Farming animation */}
              <div className="relative w-48 h-48 mb-8">
                {/* Outer ring background */}
                <div className="absolute inset-0 rounded-full bg-amber-100/10"></div>
                
                {/* Outer ring - filling progress in clockwise direction */}
                {isFarming && (
                  <div className="absolute inset-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="47"
                        fill="none"
                        stroke="url(#outerGradient)"
                        strokeWidth="6"
                        strokeDasharray="295.3"
                        strokeDashoffset={295.3 - (295.3 * farmingProgress) / 100}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-300"
                      />
                      <defs>
                        <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
                
                {/* Gap between rings */}
                <div className="absolute inset-[8px] rounded-full bg-background"></div>
                
                {/* Inner ring background */}
                <div className="absolute inset-[16px] rounded-full bg-amber-100/10"></div>
                
                {/* Inner ring - filling progress in clockwise direction */}
                {isFarming && (
                  <div className="absolute inset-[16px]">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="url(#innerGradient)"
                        strokeWidth="5"
                        strokeDasharray="263.9"
                        strokeDashoffset={263.9 - (263.9 * farmingProgress) / 100}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-300"
                      />
                      <defs>
                        <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
                
                {/* Center area for the lion */}
                <div className="absolute inset-[32px] rounded-full bg-background"></div>
                
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
              
              {/* Earned amount */}
              {isFarming && (
                <div className="text-center mb-6">
                  <div className="text-sm text-muted-foreground mb-1">Earned so far</div>
                  <div className="text-3xl font-bold text-amber-600">{earnedRoars.toFixed(2)}</div>
                </div>
              )}
              
              {/* Action buttons - Ensure they're visible with proper z-index */}
              <div className="w-full flex flex-col items-center gap-3 mt-2 relative z-10">
                {canClaim ? (
                  <Button
                    size="lg"
                    className="w-full max-w-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg"
                    onClick={claimRoars}
                    disabled={isClaiming}
                  >
                    {isClaiming ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Award className="h-5 w-5 mr-2" />
                    )}
                    Claim {earnedRoars.toFixed(2)} Roars
                  </Button>
                ) : isFarming ? (
                  <Button
                    size="lg"
                    className="w-full max-w-xs bg-amber-200/80 hover:bg-amber-200/80 text-amber-800 cursor-not-allowed"
                    disabled
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Claim in {timeRemaining}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full max-w-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg"
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
                )}
                
                {/* Boost link */}
                <Link 
                  to="/referral" 
                  className="text-sm text-amber-600 hover:text-amber-700 hover:underline flex items-center"
                >
                  Boost your roars
                  <ArrowRight className="h-3 w-3 ml-1" />
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