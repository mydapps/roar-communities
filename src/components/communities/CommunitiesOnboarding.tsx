import React, { useState } from 'react';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Gift, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Heart,
  Zap,
  Star,
  Crown,
  X
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CommunitiesOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  startSlide?: number;
}

const CommunitiesOnboarding: React.FC<CommunitiesOnboardingProps> = ({
  isOpen,
  onClose,
  onComplete,
  startSlide = 0
}) => {
  const [currentSlide, setCurrentSlide] = useState(startSlide);
  const isMobile = useIsMobile();

  // Reset slide when component opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentSlide(startSlide);
    }
  }, [isOpen, startSlide]);

  const slides = [
    {
      title: "Own Your Tribe",
      icon: <Heart className="h-16 w-16 text-pink-500" />,
      headline: "Buy shares in communities you love",
      description: "Join like-minded people and actually own a piece of what you're building together.",
      highlight: "It's not just following—it's belonging.",
      gradient: "from-pink-500/30 via-purple-500/20 to-blue-500/30",
      glowColor: "shadow-pink-500/25"
    },
    {
      title: "Trade Instantly",
      icon: <TrendingUp className="h-16 w-16 text-emerald-500" />,
      headline: "Buy and sell 24/7, no waiting",
      description: "Your investment is always liquid. See an opportunity? Buy instantly. Need to exit? Sell immediately.",
      highlight: "Your money, your timeline.",
      gradient: "from-emerald-500/30 via-blue-500/20 to-cyan-500/30",
      glowColor: "shadow-emerald-500/25"
    },
    {
      title: "Reward Pools",
      icon: <Gift className="h-16 w-16 text-amber-500" />,
      headline: "Get paid from community reward pools",
      description: "Every community has a growing reward pool. Post quality content, engage authentically, and earn your share of real ETH rewards.",
      highlight: "Quality content = Real rewards.",
      gradient: "from-amber-500/30 via-orange-500/20 to-red-500/30",
      glowColor: "shadow-amber-500/25"
    }
  ];

  const currentSlideData = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Dynamic heading based on start slide
  const getModalHeading = () => {
    if (startSlide === 2) {
      return {
        title: "About Reward Pools",
        subtitle: "How you earn real ETH"
      };
    }
    return {
      title: "Welcome to Communities",
      subtitle: "Your gateway to ownership"
    };
  };

  const modalHeading = getModalHeading();

  const OnboardingContent = () => (
    <div className="relative p-6 md:p-8 max-h-[80vh] overflow-hidden">
      {/* Animated background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient} opacity-40 rounded-3xl transition-all duration-700 ease-out`} />
      <div className={`absolute inset-0 bg-gradient-to-tr ${currentSlideData.gradient} opacity-20 rounded-3xl blur-xl transition-all duration-1000`} />
      
      {/* Content */}
      <div className="relative z-10 text-center space-y-6">
        {/* Icon with glow effect */}
        <div className="flex justify-center mb-6">
          <div className={`p-6 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl ${currentSlideData.glowColor} transition-all duration-500 hover:scale-105`}>
            {currentSlideData.icon}
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          {currentSlideData.title}
        </h2>
        
        {/* Main content */}
        <div className="space-y-4 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-foreground/90">
            {currentSlideData.headline}
          </h3>
          <p className="text-base text-muted-foreground leading-relaxed">
            {currentSlideData.description}
          </p>
        </div>
        
        {/* Highlight */}
        <div className="relative">
          <div className="p-4 bg-primary/10 backdrop-blur-sm rounded-2xl border border-primary/20 max-w-sm mx-auto">
            <p className="text-primary font-semibold italic text-lg">
              {currentSlideData.highlight}
            </p>
          </div>
        </div>
        
        {/* Progress indicators */}
        <div className="flex justify-center gap-3 pt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-primary shadow-lg' 
                  : 'w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Badge variant="secondary" className="px-4 py-2 text-sm">
            {currentSlide + 1} of {slides.length}
          </Badge>

          <Button
            onClick={handleNext}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {currentSlide === slides.length - 1 ? (
              <>
                Let's Go!
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh] border-t-0">
          {/* Single header with close button */}
          <div className="flex justify-between items-center p-4 border-b bg-background/95 backdrop-blur-sm">
            <div>
              <h2 className="text-lg font-semibold">{modalHeading.title}</h2>
              <p className="text-sm text-muted-foreground">{modalHeading.subtitle}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-hidden">
            <OnboardingContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          <div className="bg-background/95 backdrop-blur-xl rounded-3xl border border-border/20 shadow-2xl overflow-hidden">
            {/* Single header with close button */}
            <div className="flex justify-between items-center p-6 pb-0">
              <div>
                <h2 className="text-xl font-semibold">{modalHeading.title}</h2>
                <p className="text-sm text-muted-foreground">{modalHeading.subtitle}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <OnboardingContent />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default CommunitiesOnboarding; 