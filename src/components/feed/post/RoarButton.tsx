import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toggleRoar } from '@/utils/api';
import { toast } from 'sonner';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';

interface RoarButtonProps {
  count: number;
  active: boolean;
  onClick: () => void;
  postCode?: string;
  isLoggedIn?: boolean;
}

export const RoarButton = ({ count, active, onClick, postCode, isLoggedIn }: RoarButtonProps) => {
  const [localActive, setLocalActive] = useState(active);
  const [localCount, setLocalCount] = useState(count);
  const [roarAnimation, setRoarAnimation] = useState(false);
  const [roarWavesAnimation, setRoarWavesAnimation] = useState(false);
  const [roarTextAnimation, setRoarTextAnimation] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");

  useEffect(() => {
    setLocalActive(active);
    setLocalCount(count);
  }, [active, count]);

  const handleClick = async () => {
    // Prevent double-clicks and API race conditions
    if (processing) {
      return;
    }
    
    // Set processing flag to prevent multiple clicks
    setProcessing(true);
    
    // Call the parent component's onClick handler
    onClick();
    
    // If user is not logged in, exit early (the parent will handle showing the login toast)
    if (isLoggedIn === false) {
      setProcessing(false);
      return;
    }
    
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
        const result = await toggleRoar(postCode);
        
        // Check if the result is an error object indicating the user is not part of the community
        if (result && typeof result === 'object' && 'errCode' in result && result.errCode === "004") {
          // Reset the local state that was optimistically updated
          setLocalActive(!newRoarState);
          setLocalCount(prev => !newRoarState ? prev + 1 : prev - 1);
          
          // Show the not in community modal
          setCommunityName(result.community);
          setNotInCommunitySheetOpen(true);
        } else if (result !== true) {
          // Handle other API failures
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
      } finally {
        // Reset processing flag after a short delay
        setTimeout(() => setProcessing(false), 300);
      }
    } else {
      // Reset processing flag after a short delay
      setTimeout(() => setProcessing(false), 300);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleClick}
        className={`gap-2 hover:text-primary hover:bg-primary/10 ${localActive ? 'text-primary' : ''}`}
        disabled={processing}
      >
        <div className="relative">
          <span 
            className={`text-xl transition-transform ${roarAnimation ? 'scale-150' : ''} ${
              !localActive ? 'opacity-70' : ''
            }`} 
            role="img" 
            aria-label="lion"
          >
            🦁
          </span>
          {roarWavesAnimation && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-ping absolute h-6 w-6 rounded-full bg-primary/30"></div>
              <div className="animate-ping delay-75 absolute h-8 w-8 rounded-full bg-primary/20"></div>
            </div>
          )}
        </div>
        <span className={`transition-transform ${roarTextAnimation ? 'scale-110 text-primary font-medium' : ''} ${
          localActive ? 'text-primary font-medium' : ''
        }`}>
          {localCount}
        </span>
      </Button>
      
      {/* Modal that shows when user is not part of the community */}
      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </>
  );
};
