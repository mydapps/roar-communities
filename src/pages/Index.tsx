
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Zap, Users, Trophy } from 'lucide-react';
import OnboardingStories from '@/components/onboarding/OnboardingStories';

const Index = () => {
  const navigate = useNavigate();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [animatedElements, setAnimatedElements] = useState<string[]>([]);

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

  const handleGetStarted = () => {
    setIsOnboardingOpen(true);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <header className="relative pt-16 md:pt-24 pb-10 md:pb-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div 
              className={`space-y-6 ${
                animatedElements.includes('hero') ? 'animate-fade-in' : 'opacity-0'
              }`}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
                Own Your Social Experience with{" "}
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                  Dapps.co
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A community network where you truly belong. Create, connect, and own your social experience.
              </p>
              
              <div className="pt-6">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Features Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10 md:gap-8">
              {/* Feature 1 */}
              <div 
                className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                  animatedElements.includes('feature-1') ? 'animate-slide-up' : 'opacity-0'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                  <Users className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Community Owned</h3>
                <p className="text-muted-foreground">
                  Join communities with shared interests, where you have ownership and a true sense of belonging.
                </p>
              </div>

              {/* Feature 2 */}
              <div 
                className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                  animatedElements.includes('feature-2') ? 'animate-slide-up' : 'opacity-0'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                  <Zap className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Create & Earn</h3>
                <p className="text-muted-foreground">
                  Post content that matters and earn real ETH through community reward pools. Quality content = real rewards.
                </p>
              </div>

              {/* Feature 3 */}
              <div 
                className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                  animatedElements.includes('feature-3') ? 'animate-slide-up' : 'opacity-0'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                  <Trophy className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Invest in Communities</h3>
                <p className="text-muted-foreground">
                  Buy shares in any community - or start your own and earn 5% on trades. Your social participation has real economic value.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div 
            className={`max-w-3xl mx-auto text-center space-y-6 ${
              animatedElements.includes('cta') ? 'animate-fade-in' : 'opacity-0'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Join a Better Social Network?
            </h2>
            <p className="text-xl text-muted-foreground">
              Get started with a free community share worth real ETH.
            </p>
            <div className="pt-6">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg group"
              >
                <span>Create Account</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
