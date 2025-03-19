import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Gift, TrendingUp, MessageCircle, DollarSign, Award, PartyPopper, Sparkle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
      title: "Your Free Share Awaits! 🎉",
      content: (
        <div className="space-y-3 relative">
          <p className="text-lg">Congratulations! You've earned your first share!</p>
          <div className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-lg p-4 mt-4 animate-pulse border border-amber-500/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkle className="h-5 w-5 text-amber-500" />
                <span className="font-medium">DeFi Explorers</span>
              </div>
              <span className="text-amber-500 font-bold">0.067 shares</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Worth approximately $20</div>
          </div>
          
          <div className="mt-6 animate-fade-in">
            <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 p-4 rounded-lg mb-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <PartyPopper className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-amber-500">You're off to a great start!</span>
              </div>
              <p className="text-sm">Start exploring the platform to earn more shares and rewards!</p>
            </div>
          </div>
          
          <Button 
            className="w-full mt-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-6 group relative overflow-hidden"
            onClick={() => {
              triggerConfetti();
              setTimeout(() => navigate('/feed'), 1500);
            }}
          >
            <span className="absolute inset-0 w-full h-full bg-amber-400/20 animate-pulse"></span>
            <span className="relative flex items-center gap-2">
              <Gift className="h-5 w-5 animate-pulse" /> 
              Claim Free Share
            </span>
          </Button>
        </div>
      ),
      icon: <Award className="h-10 w-10" />,
      color: "text-amber-500",
      gradient: "from-amber-500/20 to-purple-500/20",
      image: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    }
  ];

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#8B5CF6', '#EC4899']
    });
  };

  const handleNext = () => {
    if (currentStory < stories.length - 1) {
      setCurrentStory(currentStory + 1);
      setTimeLeft(100);
    }
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
        <DialogTitle className="sr-only">Onboarding Stories</DialogTitle>
        <div 
          ref={storyContainerRef}
          className="flex flex-col h-full w-full rounded-none sm:rounded-xl overflow-hidden bg-gray-900 shadow-lg"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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
