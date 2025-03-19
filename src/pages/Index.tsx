
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, Trophy } from 'lucide-react';
import OnboardingStories from '@/components/onboarding/OnboardingStories';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { code } = useParams();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [animatedElements, setAnimatedElements] = useState<string[]>([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Check if we're on an invite route
  const isInviteRoute = location.pathname.includes('/invite/');
  
  // Animation headlines
  const headlines = [
    "Own your social experience",
    "Create content that earns",
    "Join thriving communities",
    "Invest in what you love"
  ];

  useEffect(() => {
    // Stagger animations for elements
    const elements = ['hero', 'feature-1', 'feature-2', 'feature-3', 'cta'];
    const timer = setTimeout(() => {
      setAnimatedElements(['hero']);
    }, 100);
    
    // Stagger the rest of the animations
    elements.slice(1).forEach((element, index) => {
      setTimeout(() => {
        setAnimatedElements(prev => [...prev, element]);
      }, (index + 1) * 200 + 400);
    });
    
    return () => clearTimeout(timer);
  }, []);

  // Text typing animation
  useEffect(() => {
    if (isTyping) {
      const currentHeadline = headlines[currentTextIndex];
      if (displayText.length < currentHeadline.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentHeadline.slice(0, displayText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        setIsTyping(false);
        const timeout = setTimeout(() => {
          setIsTyping(true);
          setCurrentTextIndex((currentTextIndex + 1) % headlines.length);
          setDisplayText('');
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [displayText, currentTextIndex, isTyping, headlines]);

  const handleGetStarted = () => {
    setIsOnboardingOpen(true);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Hero Section */}
        <header className="relative flex-grow flex items-center justify-center pt-16 md:pt-24 pb-10 md:pb-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div 
              className={`space-y-8 ${
                animatedElements.includes('hero') ? 'animate-fade-in' : 'opacity-0'
              }`}
            >
              {isInviteRoute && (
                <div className="max-w-xl mx-auto mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-lg text-amber-600 dark:text-amber-400">
                    You've been invited by <span className="font-bold">@bravegoldfish</span>! Sign up to skip the queue and get your first share (up to $100) for free.
                  </p>
                </div>
              )}
              
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
                <span className="block h-[2.5em] md:h-[1.5em] overflow-hidden">
                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                    {displayText}
                    <span className="animate-pulse">|</span>
                  </span>
                </span>
                <span className="text-foreground">
                  with <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">Dapps.co</span>
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The first social network where your contributions have real value. Create, connect, and earn in a community that rewards quality.
              </p>
              
              <div className="pt-8">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg group px-10 py-6 text-lg"
                >
                  <span>Login / Sign Up</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Benefits Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10 md:gap-12">
              {/* Benefit 1 */}
              <div 
                className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                  animatedElements.includes('feature-1') ? 'animate-slide-up' : 'opacity-0'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                  <Users className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Truly Belong</h3>
                <p className="text-muted-foreground">
                  Escape algorithm-driven feeds and join communities built around real connection, where your voice matters and contributions are valued.
                </p>
              </div>

              {/* Benefit 2 */}
              <div 
                className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                  animatedElements.includes('feature-2') ? 'animate-slide-up' : 'opacity-0'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                  <Zap className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Earn While Creating</h3>
                <p className="text-muted-foreground">
                  Turn your insights, creativity, and community building into real value. Every upvote translates to tangible rewards from community pools.
                </p>
              </div>

              {/* Benefit 3 */}
              <div 
                className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                  animatedElements.includes('feature-3') ? 'animate-slide-up' : 'opacity-0'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                  <Trophy className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Grow Your Influence</h3>
                <p className="text-muted-foreground">
                  As your communities thrive, so does your stake in them. Build, invest, and grow with real ownership in the spaces you help create.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section 
          className={`py-20 px-4 ${
            animatedElements.includes('cta') ? 'animate-fade-in' : 'opacity-0'
          }`}
        >
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Join thousands already building their social equity
            </h2>
            <div className="flex flex-wrap justify-center gap-4 py-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-muted animate-pulse" style={{
                  animationDelay: `${i * 0.2}s`
                }} />
              ))}
            </div>
            <p className="text-xl text-muted-foreground">
              The next generation of social networks starts with you.
            </p>
            <div className="pt-8">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg group px-10 py-6 text-lg"
              >
                <span>Get Started Now</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto py-8 border-t">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src="https://dapps.co/icon-128x128.png" 
                alt="Dapps.co Logo" 
                className="w-10 h-10 mr-3" 
              />
              <span className="font-bold">Dapps.co</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2023 Dapps.co. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      {/* Onboarding Stories Overlay */}
      <OnboardingStories 
        open={isOnboardingOpen} 
        onOpenChange={setIsOnboardingOpen} 
      />
    </>
  );
};

export default Index;
