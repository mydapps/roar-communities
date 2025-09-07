import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  timeLeft: number; // milliseconds
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ timeLeft: initialTimeLeft }) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  useEffect(() => {
    setTimeLeft(initialTimeLeft);
  }, [initialTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (ms: number) => {
    // Handle invalid or negative values
    if (!ms || ms <= 0 || isNaN(ms)) return '00:00';
    
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    // Ensure values are valid numbers
    const safeHours = isNaN(hours) ? 0 : hours;
    const safeMinutes = isNaN(minutes) ? 0 : minutes;
    const safeSeconds = isNaN(seconds) ? 0 : seconds;
    
    if (safeHours > 0) {
      return `${safeHours.toString().padStart(2, '0')}:${safeMinutes.toString().padStart(2, '0')}:${safeSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${safeMinutes.toString().padStart(2, '0')}:${safeSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <span className={`font-mono font-bold ${timeLeft < 300000 ? 'text-red-600 animate-pulse' : ''}`}>
      {formatTime(timeLeft)}
    </span>
  );
};

export default CountdownTimer;

