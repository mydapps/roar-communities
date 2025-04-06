import React, { useState, useEffect } from 'react';
import { X, Rocket, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface LaunchTime {
  iso: string;
  readable: string;
  timestamp: number;
}

interface TimeRemaining {
  total_milliseconds: number;
  days: number;
  hours: number;
  minutes: number;
  has_launched: boolean;
}

interface LaunchData {
  success: boolean;
  launch_time: LaunchTime;
  time_remaining: TimeRemaining;
}

const LaunchCountdown: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [launchData, setLaunchData] = useState<LaunchData | null>(null);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // Check if the user has dismissed the banner
    const bannerDismissed = localStorage.getItem('dapps_launch_banner_dismissed');
    if (bannerDismissed) {
      setIsVisible(false);
    }

    // Fetch launch data from the API
    const fetchLaunchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://api.dapps.co/launch_time');
        const data = await response.json();
        setLaunchData(data);
        
        if (data.success) {
          updateCountdown(data.launch_time.timestamp);
        }
      } catch (error) {
        console.error('Error fetching launch data:', error);
        // Fallback: Set a demo countdown for 30 days from now
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 30);
        updateCountdown(fallbackDate.getTime());
      } finally {
        setIsLoading(false);
      }
    };

    fetchLaunchData();

    // Update countdown every second
    const intervalId = setInterval(() => {
      if (launchData?.launch_time?.timestamp) {
        updateCountdown(launchData.launch_time.timestamp);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Update the countdown state based on the time remaining
  const updateCountdown = (launchTimestamp: number) => {
    const now = Date.now();
    const timeRemaining = Math.max(0, launchTimestamp - now);
    
    // Calculate progress as a percentage (inverted, so it increases as we approach launch)
    // Assuming a 30-day countdown period
    const totalCountdownPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const elapsed = totalCountdownPeriod - timeRemaining;
    const progressPercentage = Math.min(100, Math.max(0, (elapsed / totalCountdownPeriod) * 100));
    
    setProgress(progressPercentage);

    if (timeRemaining <= 0) {
      // Launch has happened
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    setCountdown({ days, hours, minutes, seconds });
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('dapps_launch_banner_dismissed', 'true');
    
    // Dispatch custom event to notify other components
    const event = new CustomEvent('dapps_banner_dismissed');
    window.dispatchEvent(event);
  };

  // Don't render if not visible or still loading initially
  if (!isVisible || (isLoading && !launchData)) {
    return null;
  }

  // Don't render if launch has already happened
  if (launchData?.time_remaining?.has_launched) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full bg-gradient-to-r from-primary/80 via-purple-800 to-primary/80 text-white fixed top-0 left-0 right-0 z-[100] border-b border-indigo-500/30 shadow-xl"
      >
        {/* Animated stars */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[2px] w-[2px] bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + Math.random() * 3,
                delay: Math.random() * 5,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto py-2 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-1 px-4 relative">
            {/* Message section */}
            <div className="flex items-center gap-3 md:mb-0 mb-1">
              <div className="flex items-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    y: [0, -3, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut" 
                  }}
                  className="mr-2 relative"
                >
                  <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-md animate-pulse"></div>
                  <Rocket className="h-6 w-6 text-amber-300 relative z-10" />
                </motion.div>
                
                <div>
                  <motion.h3 
                    className="font-bold text-lg text-amber-300 leading-tight"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    Mainnet Launch Countdown
                  </motion.h3>
                  <p className="text-xs text-white/80 font-medium">
                    Join us for a revolutionary decentralized experience
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown units */}
            <div className="flex items-center md:mb-0 relative">
              <motion.div 
                className="grid grid-cols-4 gap-2 md:gap-3 bg-black/20 backdrop-blur-md p-2 md:p-3 rounded-lg border border-white/10"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <CountdownUnit value={countdown.days} label="Days" />
                <CountdownUnit value={countdown.hours} label="Hours" />
                <CountdownUnit value={countdown.minutes} label="Mins" />
                <CountdownUnit value={countdown.seconds} label="Secs" />
                
                {/* Glowing bars between units (desktop only) */}
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-6 w-[1px] bg-gradient-to-b from-transparent via-amber-300/40 to-transparent hidden md:block"></div>
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 h-6 w-[1px] bg-gradient-to-b from-transparent via-amber-300/40 to-transparent hidden md:block"></div>
                <div className="absolute top-1/2 left-3/4 -translate-y-1/2 h-6 w-[1px] bg-gradient-to-b from-transparent via-amber-300/40 to-transparent hidden md:block"></div>
              </motion.div>
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-7 w-7 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white"
                onClick={handleClose}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 relative">
            <Progress 
              value={progress} 
              className="h-1 bg-black/30" 
              indicatorClassName="bg-gradient-to-r from-amber-300/60 via-amber-300 to-amber-300/60 shadow-glow" 
            />
            
            {/* Animated indicator dot */}
            <motion.div 
              className="absolute top-0 h-3 w-3 rounded-full bg-amber-300 shadow-lg shadow-amber-300/50 -translate-y-1"
              style={{ left: `${progress}%` }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut" 
              }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper component for countdown units
const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <motion.div
      key={value}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <span className="font-bold text-xl md:text-2xl text-white">{value.toString().padStart(2, '0')}</span>
      {/* Pulse effect when number changes */}
      <motion.div
        key={`pulse-${value}`}
        initial={{ opacity: 0.7, scale: 1 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-0 bg-amber-300/20 rounded-full z-[-1]"
      />
    </motion.div>
    <span className="text-[10px] md:text-xs text-amber-200/70 uppercase tracking-wider mt-1">{label}</span>
  </div>
);

export default LaunchCountdown; 