import React from 'react';
import { useFirstTimeVisitor } from '@/hooks/useFirstTimeVisitor';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { X, ChevronLeft, ChevronRight, Wallet, Coins, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingSlideProps {
  slide: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isLast: boolean;
  isFirst: boolean;
  heading: string;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  slide,
  onNext,
  onPrev, 
  onClose,
  isLast,
  isFirst,
  heading
}) => {
  const slides = [
    {
      icon: <Wallet className="h-12 w-12 text-white" />,
      title: "Add ETH to Start",
      content: "ETH powers everything - buying shares, trading, withdrawing. It's your gateway to owning pieces of amazing communities.",
      background: "from-blue-500 via-purple-500 to-indigo-600"
    },
    {
      icon: <Coins className="h-12 w-12 text-white" />,
      title: "Own Community Shares",
      content: "Each share is ownership in a community's future. Join early, watch them grow, and benefit from their success.",
      background: "from-emerald-500 via-teal-500 to-cyan-600"
    },
    {
      icon: <Shield className="h-12 w-12 text-white" />,
      title: "You're in Control",
      content: "Self-custody wallet means you own everything. Buy, sell, withdraw anytime. No permission needed, no waiting for approvals.",
      background: "from-amber-500 via-orange-500 to-red-500"
    }
  ];

  const currentSlide = slides[slide - 1];
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <h2 className="text-lg font-bold text-foreground">
          {heading}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="px-4 pb-3">
        <div className="flex space-x-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={cn(
                "h-2 flex-1 rounded-full transition-all duration-300",
                num <= slide 
                  ? "bg-primary shadow-sm shadow-primary/50" 
                  : "bg-muted/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4">
        <div className={cn(
          "rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center relative overflow-hidden",
          "bg-gradient-to-br",
          currentSlide.background
        )}>
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute bottom-6 right-4 w-12 h-12 bg-white/30 rounded-full blur-lg animate-pulse delay-700" />
            <div className="absolute top-1/2 right-6 w-10 h-10 bg-white/25 rounded-full blur-md animate-pulse delay-300" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 inline-block">
              {currentSlide.icon}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {currentSlide.title}
              </h3>
              <p className="text-white/90 text-base leading-relaxed max-w-xs">
                {currentSlide.content}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 pt-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onPrev}
            disabled={isFirst}
            className={cn(
              "flex items-center gap-2 h-10",
              isFirst ? "invisible" : "visible"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="text-sm text-muted-foreground font-medium">
            {slide} of 3
          </div>

          {isLast ? (
            <Button
              onClick={onNext}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 h-10 px-6"
            >
              Let's Go! 🚀
            </Button>
          ) : (
            <Button
              onClick={onNext}
              className="flex items-center gap-2 h-10"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface MySharesOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  startSlide?: number;
}

const MySharesOnboarding: React.FC<MySharesOnboardingProps> = ({
  isOpen,
  onClose,
  onComplete,
  startSlide = 0
}) => {
  const isMobile = useIsMobile();
  const [currentSlide, setCurrentSlide] = React.useState(startSlide);

  // Reset slide when component opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentSlide(startSlide);
    }
  }, [isOpen, startSlide]);

  const handleClose = () => {
    setCurrentSlide(0); // Reset for next time
    onClose();
  };

  const handleNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const heading = "Welcome to your wallet";

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="h-[70vh] border-t-2 border-primary/20">
          <OnboardingSlide
            slide={currentSlide + 1}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleClose}
            isLast={currentSlide === 2}
            isFirst={currentSlide === 0}
            heading={heading}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-background border border-border rounded-xl shadow-2xl w-[95vw] max-w-lg h-[600px] focus:outline-none z-50">
          <OnboardingSlide
            slide={currentSlide + 1}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleClose}
            isLast={currentSlide === 2}
            isFirst={currentSlide === 0}
            heading={heading}
          />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export { MySharesOnboarding };
export default MySharesOnboarding; 