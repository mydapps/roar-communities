
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Gift, Zap, Users, ArrowUpRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface OnboardingStoriesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  backgroundColor: string;
}

const OnboardingStories = ({ open, onOpenChange }: OnboardingStoriesProps) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const stories: Story[] = [
    {
      id: 1,
      title: "Welcome to ROAR!",
      description: "You're about to join thousands of trailblazers reshaping the future of social investing.",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80",
      icon: <Zap className="h-8 w-8 text-amber-400" />,
      backgroundColor: "from-blue-900/95 to-blue-950/95"
    },
    {
      id: 2,
      title: "Own a Piece of What You Love",
      description: "Here, every community you join gives you real ownership. Your engagement has actual value - not just likes.",
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80",
      icon: <Trophy className="h-8 w-8 text-amber-400" />,
      backgroundColor: "from-emerald-900/95 to-emerald-950/95"
    },
    {
      id: 3,
      title: "Connect with Real Communities",
      description: "Join communities built around shared passions, not algorithms. Here, every voice matters and creates real value.",
      image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80",
      icon: <Users className="h-8 w-8 text-amber-400" />,
      backgroundColor: "from-purple-900/95 to-purple-950/95"
    },
    {
      id: 4,
      title: "Claim Your FREE Share Now!",
      description: "As an early adopter, you've earned a free share in our founding community. This isn't just a digital badge - it's real equity that could grow in value.",
      image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80",
      icon: <Gift className="h-10 w-10 text-amber-400 animate-pulse" />,
      backgroundColor: "from-amber-900/95 to-amber-950/95"
    }
  ];

  const isLastStory = currentStoryIndex === stories.length - 1;

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // On last story, don't auto close
      setPaused(true);
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleClose = () => {
    clearInterval(intervalRef.current!);
    setCurrentStoryIndex(0);
    setProgress(0);
    onOpenChange(false);
  };

  const handleClaimShare = () => {
    handleClose();
    navigate('/feed');
  };

  const handleTouchStart = () => {
    setPaused(true);
  };

  const handleTouchEnd = () => {
    if (!isLastStory) {
      setPaused(false);
    }
  };

  useEffect(() => {
    if (open && !paused && !isLastStory) {
      intervalRef.current = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 0.5;
        });
      }, 30);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [open, currentStoryIndex, paused, isLastStory]);

  if (!open) return null;
  
  const currentStory = stories[currentStoryIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md h-[85vh] overflow-hidden rounded-xl shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0 bg-black">
          <img 
            src={currentStory.image} 
            alt={currentStory.title} 
            className="w-full h-full object-cover opacity-70"
          />
          <div className={`absolute inset-0 bg-gradient-to-b ${currentStory.backgroundColor}`} />
        </div>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2 z-10">
          {stories.map((story, idx) => (
            <div 
              key={story.id} 
              className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
            >
              <div 
                className={`h-full bg-white transition-all duration-100 rounded-full ${
                  idx < currentStoryIndex ? 'w-full' : 
                  idx === currentStoryIndex ? '' : 'w-0'
                }`}
                style={{ 
                  width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute top-2 right-2 z-10">
          <button 
            onClick={handleClose}
            className="p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition"
            aria-label="Close stories"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute inset-x-0 top-1/2 flex justify-between items-center px-4 z-10">
          <button
            onClick={handlePrev}
            className={`p-1 rounded-full bg-black/20 text-white hover:bg-black/40 transition ${
              currentStoryIndex === 0 ? 'invisible' : ''
            }`}
            aria-label="Previous story"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={handleNext}
            className={`p-1 rounded-full bg-black/20 text-white hover:bg-black/40 transition ${
              isLastStory ? 'invisible' : ''
            }`}
            aria-label="Next story"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 inset-x-0 p-6 text-white z-10">
          <div className="mb-6 flex justify-center">
            <div className={`p-4 rounded-full ${isLastStory ? 'bg-amber-500 animate-pulse' : 'bg-white/10'}`}>
              {currentStory.icon}
            </div>
          </div>
          
          <h2 className={`text-2xl font-bold mb-3 text-center ${isLastStory ? 'text-amber-400' : 'text-white'}`}>
            {currentStory.title}
          </h2>
          
          <p className="text-white/90 text-center mb-6">
            {currentStory.description}
          </p>

          {isLastStory && (
            <Button 
              onClick={handleClaimShare} 
              className="w-full py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl text-lg font-semibold group animate-slide-up"
            >
              <span>Claim Free Share</span>
              <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingStories;
