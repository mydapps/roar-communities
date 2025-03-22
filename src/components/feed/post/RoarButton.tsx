
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
    
    // Only animate when adding a roar, not removing it
    if (!localActive) {
      setRoarWavesAnimation(true);
      setTimeout(() => setRoarAnimation(true), 50);
      setTimeout(() => setRoarTextAnimation(true), 100);
      
      setTimeout(() => setRoarWavesAnimation(false), 1500);
      setTimeout(() => setRoarAnimation(false), 1800);
      setTimeout(() => setRoarTextAnimation(false), 2000);
    }
    
    // If postCode is provided, perform the API call
    if (postCode) {
      try {
        const userKey = localStorage.getItem('dapps_user_key');
        
        if (!userKey) {
          console.error('No user key found for roaring a post');
          return;
        }
        
        const response = await fetch('https://api.dapps.co/roar_post', {
          method: 'POST',
          headers: {
            'x-user-key': userKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ postCode })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to roar post: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Roar response:', data);
      } catch (error) {
        console.error('Error roaring post:', error);
        // No need to revert the UI state since the parent component handles it
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
