
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toggleRoar } from '@/utils/api';
import { toast } from 'sonner';

interface RoarButtonProps {
  count: number;
  active: boolean;
  onClick: () => void;
  postCode?: string;
}

export const RoarButton = ({ count, active, onClick, postCode }: RoarButtonProps) => {
  const [localActive, setLocalActive] = useState(active);
  const [localCount, setLocalCount] = useState(count);
  const [roarAnimation, setRoarAnimation] = useState(false);
  const [roarWavesAnimation, setRoarWavesAnimation] = useState(false);
  const [roarTextAnimation, setRoarTextAnimation] = useState(false);

  useEffect(() => {
    setLocalActive(active);
    setLocalCount(count);
  }, [active, count]);

  const handleClick = async () => {
    // Call the parent component's onClick handler
    onClick();
    
    // Immediately update UI state
    const newRoarState = !localActive;
    setLocalActive(newRoarState);
    setLocalCount(prev => newRoarState ? prev + 1 : prev - 1);
    
    // Only animate when adding a roar, not removing it
    if (newRoarState) {
      setRoarWavesAnimation(true);
      setTimeout(() => setRoarAnimation(true), 50);
      setTimeout(() => setRoarTextAnimation(true), 100);
      
      setTimeout(() => setRoarWavesAnimation(false), 1500);
      setTimeout(() => setRoarAnimation(false), 1800);
      setTimeout(() => setRoarTextAnimation(false), 2000);
    }

    // Send API request if postCode is available
    if (postCode) {
      try {
        const success = await toggleRoar(postCode);
        if (!success) {
          // If API call fails, revert the local state
          setLocalActive(!newRoarState);
          setLocalCount(prev => !newRoarState ? prev + 1 : prev - 1);
          toast.error("Failed to update roar status. Please try again.");
        }
      } catch (error) {
        console.error("Error toggling roar:", error);
        // Revert local state on error
        setLocalActive(!newRoarState);
        setLocalCount(prev => !newRoarState ? prev + 1 : prev - 1);
        toast.error("Error updating roar status. Please try again.");
      }
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleClick}
      className={`gap-2 hover:text-primary hover:bg-primary/10 ${localActive ? 'text-primary' : ''}`}
    >
      <div className="relative">
        <span className={`text-xl transition-transform ${roarAnimation ? 'scale-150' : ''}`} role="img" aria-label="lion">🦁</span>
        {roarWavesAnimation && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-ping absolute h-6 w-6 rounded-full bg-primary/30"></div>
            <div className="animate-ping delay-75 absolute h-8 w-8 rounded-full bg-primary/20"></div>
          </div>
        )}
      </div>
      <span className={`transition-transform ${roarTextAnimation ? 'scale-110 text-primary font-medium' : ''}`}>
        {localCount}
      </span>
    </Button>
  );
};
