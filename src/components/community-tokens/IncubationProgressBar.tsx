import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface IncubationProgressBarProps {
  timeLeft: number; // in milliseconds
  volume24h: number;
  isMobile?: boolean;
}

const IncubationProgressBar: React.FC<IncubationProgressBarProps> = ({
  timeLeft: initialTimeLeft,
  volume24h,
  isMobile = false
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format time left
  const formatTimeLeft = (ms: number): string => {
    if (ms <= 0) return "Graduating now...";
    
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s left`;
    }
    return `${seconds}s left`;
  };

  // Calculate progress percentage (based on time elapsed)
  const totalTime = 30 * 60 * 1000; // 30 minutes in ms
  const timeElapsed = totalTime - timeLeft;
  const progressPercentage = Math.max(0, Math.min(100, (timeElapsed / totalTime) * 100));
  
  // Calculate urgency level based on time left
  const timePercentage = (timeLeft / totalTime) * 100;
  
  // Determine urgency level and colors
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  let bgColor: string;
  let progressColor: string;
  let textColor: string;
  let borderColor: string;
  let urgencyText: string;

  if (timePercentage > 66) {
    urgencyLevel = 'low';
    bgColor = 'bg-green-50 dark:bg-green-950/20';
    progressColor = 'bg-green-600';
    textColor = 'text-green-800 dark:text-green-200';
    borderColor = 'border-green-200 dark:border-green-800';
    urgencyText = 'Plenty of time remaining';
  } else if (timePercentage > 33) {
    urgencyLevel = 'medium';
    bgColor = 'bg-amber-50 dark:bg-amber-950/20';
    progressColor = 'bg-amber-600';
    textColor = 'text-amber-800 dark:text-amber-200';
    borderColor = 'border-amber-200 dark:border-amber-800';
    urgencyText = 'Time running out - act fast!';
  } else if (timePercentage > 10) {
    urgencyLevel = 'high';
    bgColor = 'bg-orange-50 dark:bg-orange-950/20';
    progressColor = 'bg-orange-600';
    textColor = 'text-orange-800 dark:text-orange-200';
    borderColor = 'border-orange-200 dark:border-orange-800';
    urgencyText = 'HURRY! Almost out of time!';
  } else {
    urgencyLevel = 'critical';
    bgColor = 'bg-red-50 dark:bg-red-950/20';
    progressColor = 'bg-red-600 animate-pulse';
    textColor = 'text-red-800 dark:text-red-200';
    borderColor = 'border-red-200 dark:border-red-800';
    urgencyText = '🚨 FINAL MOMENTS!';
  }

  return (
    <div className={`space-y-2 p-4 ${bgColor} rounded-lg border ${borderColor} transition-all duration-500`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${textColor}`}>
          Incubation Progress
        </span>
        <div className={`flex items-center gap-1 ${textColor} ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`}>
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {formatTimeLeft(timeLeft)}
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className={`w-full ${urgencyLevel === 'low' ? 'bg-green-200 dark:bg-green-900' : urgencyLevel === 'medium' ? 'bg-amber-200 dark:bg-amber-900' : urgencyLevel === 'high' ? 'bg-orange-200 dark:bg-orange-900' : 'bg-red-200 dark:bg-red-900'} rounded-full h-3`}>
        <div 
          className={`${progressColor} h-3 rounded-full transition-all duration-500 ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`}
          style={{ 
            width: `${progressPercentage}%` 
          }}
        />
      </div>
      
      {/* Urgency Message */}
      <div className="flex items-center justify-between">
        <p className={`text-xs ${textColor} ${urgencyLevel === 'critical' ? 'animate-pulse font-bold' : ''}`}>
          {urgencyText}
        </p>
      </div>
      
      <p className={`text-xs ${textColor.replace('800', '700').replace('200', '300')}`}>
        Flat rate trading until 1 ETH collected or 30 minutes elapsed
      </p>
    </div>
  );
};

export default IncubationProgressBar;




