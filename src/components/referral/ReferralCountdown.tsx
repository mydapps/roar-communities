import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Gift, Star, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReferralCountdownProps {
  expiresAt: string;
  durationHours: number;
  abTestGroup: string;
  onExpired: () => void;
  onTradeNow?: () => void;
  className?: string;
}

export const ReferralCountdown: React.FC<ReferralCountdownProps> = ({
  expiresAt,
  durationHours,
  abTestGroup,
  onExpired,
  onTradeNow,
  className
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onExpired();
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt, onExpired, isExpired]);

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  const getUrgencyLevel = () => {
    const totalMs = durationHours * 60 * 60 * 1000;
    const remainingPercent = (timeRemaining / totalMs) * 100;
    
    if (remainingPercent > 50) return 'normal';
    if (remainingPercent > 25) return 'warning';
    return 'urgent';
  };

  const urgencyLevel = getUrgencyLevel();

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("w-full", className)}
      >
        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Timer className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                  Time's Up!
                </h3>
                <p className="text-red-600 dark:text-red-300 mb-4">
                  The countdown has expired, but you can still start trading to unlock future rewards!
                </p>
                {onTradeNow && (
                  <Button onClick={onTradeNow} variant="destructive">
                    Start Trading Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", className)}
    >
      <Card className={cn(
        "border-2 transition-all duration-300",
        urgencyLevel === 'urgent' && "border-red-300 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20",
        urgencyLevel === 'warning' && "border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20",
        urgencyLevel === 'normal' && "border-primary/30 bg-gradient-to-br from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: urgencyLevel === 'urgent' ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  duration: urgencyLevel === 'urgent' ? 0.5 : 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Gift className={cn(
                  "w-8 h-8",
                  urgencyLevel === 'urgent' && "text-red-500",
                  urgencyLevel === 'warning' && "text-yellow-500",
                  urgencyLevel === 'normal' && "text-primary"
                )} />
              </motion.div>
              <Badge variant="secondary" className="text-xs">
                {abTestGroup === 'group_a' ? '1 Hour' : '24 Hour'} Challenge
              </Badge>
            </div>

            <div>
              <h3 className={cn(
                "text-xl font-bold mb-2",
                urgencyLevel === 'urgent' && "text-red-700 dark:text-red-400",
                urgencyLevel === 'warning' && "text-yellow-700 dark:text-yellow-400",
                urgencyLevel === 'normal' && "text-primary"
              )}>
                {urgencyLevel === 'urgent' && "⚡ URGENT: "}
                {urgencyLevel === 'warning' && "⚠️ HURRY: "}
                Complete Your First Trade!
              </h3>
              <p className="text-muted-foreground mb-4">
                {urgencyLevel === 'urgent' 
                  ? "Last chance to unlock your reward box!"
                  : urgencyLevel === 'warning'
                  ? "Time is running out to claim your rewards!"
                  : "Make your first trade to unlock exclusive community token rewards!"
                }
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${hours}-${minutes}-${seconds}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-lg font-mono text-lg font-bold",
                    urgencyLevel === 'urgent' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                    urgencyLevel === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                    urgencyLevel === 'normal' && "bg-primary/10 text-primary"
                  )}>
                    {formatTime(hours)}
                  </div>
                  <span className="text-muted-foreground font-mono">:</span>
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-lg font-mono text-lg font-bold",
                    urgencyLevel === 'urgent' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                    urgencyLevel === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                    urgencyLevel === 'normal' && "bg-primary/10 text-primary"
                  )}>
                    {formatTime(minutes)}
                  </div>
                  <span className="text-muted-foreground font-mono">:</span>
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-lg font-mono text-lg font-bold",
                    urgencyLevel === 'urgent' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                    urgencyLevel === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                    urgencyLevel === 'normal' && "bg-primary/10 text-primary"
                  )}>
                    {formatTime(seconds)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="text-xs text-muted-foreground mb-4">
              Hours : Minutes : Seconds
            </div>

            {/* Reward Preview */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">
                Reward Box Contains: Community Tokens Worth $50-200
              </span>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>

            {/* Action Button */}
            {onTradeNow && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <Button 
                  onClick={onTradeNow}
                  size="lg"
                  className={cn(
                    "w-full font-semibold",
                    urgencyLevel === 'urgent' && "bg-red-600 hover:bg-red-700 text-white",
                    urgencyLevel === 'warning' && "bg-yellow-600 hover:bg-yellow-700 text-white",
                    urgencyLevel === 'normal' && "bg-primary hover:bg-primary/90"
                  )}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {urgencyLevel === 'urgent' 
                    ? "Trade Now - Last Chance!"
                    : "Start Trading to Claim Rewards"
                  }
                </Button>
              </motion.div>
            )}

            {/* Progress indicator */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Time Remaining</span>
                <span>{Math.round((timeRemaining / (durationHours * 60 * 60 * 1000)) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full transition-all duration-1000",
                    urgencyLevel === 'urgent' && "bg-red-500",
                    urgencyLevel === 'warning' && "bg-yellow-500",
                    urgencyLevel === 'normal' && "bg-primary"
                  )}
                  initial={{ width: "100%" }}
                  animate={{ 
                    width: `${(timeRemaining / (durationHours * 60 * 60 * 1000)) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
