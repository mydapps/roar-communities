
import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, Trophy } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { code } = useParams();
  const [animatedElements, setAnimatedElements] = useState<string[]>([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [referrerHandle, setReferrerHandle] = useState('');
  const { login } = usePrivy();
  const isMobile = useIsMobile();

  const isInviteRoute = location.pathname.includes('/invite/');

  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    // Get user data from localStorage
    const userId = localStorage.getItem('dapps_user_id');
    const userKey = localStorage.getItem('dapps_user_key');
    const registered = localStorage.getItem('dapps_user_registered');
    const handle = localStorage.getItem('dapps_user_handle');
    const avatar = localStorage.getItem('dapps_user_avatar');
    
    // Only check if we have the essential user data
    if (userId && userKey) {
      console.log('User already logged in, redirecting...');
      
      // If registered, go to feed
      if (registered === "1") {
        navigate('/feed');
        return;
      }
      
      // If both handle and avatar exist, go to request-invite
      if (handle && avatar) {
        navigate('/request-invite');
      } else {
        // Missing handle or avatar, go to avatar-handle
        navigate('/avatar-handle');
      }
    }
  }, [navigate]);

  const headlines = [
    "Own your audience and your influence",
    "Transform your social value into real assets",
    "Build communities with true ownership",
    "Support what you love and earn rewards",
    "Turn engagement into lasting wealth",
    "Create powerful connections that pay off"
  ];

  // Check and validate invite code
  useEffect(() => {
    if (isInviteRoute && code) {
      const validateInviteCode = async () => {
        try {
          const response = await fetch(`https://api.dapps.co/check_invite_code?code=${code}`);
          const data = await response.json();
          
          if (data.success && data.valid === 1) {
            // Valid invite code
            setShowInviteMessage(true);
            setReferrerHandle(data.referrer || ''); // Use the referrer handle from API
            
            // Store the invite code in localStorage
            localStorage.setItem('dapps_invite_code', data.code);
          } else {
            // Invalid invite code, don't show the invite message
            setShowInviteMessage(false);
            console.log('Invalid invite code');
          }
        } catch (error) {
          console.error('Error validating invite code:', error);
          setShowInviteMessage(false);
        }
      };
      
      validateInviteCode();
    }
  }, [isInviteRoute, code]);

  useEffect(() => {
    const usernames = [
      'alice', 'bob', 'charlie', 'dave', 'emma', 
      'frank', 'grace', 'hannah', 'isaac', 'julia',
      'kevin', 'lisa', 'mike', 'nina', 'oscar'
    ];
    
    const shuffled = [...usernames].sort(() => 0.5 - Math.random());
    setAvatars(shuffled.slice(0, 5));

    const interval = setInterval(() => {
      const shuffled = [...usernames].sort(() => 0.5 - Math.random());
      setAvatars(shuffled.slice(0, 5));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const elements = ['hero', 'feature-1', 'feature-2', 'feature-3', 'cta'];
    const timer = setTimeout(() => {
      setAnimatedElements(['hero']);
    }, 100);
    
    elements.slice(1).forEach((element, index) => {
      setTimeout(() => {
        setAnimatedElements(prev => [...prev, element]);
      }, (index + 1) * 200 + 400);
    });
    
    return () => clearTimeout(timer);
  }, []);

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
        }, 8000);
        return () => clearTimeout(timeout);
      }
    }
  }, [displayText, currentTextIndex, isTyping, headlines]);

  const handleGetStarted = () => {
    login();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="relative flex-grow flex items-center justify-center pt-16 md:pt-24 pb-10 md:pb-16 px-4">
        {showInviteMessage && referrerHandle && (
          <div className={`w-full max-w-xl mx-auto mb-6 md:mb-8 p-4 rounded-lg bg-[#31bcc3]/10 border border-[#31bcc3]/20 ${isMobile ? 'mx-4' : ''}`}>
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 shrink-0 mt-1">
                <AvatarImage src={`https://img.dapps.co/avatar/${referrerHandle}.svg`} alt={referrerHandle} />
                <AvatarFallback className="bg-[#31bcc3]/20 text-[#31bcc3]">
                  {referrerHandle.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base md:text-lg text-foreground font-medium">
                  <span className="text-[#31bcc3] font-bold">@{referrerHandle}</span> invited you to join Dapps.co
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Sign up now to skip the waiting list and receive a free share worth up to $100. No credit card required.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-5xl mx-auto text-center">
          <div 
            className={`space-y-8 ${
              animatedElements.includes('hero') ? 'animate-fade-in' : 'opacity-0'
            }`}
          >
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
              <span className="block h-[3.5em] md:h-[2.5em] overflow-hidden mb-2">
                <span className="bg-gradient-to-r from-[#31bcc3] to-[#31bcc3]/80 bg-clip-text text-transparent">
                  {displayText}
                  <span className="animate-pulse">|</span>
                </span>
              </span>
              <span className="text-foreground">
                with <span className="bg-gradient-to-r from-[#31bcc3] to-[#31bcc3]/80 bg-clip-text text-transparent">Dapps.co</span>
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The first social network where your contributions have real value. Create, connect, and earn in a community that rewards quality.
            </p>
            
            <div className="pt-8">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-[#31bcc3] to-[#31bcc3]/90 hover:from-[#31bcc3]/90 hover:to-[#31bcc3] text-white shadow-lg group px-10 py-6 text-lg"
              >
                <span>Login / Sign Up</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            <div 
              className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                animatedElements.includes('feature-1') ? 'animate-slide-up' : 'opacity-0'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mb-5">
                <Users className="h-8 w-8 text-[#31bcc3]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Truly Belong</h3>
              <p className="text-muted-foreground">
                Escape algorithm-driven feeds and join communities built around real connection, where your voice matters and contributions are valued.
              </p>
            </div>

            <div 
              className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                animatedElements.includes('feature-2') ? 'animate-slide-up' : 'opacity-0'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mb-5">
                <Zap className="h-8 w-8 text-[#31bcc3]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Earn While Creating</h3>
              <p className="text-muted-foreground">
                Turn your insights, creativity, and community building into real value. Every upvote translates to tangible rewards from community pools.
              </p>
            </div>

            <div 
              className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                animatedElements.includes('feature-3') ? 'animate-slide-up' : 'opacity-0'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mb-5">
                <Trophy className="h-8 w-8 text-[#31bcc3]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Grow Your Influence</h3>
              <p className="text-muted-foreground">
                As your communities thrive, so does your stake in them. Build, invest, and grow with real ownership in the spaces you help create.
              </p>
            </div>
          </div>
        </div>
      </section>

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
            {avatars.map((username, i) => (
              <Avatar key={username} className="w-12 h-12 shadow-md transition-all duration-500 hover:scale-110">
                <AvatarImage 
                  src={`https://img.dapps.co/avatar/${username}.svg`} 
                  alt="User avatar" 
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
                <AvatarFallback>
                  <Skeleton className="w-full h-full rounded-full" />
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <p className="text-xl text-muted-foreground">
            The next generation of social networks starts with you.
          </p>
          <div className="pt-8">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-[#31bcc3] to-[#31bcc3]/90 hover:from-[#31bcc3]/90 hover:to-[#31bcc3] text-white shadow-lg group px-10 py-6 text-lg"
            >
              <span>Login / Sign Up</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

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
  );
};

export default Index;
