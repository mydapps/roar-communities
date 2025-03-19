
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Gift, TrendingUp, MessageCircle, DollarSign, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface Story {
  id: number;
  title: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  image?: string;
}

const OnboardingStories = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [currentStory, setCurrentStory] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(100);
  const navigate = useNavigate();
  const storyContainerRef = useRef<HTMLDivElement>(null);
  
  const stories: Story[] = [
    {
      id: 1,
      title: "Welcome to ROAR",
      content: (
        <div className="space-y-3">
          <p className="text-lg">ROAR is a revolutionary social platform for Web3 communities.</p>
          <p>You can invest in communities, earn rewards, and connect with like-minded people.</p>
          <p className="mt-4 font-medium">Swipe or tap right to learn more →</p>
        </div>
      ),
      icon: <Gift className="h-10 w-10" />,
      color: "text-purple-500",
      gradient: "from-purple-500/20 to-blue-500/20",
      image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 2,
      title: "Invest in Communities",
      content: (
        <div className="space-y-3">
          <p className="text-lg">Each community has its own token curve.</p>
          <p>Buy shares early in promising communities and watch your investment grow as more members join.</p>
          <p className="text-sm mt-4 italic">Communities use bonded curves, making early shares more valuable as the community grows.</p>
        </div>
      ),
      icon: <TrendingUp className="h-10 w-10" />,
      color: "text-green-500",
      gradient: "from-green-500/20 to-teal-500/20",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 3,
      title: "Earn Rewards in ETH",
      content: (
        <div className="space-y-3">
          <p className="text-lg">Post quality content in communities to earn ETH rewards.</p>
          <p>Community members vote on the best content, and creators earn real cryptocurrency rewards.</p>
          <p className="text-sm mt-4 italic">Create a community to earn up to 5% on all trades happening within it.</p>
        </div>
      ),
      icon: <DollarSign className="h-10 w-10" />,
      color: "text-amber-500",
      gradient: "from-amber-500/20 to-orange-500/20",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 4,
      title: "Your First Reward",
      content: (
        <div className="space-y-3 relative">
          <p className="text-lg">Congratulations! You've earned your first shares!</p>
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/20 rounded-lg p-4 mt-4 animate-pulse">
            <div className="flex justify-between items-center">
              <span className="font-medium">DeFi Explorers</span>
              <span className="text-amber-500 font-bold">0.067 shares</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Worth approximately $20</div>
          </div>
          <Button 
            className="w-full mt-8 bg-amber-500 hover:bg-amber-600 text-white" 
            onClick={() => {
              triggerConfetti();
              setTimeout(() => navigate('/feed'), 1500);
            }}
          >
            Start Exploring
          </Button>
        </div>
      ),
      icon: <Award className="h-10 w-10" />,
      color: "text-blue-500",
      gradient: "from-blue-500/20 to-indigo-500/20",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    }
  ];

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleNext = () => {
    if (currentStory < stories.length - 1) {
      setCurrentStory(currentStory + 1);
      setTimeLeft(100);
    }
    // Note: We no longer auto-navigate on the last story
  };

  const handlePrev = () => {
    if (currentStory > 0) {
      setCurrentStory(currentStory - 1);
      setTimeLeft(100);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
  };

  // Handle touch/swipe on mobile
  useEffect(() => {
    let touchStartX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      setIsPaused(true);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (diff > 50) { // Swipe left
        handleNext();
      } else if (diff < -50) { // Swipe right
        handlePrev();
      }
      
      setIsPaused(false);
    };
    
    const container = storyContainerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentStory]);

  // Progress timer - stop auto-progression on last story
  useEffect(() => {
    if (!open || isPaused || currentStory === stories.length - 1) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleNext();
          return 100;
        }
        return prev - 1;
      });
    }, 50); // 5 seconds per story (100 * 50ms)
    
    return () => clearInterval(timer);
  }, [open, isPaused, currentStory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden border-none w-full max-h-screen h-[100dvh] bg-transparent shadow-none" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div 
          ref={storyContainerRef}
          className="flex flex-col h-full w-full rounded-none sm:rounded-xl overflow-hidden bg-gray-900 shadow-lg"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress bars */}
          <div className="flex gap-1 p-2 bg-gray-900/90 backdrop-blur-sm z-10">
            {stories.map((_, index) => (
              <div key={index} className="h-1 flex-1 rounded-full bg-gray-700 overflow-hidden">
                <div 
                  className={cn(
                    "h-full bg-white transition-all", 
                    index === currentStory ? "transition-all duration-50" : "",
                    index < currentStory ? "w-full" : index > currentStory ? "w-0" : ""
                  )}
                  style={index === currentStory ? { width: `${timeLeft}%` } : undefined}
                />
              </div>
            ))}
          </div>
          
          {/* Story background image */}
          <div className="absolute inset-0 z-0">
            {stories[currentStory].image && (
              <div className="absolute inset-0 bg-black/40 z-10" />
            )}
            {stories[currentStory].image && (
              <img 
                src={stories[currentStory].image} 
                alt="" 
                className="object-cover w-full h-full opacity-60"
              />
            )}
          </div>
          
          {/* Story content */}
          <div className="flex-1 overflow-y-auto p-4 z-10 flex items-center justify-center relative">
            <div className="rounded-xl p-6 bg-black/40 backdrop-blur-md text-white max-w-md w-full">
              <div className="mb-6">
                <div className={`inline-block p-3 rounded-full mb-4 ${stories[currentStory].color} bg-white/10`}>
                  {stories[currentStory].icon}
                </div>
                <h3 className="text-2xl font-bold">{stories[currentStory].title}</h3>
              </div>
              
              <div className="prose prose-sm prose-invert flex-1">
                {stories[currentStory].content}
              </div>
            </div>
          </div>
          
          {/* Navigation controls - visible on larger screens */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-2 sm:px-4 opacity-70 z-20">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handlePrev} 
              disabled={currentStory === 0}
              className="rounded-full bg-black/50 backdrop-blur-sm shadow-lg text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handleNext}
              disabled={currentStory === stories.length - 1}
              className="rounded-full bg-black/50 backdrop-blur-sm shadow-lg text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingStories;
