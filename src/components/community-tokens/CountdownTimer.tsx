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
    if (ms <= 0) return '00:00:00';
    
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <span className={`font-mono font-bold ${timeLeft < 300000 ? 'text-red-600 animate-pulse' : ''}`}>
      {formatTime(timeLeft)}
    </span>
  );
};

export default CountdownTimer;

