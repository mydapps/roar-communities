import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, Trophy, Star, Check, Sparkles, Rocket, Globe, Shield, ArrowUpRight, ArrowDown, Play, Heart, MessageCircle, Share2, TrendingUp, Eye, Wallet, Crown, DollarSign, Sun, Moon, Twitter, Github, Apple, Smartphone, ExternalLink } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useDevice } from '@/components/providers/DeviceProvider';
import MobileAppLanding from '@/components/onboarding/MobileAppLanding';
import { isMobileApp as checkIfMobileApp } from '@/utils/deviceUtils';
import { useTheme } from '@/contexts/ThemeContext';

const Index2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { code } = useParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [referrerHandle, setReferrerHandle] = useState('');
  const [referrerAvatar, setReferrerAvatar] = useState('');
  const [totalWaitlist, setTotalWaitlist] = useState<number | null>(null);
  const { login } = usePrivy();
  const isMobile = useIsMobile();
  const { isMobileApp, isLoading: deviceDetectionLoading } = useDevice();
  const [isViewStabilized, setIsViewStabilized] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Simplified scroll progress for subtle animations
  const { scrollYProgress } = useScroll();
  const headerY = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -20]);

  const isInviteRoute = location.pathname.includes('/invite/');

  // Simplified floating elements with fewer, more subtle animations
  const [floatingElements] = useState([
    { id: 1, emoji: '🦁', x: 10, y: 20 },
    { id: 2, emoji: '💎', x: 80, y: 30 },
    { id: 3, emoji: '🚀', x: 15, y: 70 },
    { id: 4, emoji: '⚡', x: 85, y: 60 },
    { id: 5, emoji: '🌟', x: 50, y: 10 }
  ]);

  // Stabilize view
  useEffect(() => {
    if (!deviceDetectionLoading) {
      setTimeout(() => setIsViewStabilized(true), 200);
    }
  }, [deviceDetectionLoading, isMobileApp]);

  // Redirect if logged in
  useEffect(() => {
    const userId = localStorage.getItem('dapps_user_id');
    const registered = localStorage.getItem('dapps_user_registered');
    
    if (userId && registered === "1") {
      navigate('/feed');
    }
  }, [navigate]);

  // Fetch waitlist count
  useEffect(() => {
      const setStaticWaitlistCount = () => {
    // Use static count based on actual waitlist data (API endpoint not available)
    setTotalWaitlist(89000);
  };
    setStaticWaitlistCount();
  }, []);

  // Handle invite validation
  useEffect(() => {
    if (isInviteRoute && code) {
      const validateInviteCode = async () => {
        try {
          const response = await fetch(`/api/check_invite_code?code=${code.toLowerCase()}`, { credentials: 'include' });
          const data = await response.json();
          
          if (data.success && data.valid === 1) {
            setShowInviteMessage(true);
            setReferrerHandle(data.referrer || '');
            setReferrerAvatar(data.referrerAvatar || '');
            localStorage.setItem('dapps_invite_code', data.code);
          }
        } catch (error) {
          console.error('Error validating invite code:', error);
        }
      };
      validateInviteCode();
    }
  }, [isInviteRoute, code]);

  const handleGetStarted = () => {
    setIsLoggingIn(true);
    try {
      login();
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoggingIn(false);
      toast.error('Failed to start login process');
    }
  };

  // Loading state
  if (deviceDetectionLoading || !isViewStabilized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mobile app version
  if (isMobileApp) {
    return (
      <MobileAppLanding 
        onGetStarted={handleGetStarted} 
        isLoggingIn={isLoggingIn}
        onPrivyClosed={() => setIsLoggingIn(false)}
      />
    );
  }

  // SEO metadata
  const baseUrl = 'https://dapps.co';
  const currentUrl = isInviteRoute && code ? `${baseUrl}/invite/${code}` : baseUrl;
  const pageTitle = isInviteRoute && referrerHandle 
    ? `Join ${referrerHandle} on dapps.co - Own the Internet` 
    : 'dapps.co - Own the Internet';
  const pageDescription = 'The first social platform where you own your content, invest in communities, and earn real money. Join the revolution.';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative transition-colors duration-300">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content={`${baseUrl}/og-image.png`} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
      </Helmet>

      {/* Simplified floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element) => (
          <motion.div
            key={element.id}
            className="absolute text-3xl opacity-10 dark:opacity-5"
            style={{ 
              left: `${element.x}%`, 
              top: `${element.y}%`
            }}
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8 + element.id,
              repeat: Infinity,
              ease: "easeInOut",
              delay: element.id * 0.5
            }}
          >
            {element.emoji}
          </motion.div>
        ))}
      </div>

      {/* Simplified gradient backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>

      {/* Enhanced Header with Improved Theme Toggle */}
      <motion.header 
        className="relative z-10 pt-8 pb-4 px-4"
        style={{ y: headerY }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.img 
              src="/images/logo1.png" 
              alt="dapps.co" 
              className="h-10 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mobile App Download Links */}
            <div className="hidden sm:flex items-center gap-2">
              <motion.a
                href="https://apps.apple.com/app/dapps-co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-foreground/10 hover:bg-foreground/20 backdrop-blur-md rounded-lg px-3 py-2 text-sm transition-all duration-300 border border-foreground/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Apple className="h-4 w-4" />
                <span>iOS</span>
              </motion.a>
              <motion.a
                href="https://play.google.com/store/apps/details?id=co.dapps.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-foreground/10 hover:bg-foreground/20 backdrop-blur-md rounded-lg px-3 py-2 text-sm transition-all duration-300 border border-foreground/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Smartphone className="h-4 w-4" />
                <span>Android</span>
              </motion.a>
            </div>

            {/* Improved Theme Toggle with Better Visibility */}
            <motion.button
              onClick={toggleTheme}
              className="relative w-14 h-8 bg-foreground/10 hover:bg-foreground/20 backdrop-blur-md rounded-full border-2 border-foreground/30 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute top-1 w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg flex items-center justify-center border border-white/20"
                animate={{
                  x: theme === 'dark' ? 28 : 4,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div
                      key="moon"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-3 w-3 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sun"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.button>

            {/* Waitlist Counter */}
            {totalWaitlist && (
              <motion.div
                className="flex items-center gap-2 bg-foreground/10 backdrop-blur-md rounded-full px-4 py-2 border border-foreground/20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{totalWaitlist.toLocaleString()} joining</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Invite Message */}
      {showInviteMessage && referrerHandle && (
        <motion.div 
          className="relative z-10 max-w-lg mx-auto mb-8 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-md border border-primary/30 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage 
                  src={referrerAvatar || `https://img.dapps.co/avatar/${referrerHandle}.svg`} 
                  alt={referrerHandle} 
                />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {referrerHandle.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-medium">
                  <span className="text-primary font-bold">@{referrerHandle}</span> invited you
                </p>
                <p className="text-sm text-muted-foreground">
                  Skip the waitlist + get <span className="font-bold text-yellow-400">500 🦁 tokens</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Hero Section with Fixed Text Visibility */}
      <motion.section 
        className="relative z-10 text-center px-4 py-16 max-w-6xl mx-auto"
        style={{ y: heroY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="text-5xl md:text-8xl font-black mb-8 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <motion.span 
            className="block text-foreground dark:bg-gradient-to-r dark:from-primary dark:via-secondary dark:to-accent dark:bg-clip-text dark:text-transparent"
          >
            Own the
          </motion.span>
          <motion.span 
            className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
          >
            Internet
          </motion.span>
        </motion.h1>

        <motion.p 
          className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          The first social platform where you <span className="text-cyan-400 font-semibold">own your content</span>, 
          <span className="text-primary font-semibold"> invest in communities</span>, 
          and <span className="text-yellow-400 font-semibold">earn real money</span>.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            disabled={isLoggingIn}
            className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white dark:text-white shadow-xl px-12 py-6 text-xl font-bold rounded-full border-2 border-white/20"
          >
            <motion.div 
              className="flex items-center justify-center relative z-10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoggingIn ? (
                <>
                  <motion.span 
                    className="mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-8 w-8" />
                  </motion.span>
                  <span>Launching Your Future...</span>
                </>
              ) : (
                <>
                  <span>Join the Revolution</span>
                  <Rocket className="ml-4 h-8 w-8" />
                </>
              )}
            </motion.div>
          </Button>

          <motion.a 
            href="#how-it-works" 
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-6 py-3"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-lg">See how it works</span>
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowDown className="h-5 w-5" />
            </motion.div>
          </motion.a>
        </motion.div>

        {/* Simplified quick stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { icon: Users, value: "75K+", label: "Users Waiting", color: "from-blue-400 to-cyan-400" },
            { icon: DollarSign, value: "$2M+", label: "Community Value", color: "from-green-400 to-emerald-400" },
            { icon: Zap, value: "24/7", label: "Earning Potential", color: "from-yellow-400 to-orange-400" }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="group"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.3
              }}
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 border border-primary/30 mx-auto shadow-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Enhanced Sections with Scroll Animations */}
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection onGetStarted={handleGetStarted} isLoggingIn={isLoggingIn} />
      
      {/* Enhanced Footer */}
      <EnhancedFooter />
    </div>
  );
};

// Enhanced How It Works Section Component
const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description: "Set up your unique identity and connect your wallet in seconds",
      feature: "One-click setup with wallet integration",
      icon: Users,
      color: "from-blue-400 to-cyan-400",
      screenshot: "/images/step1-screenshot.png"
    },
    {
      number: "02", 
      title: "Join Communities",
      description: "Discover and invest in communities you're passionate about",
      feature: "Browse trending communities and buy shares",
      icon: Crown,
      color: "from-purple-400 to-pink-400",
      screenshot: "/images/step2-screenshot.png"
    },
    {
      number: "03",
      title: "Create & Earn",
      description: "Share content and earn real ETH from community reward pools",
      feature: "Monthly ETH rewards for quality content",
      icon: DollarSign,
      color: "from-green-400 to-emerald-400",
      screenshot: "/images/step3-screenshot.png"
    }
  ];

  return (
    <motion.section 
      id="how-it-works"
      ref={ref}
      className="relative z-10 py-24 px-4"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to start earning from your content
          </p>
        </motion.div>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ delay: 0.4 + index * 0.2, duration: 0.6 }}
            >
              <div className="flex-1 text-center lg:text-left">
                <motion.div 
                  className="flex items-center justify-center lg:justify-start gap-4 mb-6"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {step.number}
                  </div>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                </motion.div>

                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  {step.title}
                </h3>
                
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  {step.description}
                </p>

                <motion.div 
                  className={`inline-flex items-center gap-2 bg-gradient-to-r ${step.color} bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium border border-white/20`}
                  whileHover={{ scale: 1.05 }}
                >
                  <Check className="h-4 w-4" />
                  <span>{step.feature}</span>
                </motion.div>
              </div>
              
              <motion.div 
                className="flex-1 max-w-sm group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Mobile Phone Frame */}
                <div className="relative mx-auto w-64 h-[500px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl"></div>
                  
                  {/* Screen */}
                  <div className="relative w-full h-full bg-white dark:bg-gray-100 rounded-[2.3rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-white dark:bg-gray-100 h-8 flex items-center justify-between px-6 text-black text-xs">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                        <div className="w-6 h-3 border border-black rounded-sm">
                          <div className="w-4 h-1.5 bg-green-500 rounded-sm m-0.5"></div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-200 dark:to-gray-300">
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                          <step.icon className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-gray-800 font-medium mb-2">{step.title}</p>
                        <p className="text-xs text-gray-600">Mobile Experience</p>
                      </div>

                      {/* Step-specific overlays */}
                      {index === 2 && (
                        <div className="absolute top-16 right-4 bg-green-500/90 backdrop-blur-sm border border-green-400/50 rounded-lg px-2 py-1">
                          <div className="flex items-center gap-1 text-xs">
                            <DollarSign className="h-3 w-3 text-white" />
                            <span className="text-white font-bold">+0.5 ETH</span>
                          </div>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="absolute bottom-16 left-4 bg-purple-500/90 backdrop-blur-sm border border-purple-400/50 rounded-lg px-2 py-1">
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingUp className="h-3 w-3 text-white" />
                            <span className="text-white font-bold">+250%</span>
                          </div>
                        </div>
                      )}

                      {index === 0 && (
                        <div className="absolute top-16 left-4 bg-blue-500/90 backdrop-blur-sm border border-blue-400/50 rounded-lg px-2 py-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="h-3 w-3 text-white" />
                            <span className="text-white font-bold">1.2K</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full"></div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Enhanced Features Section Component with Fixed Visibility 
const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const features = [
    {
      icon: Shield,
      title: "Censorship Resistant",
      description: "Say what you want without fear of arbitrary banning",
      color: "from-green-400 to-blue-500",
      details: "Blockchain-based content storage"
    },
    {
      icon: DollarSign,
      title: "Real ETH Rewards", 
      description: "Monthly payouts from community reward pools",
      color: "from-yellow-400 to-orange-500",
      details: "Earn up to 0.5 ETH monthly"
    },
    {
      icon: Crown,
      title: "Community Ownership",
      description: "Buy and sell shares in emerging communities",
      color: "from-purple-400 to-pink-500",
      details: "Trade community shares 24/7"
    },
    {
      icon: Wallet,
      title: "Your Content, Your Data",
      description: "True ownership with blockchain technology",
      color: "from-cyan-400 to-blue-500",
      details: "Decentralized data storage"
    }
  ];

  return (
    <motion.section 
      ref={ref}
      className="relative z-10 py-24 px-4"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Why Choose Us
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for the future of social interaction and economic opportunity
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="group"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ 
                delay: 0.4 + index * 0.1,
                duration: 0.6
              }}
              whileHover={{ 
                y: -10, 
                scale: 1.02
              }}
            >
              <div className="relative bg-gradient-to-br from-foreground/5 to-foreground/10 backdrop-blur-md border border-foreground/20 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-foreground/40 group-hover:shadow-xl">
                
                <motion.div 
                  className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </motion.div>

                <h3 className="text-xl font-bold mb-4 text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-3">
                  {feature.description}
                </p>
                
                <motion.p 
                  className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={{ y: 10 }}
                  whileHover={{ y: 0 }}
                >
                  {feature.details}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Enhanced CTA Section Component
const CTASection = ({ onGetStarted, isLoggingIn }: { onGetStarted: () => void, isLoggingIn: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.section 
      ref={ref}
      className="relative z-10 py-24 px-4"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          className="relative bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-md border border-primary/20 rounded-3xl p-12 overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-8 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
          >
            Ready to Own Your Future?
          </motion.h2>

          <motion.p 
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 }}
          >
            Join thousands building the future of social media. Where your content has value and communities reward quality.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.8 }}
          >
            <Button 
              size="lg" 
              onClick={onGetStarted}
              disabled={isLoggingIn}
              className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white dark:text-white shadow-xl px-16 py-8 text-2xl font-bold rounded-full border-2 border-white/20"
            >
              <motion.div 
                className="flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoggingIn ? (
                  <>
                    <motion.span 
                      className="mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-8 w-8" />
                    </motion.span>
                    <span>Launching Your Future...</span>
                  </>
                ) : (
                  <>
                    <span>Start Building Today</span>
                    <Rocket className="ml-4 h-8 w-8" />
                  </>
                )}
              </motion.div>
            </Button>
          </motion.div>

          <motion.p 
            className="text-sm text-muted-foreground mt-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1 }}
          >
            No credit card required • Join in seconds • Own your content forever
          </motion.p>
        </motion.div>
      </div>
    </motion.section>
  );
};

// Enhanced Footer Component with Removed Redundant Text
const EnhancedFooter = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const footerLinks = [
    { name: 'Terms', href: '/terms' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: 'https://blog.dapps.co' }
  ];

  const socialLinks = [
    { 
      name: 'Twitter', 
      href: 'https://twitter.com/dapps_co', 
      icon: Twitter,
      color: 'hover:text-blue-400'
    },
    { 
      name: 'GitHub', 
      href: 'https://github.com/dapps-co', 
      icon: Github,
      color: 'hover:text-gray-400'
    }
  ];

  return (
    <motion.footer 
      ref={ref}
      className="relative z-10 py-16 px-4 border-t border-foreground/10"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Logo and tagline */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.img 
              src="/images/logo1.png" 
              alt="dapps.co" 
              className="h-8 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Own the internet. Create communities. Earn real money.
          </p>
        </motion.div>

        {/* Links and Social */}
        <div className="flex flex-col items-center gap-8 mb-12">
          {/* Footer Links */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
          >
            {footerLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {link.name}
              </motion.a>
            ))}
          </motion.div>

          {/* Social Links */}
          <motion.div 
            className="flex items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 }}
          >
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-muted-foreground ${social.color} transition-all duration-300 p-3 rounded-full bg-foreground/5 hover:bg-foreground/10`}
                whileHover={{ 
                  scale: 1.1,
                  y: -2
                }}
                whileTap={{ scale: 0.95 }}
              >
                <social.icon className="h-5 w-5" />
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* Copyright */}
        <motion.div 
          className="text-center pt-8 border-t border-foreground/10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Built with ❤️ for the decentralized future
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Index2; 