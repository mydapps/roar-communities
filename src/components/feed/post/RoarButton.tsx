import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { toggleRoar } from '@/utils/postApi';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';

interface RoarButtonProps {
  count: number;
  active: boolean;
  onClick: () => void;
  postCode?: string;
  isLoggedIn?: boolean;
  handleApiCall?: boolean;
}

export const RoarButton = ({
  count,
  active,
  onClick,
  postCode,
  isLoggedIn,
  handleApiCall = false
}: RoarButtonProps) => {
  const [localActive, setLocalActive] = useState(active);
  const [localCount, setLocalCount] = useState(count);
  const [processing, setProcessing] = useState(false);
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");

  // 🎨 **ELEGANT ROAR ANIMATION STATES** 🎨
  const [roarStage, setRoarStage] = useState<'idle' | 'building' | 'peak' | 'settling'>('idle');
  const [showRipples, setShowRipples] = useState(false);
  const [lionScale, setLionScale] = useState(1);
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    setLocalActive(active);
    setLocalCount(count);
  }, [active, count]);

  // 🎯 **REFINED ROAR ANIMATION SEQUENCE** 🎯
  const triggerElegantRoar = () => {
    // 📱 **Subtle Haptic Feedback**
    if (navigator.vibrate) {
      navigator.vibrate([80, 40, 120]); // Refined, professional haptic
    }

    // 🦁 **Stage 1: Building (Elegant buildup)**
    setRoarStage('building');
    setLionScale(1.15);
    setGlowIntensity(0.3);

    setTimeout(() => {
      // ⚡ **Stage 2: Peak (Controlled power)**
      setRoarStage('peak');
      setLionScale(1.3);
      setShowRipples(true);
      setGlowIntensity(0.6);

      // Refined haptic for peak
      if (navigator.vibrate) {
        navigator.vibrate([150]);
      }
    }, 150);

    setTimeout(() => {
      // 🎨 **Stage 3: Settling (Graceful return)**
      setRoarStage('settling');
      setLionScale(1.1);
      setGlowIntensity(0.2);
    }, 450);

    // 🔄 **Return to elegant idle state**
    setTimeout(() => {
      setRoarStage('idle');
      setLionScale(1);
      setShowRipples(false);
      setGlowIntensity(0);
    }, 750);
  };

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

    // 🎨 **TRIGGER ELEGANT ROAR ANIMATION** 🎨
    if (newRoarState) {
      triggerElegantRoar();
    }

    // Only send API request if handleApiCall is true and postCode is available
    if (handleApiCall && postCode) {
      try {
        const result = await toggleRoar(postCode);

        if (typeof result === 'object' && 'errCode' in result && result.errCode === "004") {
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
        className={`gap-2 hover:text-primary hover:bg-primary/10 px-3 rounded-full transition-all duration-200 ${localActive ? 'text-primary bg-primary/5' : ''
          }`}
        disabled={processing}
      >
        <div className="relative">
          {/* 🦁 **ELEGANT LION WITH REFINED TRANSFORMATIONS** */}
          <span
            className={`text-lg relative z-10 transition-all duration-300 ease-out ${!localActive ? 'opacity-70' : 'opacity-100'
              }`}
            style={{
              transform: `scale(${lionScale}) ${roarStage === 'peak' ? 'rotate(3deg)' : 'rotate(0deg)'}`,
              filter: `brightness(${1 + glowIntensity * 0.3}) saturate(${1 + glowIntensity * 0.2})`,
              textShadow: glowIntensity > 0 ?
                `0 0 ${8 + glowIntensity * 12}px rgba(251, 191, 36, ${glowIntensity * 0.8})` : 'none'
            }}
            role="img"
            aria-label="lion"
          >
            🦁
          </span>

          {/* 🌊 **ELEGANT RIPPLE EFFECTS** */}
          {showRipples && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Subtle, professional ripples */}
              <div
                className="absolute animate-ping rounded-full border-2"
                style={{
                  width: '20px',
                  height: '20px',
                  borderColor: `rgba(251, 191, 36, ${0.4 * glowIntensity})`,
                  animationDuration: '0.8s'
                }}
              />
              <div
                className="absolute animate-ping rounded-full border"
                style={{
                  width: '32px',
                  height: '32px',
                  borderColor: `rgba(251, 191, 36, ${0.25 * glowIntensity})`,
                  animationDuration: '0.8s',
                  animationDelay: '0.1s'
                }}
              />
            </div>
          )}

          {/* ✨ **SUBTLE GLOW BACKGROUND** */}
          {glowIntensity > 0 && (
            <div className="absolute inset-0 -m-1">
              <div
                className="absolute inset-0 rounded-full blur-sm"
                style={{
                  backgroundColor: `rgba(251, 191, 36, ${glowIntensity * 0.15})`,
                  animation: 'pulse 0.6s ease-out'
                }}
              />
            </div>
          )}
        </div>

        {/* 📊 **REFINED ROAR COUNT** */}
        <span className={`transition-all duration-300 ${roarStage === 'peak' ? 'scale-110 font-semibold' : 'scale-100'
          } ${localActive ? 'text-primary font-medium' : ''
          } ${glowIntensity > 0.4 ? 'text-amber-600' : ''
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
