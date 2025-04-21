import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, Trophy, Star, Check, Sparkles, Rocket, Globe, Shield, ArrowUpRight, ArrowUp } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

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
  const [referrerAvatar, setReferrerAvatar] = useState('');
  const [totalWaitlist, setTotalWaitlist] = useState<number | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = usePrivy();
  const isMobile = useIsMobile();
  const heroRef = useRef<HTMLDivElement>(null);

  const isInviteRoute = location.pathname.includes('/invite/');

  useEffect(() => {
    const userId = localStorage.getItem('dapps_user_id');
    const registered = localStorage.getItem('dapps_user_registered');
    const handle = localStorage.getItem('dapps_user_handle');
    const avatar = localStorage.getItem('dapps_user_avatar');
    
    if (userId) {
      console.log('User already logged in, redirecting...');
      console.log('Registration status:', registered);
      
      // Only redirect to request-invite if explicitly set to "0"
      if (registered === "1") {
        navigate('/feed');
        return;
      }
      
      if (handle && avatar) {
        navigate('/request-invite');
      } else {
        navigate('/avatar-handle');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        // Use relative path for proxy
        const response = await fetch('/api/waitlist_count', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          setTotalWaitlist(data.count);
        }
      } catch (error) {
        console.error('Error fetching waitlist count:', error);
      }
    };
    
    fetchWaitlistCount();
  }, []);

  const headlines = [
    "Speak freely without fear of censorship",
    "Invest in communities as a new asset class",
    "Earn real ETH for your quality content",
    "Own a piece of the communities you build",
    "Never worry about being arbitrarily banned",
    "Get paid monthly from community reward pools"
  ];

  useEffect(() => {
    if (isInviteRoute && code) {
      const validateInviteCode = async () => {
        try {
          // Convert code to lowercase
          const lowercaseCode = code.toLowerCase();
          // Use relative path for proxy
          const response = await fetch(`/api/check_invite_code?code=${lowercaseCode}`, { credentials: 'include' });
          const data = await response.json();
          
          if (data.success && data.valid === 1) {
            setShowInviteMessage(true);
            setReferrerHandle(data.referrer || '');
            setReferrerAvatar(data.referrerAvatar || '');
            localStorage.setItem('dapps_invite_code', data.code);
          } else {
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
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      const timeout = setTimeout(() => {
        setIsTyping(true);
        setCurrentTextIndex((currentTextIndex + 1) % headlines.length);
        setDisplayText('');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [displayText, currentTextIndex, isTyping, headlines]);

  // Handle Privy auth events
  useEffect(() => {
    // Listen for Privy modal close event
    const handleMessage = (event: MessageEvent) => {
      // Check if the message is from Privy closing its modal
      if (
        event.data && 
        typeof event.data === 'object' && 
        'type' in event.data
      ) {
        if (event.data.type === 'privy:modalClosed') {
          // Reset the login state immediately when modal is closed
          setIsLoggingIn(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGetStarted = () => {
    setIsLoggingIn(true);
    login();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <Helmet>
        {/* Primary Meta Tags */}
        <title>Dapps.co - Censorship-resistant social platform with real ETH rewards</title>
        <meta name="title" content="Dapps.co - Censorship-resistant social platform with real ETH rewards" />
        <meta name="description" content="Join 75K+ users on Dapps.co - the first truly censorship-resistant social platform where you can earn real ETH, invest in communities, and speak without fear." />
        <meta name="keywords" content="social platform, censorship resistant, crypto rewards, web3, blockchain, community investment, ETH rewards" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dapps.co/" />
        <meta property="og:title" content="Dapps.co - Censorship-resistant social platform with real ETH rewards" />
        <meta property="og:description" content="Join 75K+ users on Dapps.co - the first truly censorship-resistant social platform where you can earn real ETH, invest in communities, and speak without fear." />
        <meta property="og:image" content="https://dapps.co/og-image.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://dapps.co/" />
        <meta property="twitter:title" content="Dapps.co - Censorship-resistant social platform with real ETH rewards" />
        <meta property="twitter:description" content="Join 75K+ users on Dapps.co - the first truly censorship-resistant social platform where you can earn real ETH, invest in communities, and speak without fear." />
        <meta property="twitter:image" content="https://dapps.co/og-image.png" />
        
        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#31bcc3" />
        <link rel="canonical" href="https://dapps.co/" />
      </Helmet>
      
      {/* Dynamic background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background overflow-hidden z-0">
        <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl"></div>
        <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl"></div>
      </div>
      
      <motion.header 
        ref={heroRef}
        className="relative flex flex-col items-center justify-center min-h-[80vh] pt-12 md:pt-16 pb-10 px-4 z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="w-full max-w-md mx-auto mb-6"
          variants={itemVariants}
        >
          <motion.img 
            src="/images/logo1.png" 
            alt="Dapps.co Logo" 
            className="h-16 md:h-20 mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
        </motion.div>
        
        {showInviteMessage && referrerHandle && (
          <motion.div 
            className="w-full max-w-xl mx-auto mb-6 p-5 rounded-xl bg-gradient-to-r from-[#31bcc3]/15 to-primary/5 border border-[#31bcc3]/30 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <motion.div
                  animate={{ 
                    boxShadow: ['0 0 0 0px rgba(49, 188, 195, 0.2)', '0 0 0 10px rgba(49, 188, 195, 0)'],
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2,
                  }}
                  className="absolute inset-0 rounded-full"
                ></motion.div>
                <Avatar className="h-12 w-12 border-2 border-[#31bcc3]/30 shrink-0 mt-1">
                <AvatarImage 
                  src={referrerAvatar || `https://img.dapps.co/avatar/${referrerHandle}.svg`} 
                  alt={referrerHandle} 
                />
                <AvatarFallback className="bg-[#31bcc3]/20 text-[#31bcc3]">
                  {referrerHandle.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              </div>
              <div>
                <p className="text-base md:text-lg text-foreground font-medium">
                  <span className="text-[#31bcc3] font-bold">@{referrerHandle}</span> invited you to join Dapps.co
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Skip the waitlist and get <span className="font-semibold text-[#31bcc3]">500 🦁</span> plus a free community share!
                </p>
                <div className="mt-2 flex">
                  <Badge variant="outline" className="bg-[#31bcc3]/10 hover:bg-[#31bcc3]/20 text-[#31bcc3] border-[#31bcc3]/30">
                    Exclusive Invite
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div className="max-w-6xl mx-auto text-center">
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-x-0 -top-10 w-full h-40 bg-gradient-to-r from-[#31bcc3]/10 via-primary/5 to-[#31bcc3]/10 rounded-full blur-3xl -z-10"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              ></motion.div>
              
            <motion.h1 
              className="text-4xl md:text-7xl font-bold tracking-tight max-w-3xl mx-auto leading-tight"
              variants={itemVariants}
            >
                <span className="block h-[3.5em] md:h-[2em] overflow-hidden mb-4">
                  <span className="bg-gradient-to-r from-[#31bcc3] to-primary bg-clip-text text-transparent">
                    {displayText}
                    {/* Only show cursor when actively typing and not on mobile devices */}
                    {isTyping && !isMobile && (
                      <span className="animate-pulse">|</span>
                    )}
                    {/* For mobile devices, show cursor only when actively typing and not at line breaks */}
                    {isTyping && isMobile && displayText.length > 0 && !displayText.endsWith(" ") && (
                      <span className="animate-pulse">|</span>
                    )}
                  </span>
                </span>
              <span className="text-foreground">
                  with <span className="bg-gradient-to-r from-[#31bcc3] to-primary bg-clip-text text-transparent relative">
                    Dapps.co
                    <motion.span 
                      className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#31bcc3] to-primary rounded-full"
                      animate={{ 
                        width: ["0%", "100%"],
                        left: ["50%", "0%"], 
                        right: ["50%", "0%"],
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        repeatDelay: 5,
                      }}
                    ></motion.span>
                  </span>
              </span>
            </motion.h1>
            </div>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              The first truly censorship-resistant social platform where you can <span className="text-[#31bcc3] font-semibold">earn real ETH</span>, <span className="text-[#31bcc3] font-semibold">invest in communities</span>, and <span className="text-[#31bcc3] font-semibold">speak without fear</span> of arbitrary banning.
            </motion.p>

            <motion.div 
              className="flex flex-wrap justify-center gap-3 pt-3"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5 rounded-full text-sm md:text-base">
                <Check className="h-5 w-5 text-[#31bcc3]" />
                <span>Never lose your account or content to censorship</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5 rounded-full text-sm md:text-base">
                <Check className="h-5 w-5 text-[#31bcc3]" />
                <span>Earn ETH monthly from community reward pools</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5 rounded-full text-sm md:text-base">
                <Check className="h-5 w-5 text-[#31bcc3]" />
                <span>Own thriving communities with like-minded people</span>
              </div>
            </motion.div>
            
            {totalWaitlist && (
              <motion.div
                className="flex items-center justify-center gap-2 text-muted-foreground"
                variants={itemVariants}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative flex items-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 0.9, 0.7]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="absolute inset-0"
                  >
                    <Users className="h-6 w-6 text-[#31bcc3]" />
                  </motion.div>
                  <Users className="h-6 w-6 text-[#31bcc3]" />
                </div>
                <span className="text-lg">
                  <span className="font-bold text-[#31bcc3]">{totalWaitlist.toLocaleString()}</span> people waiting to join
                </span>
              </motion.div>
            )}
            
            <motion.div 
              className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={itemVariants}
            >
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                disabled={isLoggingIn}
                className="relative overflow-hidden bg-gradient-to-r from-[#31bcc3] to-primary hover:from-primary hover:to-[#31bcc3] text-white shadow-lg group px-8 py-6 text-lg w-full sm:w-auto sm:min-w-[200px]"
              >
                <motion.div
                  className="absolute inset-0 bg-white opacity-0 transition-opacity"
                  animate={{ 
                    opacity: [0, 0.1, 0],
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                ></motion.div>
                
                <motion.div 
                  className="flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {isLoggingIn ? (
                    <>
                      <motion.span 
                        className="mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </motion.span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Started</span>
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </motion.span>
                    </>
                  )}
                </motion.div>
              </Button>
              
              <div className="flex items-center gap-3">
                <a href="#how-it-works" onClick={(e) => {
                  e.preventDefault();
                  const section = document.getElementById('how-it-works');
                  if (section) section.scrollIntoView({ behavior: 'smooth' });
                }} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group px-4 py-2">
                  <span>Learn more</span>
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Stats bar */}
      <motion.div
        className="w-full bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 py-8 border-y border-border/50 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="text-3xl md:text-5xl font-bold text-foreground mb-2">75K+</div>
            <div className="text-lg text-muted-foreground">Users Already Waiting to Join</div>
            <div className="mt-4 max-w-lg text-center">
              <p className="text-base text-muted-foreground">Join the fastest-growing decentralized social community where <span className="text-[#31bcc3] font-medium">users own their content</span> and <span className="text-[#31bcc3] font-medium">earn real rewards</span>.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="outline" className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/30">Rapidly Growing</Badge>
              <Badge variant="outline" className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/30">Pre-Launch Success</Badge>
              <Badge variant="outline" className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/30">High Demand</Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.section 
        className="py-20 px-4 bg-gradient-to-b from-background to-muted/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/30 px-3 py-1 text-sm mb-4">
              Revolutionary Benefits
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">What Makes Dapps.co Different</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A platform built for freedom, financial opportunity, and true ownership
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            <div 
              className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                animatedElements.includes('feature-1') ? 'animate-slide-up' : 'opacity-0'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mb-5">
                <Shield className="h-8 w-8 text-[#31bcc3]" />
              </div>
              <h3 className="text-xl font-bold mb-3">True Censorship Resistance</h3>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Say goodbye to arbitrary banning.</span> Express your views without fear of sudden account deletion or shadowbanning.
              </p>
              <div className="mt-4 pt-4 border-t border-border/50 w-full hidden md:block">
                <p className="text-sm font-semibold text-[#31bcc3]">What this means for you:</p>
                <ul className="text-sm text-left mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Freedom to express legitimate views even if controversial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Build a following without fear of losing it overnight</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Immunity from coordinated reporting campaigns</span>
                  </li>
                </ul>
              </div>
            </div>

            <div 
              className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                animatedElements.includes('feature-2') ? 'animate-slide-up' : 'opacity-0'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mb-5">
                <Zap className="h-8 w-8 text-[#31bcc3]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Monthly ETH Rewards</h3>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Get paid for quality content.</span> Each community has its own ETH reward pool that distributes real money to top creators every month.
              </p>
              <div className="mt-4 pt-4 border-t border-border/50 w-full hidden md:block">
                <p className="text-sm font-semibold text-[#31bcc3]">What this means for you:</p>
                <ul className="text-sm text-left mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Consistent monthly income for valuable contributions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Unlock earning potential that scales with your impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Scale your earnings as communities grow in size</span>
                  </li>
                </ul>
              </div>
            </div>

            <div 
              className={`flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 ${
                animatedElements.includes('feature-3') ? 'animate-slide-up' : 'opacity-0'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mb-5">
                <Trophy className="h-8 w-8 text-[#31bcc3]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Community Investments</h3>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">A whole new asset class.</span> Buy shares in emerging communities and watch your investment grow as the community flourishes.
              </p>
              <div className="mt-4 pt-4 border-t border-border/50 w-full hidden md:block">
                <p className="text-sm font-semibold text-[#31bcc3]">What this means for you:</p>
                <ul className="text-sm text-left mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Invest in different interests and fields you're passionate about</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Bonded curve ensures no rug pulls and fair pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#31bcc3] mt-0.5 shrink-0" />
                    <span>Be part of something bigger than yourself that grows with you</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* How It Works - App Preview Section */}
      <motion.section 
        id="how-it-works"
        className="py-24 px-4 relative z-10 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background overflow-hidden z-0">
          <div className="absolute top-[20%] -right-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#31bcc3]/5 via-primary/10 to-transparent blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/30 px-3 py-1 text-sm mb-4">
                Platform Overview
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Experience the Future of Social Media</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Dapps.co combines the best elements of social networking with real economic opportunity. Create content, build communities, and earn ownership—all in one platform.
              </p>
              
              <div className="space-y-5 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#31bcc3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#31bcc3] font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Create your profile</h3>
                    <p className="text-muted-foreground text-sm">Sign up in seconds and customize your profile to showcase your interests and expertise.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#31bcc3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#31bcc3] font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Join communities</h3>
                    <p className="text-muted-foreground text-sm">Discover and join communities aligned with your interests or create your own to gather like-minded people.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#31bcc3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#31bcc3] font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Create and engage</h3>
                    <p className="text-muted-foreground text-sm">Post content, interact with others, and watch your social capital and earnings grow with every quality interaction.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGetStarted}
                  disabled={isLoggingIn}
                  className="bg-[#31bcc3] hover:bg-[#31bcc3]/90 text-white"
                >
                  {isLoggingIn ? (
                    <span className="flex items-center">
                      <motion.span 
                        className="mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.span>
                      <span>Processing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span>Get Started Now</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
                
                <Button variant="outline" className="border-[#31bcc3]/30 text-[#31bcc3]">
                  <span className="flex items-center">
                    <span>Watch Demo</span>
                    <Zap className="ml-2 h-4 w-4" />
                  </span>
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="relative z-10 bg-gradient-to-br from-muted/50 to-muted/30 p-3 rounded-2xl border border-border/50 shadow-xl">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-[#31bcc3]/20 to-primary/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-[#31bcc3]/20 to-primary/10 rounded-full blur-xl"></div>
                
                <div className="bg-muted rounded-xl overflow-hidden shadow-inner border border-border/50">
                  <img 
                    src="/ss.png" 
                    alt="Dapps.co Feed Page" 
                    className="w-full h-auto rounded-lg shadow-md"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      e.currentTarget.src = "https://placehold.co/600x800/31bcc3/white?text=Feed+Preview";
                    }}
                  />
                </div>
                
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-muted/90 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 flex items-center gap-2 shadow-lg">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((num) => (
                      <Avatar key={num} className="h-6 w-6 border-2 border-muted">
                        <AvatarImage src={`https://img.dapps.co/avatar/user${num}.svg`} />
                        <AvatarFallback className="bg-[#31bcc3]/20 text-[#31bcc3] text-xs">
                          {num}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs font-medium">+2.5K active right now</span>
                </div>
              </div>
              
              <motion.div 
                className="absolute top-10 -right-10 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-border/50 flex items-center gap-2 z-20"
                animate={{ 
                  y: [0, -5, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
              >
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                  <ArrowUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium">Engagement up</div>
                  <div className="text-green-600 dark:text-green-400 text-sm font-bold">+126%</div>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute bottom-20 -left-10 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-border/50 flex items-center gap-2 z-20"
                animate={{ 
                  y: [0, 5, 0],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  delay: 0.5
                }}
              >
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium">Earnings</div>
                  <div className="text-purple-600 dark:text-purple-400 text-sm font-bold">$2,450</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section 
        className="py-20 px-4 bg-gradient-to-r from-[#31bcc3]/10 via-primary/10 to-[#31bcc3]/10 relative z-10 border-y border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl"></div>
          <div className="absolute -bottom-[40%] -left-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Badge className="bg-[#31bcc3]/30 text-white border-white/30 backdrop-blur-sm px-3 py-1 text-sm mb-4">
              Limited Opportunity
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Don't Miss This Before It's Gone</h2>
            <p className="text-xl text-foreground max-w-2xl mx-auto mb-4">
              <span className="font-bold text-[#31bcc3]">{totalWaitlist ? `${totalWaitlist.toLocaleString()}` : '75K+'}</span> people are already waiting to join a platform where <span className="underline decoration-[#31bcc3]">your voice can't be silenced</span> and <span className="underline decoration-[#31bcc3]">your content creates real income</span>.
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              The earlier you join, the greater your advantage. Early users consistently earn <span className="font-semibold">2-3x more</span> and get community shares at founding prices.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-background/80 backdrop-blur-md p-8 rounded-xl border border-border/50 shadow-xl mb-10"
          >
            <div className="flex flex-col items-center">
              <motion.div 
                className="rounded-full bg-[#31bcc3]/20 p-5 mb-6"
                animate={{ 
                  boxShadow: ['0 0 0 0px rgba(49, 188, 195, 0.2)', '0 0 0 20px rgba(49, 188, 195, 0)'],
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 2,
                }}
              >
                <Sparkles className="h-10 w-10 text-[#31bcc3]" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-2">Join Now & Get Rewarded</h3>
              <div className="text-3xl font-bold mb-4 text-[#31bcc3]">500 🦁</div>
              <p className="text-muted-foreground mb-6 max-w-md">
                Join now and start with 500 Roar tokens in your account. Our platform is already live in testnet with growing communities.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mb-6">
                <div className="flex flex-col items-center p-4 bg-[#31bcc3]/10 rounded-lg border border-[#31bcc3]/30">
                  <div className="text-lg font-bold">First-Mover Advantage</div>
                  <div className="text-base text-[#31bcc3]">Founding community prices</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-[#31bcc3]/10 rounded-lg border border-[#31bcc3]/30">
                  <div className="text-lg font-bold">Earnings Boost</div>
                  <div className="text-base text-[#31bcc3]">2-3x for early members</div>
                </div>
              </div>
              
              <div className="mb-6 p-4 border border-[#31bcc3]/30 rounded-lg bg-[#31bcc3]/5 w-full max-w-md">
                <div className="text-sm mb-2 font-medium">What people are saying:</div>
                <div className="italic text-sm text-muted-foreground">
                  "I've invested in three growing communities on Dapps.co and it's been incredible to watch them grow. It's like being an early investor in a subreddit or Discord server. True ownership in the social platforms I help build." <span className="not-italic font-medium">— Beta Tester</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center w-full">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  disabled={isLoggingIn}
                  className="bg-gradient-to-r from-[#31bcc3] to-primary hover:from-primary hover:to-[#31bcc3] text-white shadow-lg group px-8 py-6 text-lg w-full"
                >
                  <motion.div 
                    className="flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {isLoggingIn ? (
                      <>
                        <motion.span 
                          className="mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-5 w-5" />
                        </motion.span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Signup/Login</span>
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </motion.span>
                      </>
                    )}
                  </motion.div>
                </Button>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                No credit card required. Reserve your username before it's taken.
              </div>
            </div>
          </motion.div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {avatars.map((username, i) => (
              <motion.div
                key={username}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
              >
                <Avatar className="w-12 h-12 border-2 border-[#31bcc3]/20 shadow-md transition-all duration-500 hover:scale-110">
                <AvatarImage 
                  src={`https://img.dapps.co/avatar/${username}.svg`} 
                  alt="User avatar" 
                />
                <AvatarFallback>
                  <Skeleton className="w-full h-full rounded-full" />
                </AvatarFallback>
              </Avatar>
              </motion.div>
            ))}
          </div>
          
          <motion.p 
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Join {totalWaitlist ? `${totalWaitlist.toLocaleString()}` : '75K+'} others escaping censorship & earning real ETH
          </motion.p>
        </div>
      </motion.section>

      <footer className="mt-auto py-12 px-4 border-t border-border/50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img 
                src="/images/logo1.png" 
                alt="Dapps.co Logo" 
                className="h-10 mr-3" 
              />
              <div className="text-sm text-muted-foreground">
                © 2025 Dapps.co. All rights reserved.
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="mailto:m@dapps.co" className="text-muted-foreground hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">Contact</a>
              <a href="https://mirror.xyz/dapps-co.eth" className="text-muted-foreground hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">Blog</a>
              
              <div className="flex items-center gap-4 ml-4">
                <a href="https://x.com/dapps_co" className="text-muted-foreground hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                  </svg>
                </a>
                <a href="https://github.com/my_dapps" className="text-muted-foreground hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                </a>
              </div>
          </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
