import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, DollarSign, Shield, Sparkles, Rocket, ExternalLink, Apple, Smartphone, CheckCircle, TrendingUp, Coins, Zap, Github, Twitter, Globe } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, useInView } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useDevice } from '@/components/providers/DeviceProvider';
import MobileAppLanding from '@/components/onboarding/MobileAppLanding';
import { useTheme } from '@/contexts/ThemeContext';

const Index3 = () => {
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
  const { theme } = useTheme();

  const isInviteRoute = location.pathname.includes('/invite/');

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

  // Set static waitlist count (API endpoint not available)
  useEffect(() => {
    // Use static count based on actual waitlist data
    setTotalWaitlist(89000);
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
  const pageDescription = 'The first social platform where you own your content, invest in communities, and earn real ETH. Join the revolution.';

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      {/* Header */}
      <Header 
        totalWaitlist={totalWaitlist}
        onGetStarted={handleGetStarted}
        isLoggingIn={isLoggingIn}
        isMobile={isMobile}
      />

      {/* Invite Message */}
      {showInviteMessage && referrerHandle && (
        <InviteMessage 
          referrerHandle={referrerHandle}
          referrerAvatar={referrerAvatar}
        />
      )}

      {/* Hero Section */}
      <HeroSection 
        onGetStarted={handleGetStarted}
        isLoggingIn={isLoggingIn}
        hasInvite={showInviteMessage}
      />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CTASection 
        onGetStarted={handleGetStarted}
        isLoggingIn={isLoggingIn}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

// Header Component
const Header = ({ totalWaitlist, onGetStarted, isLoggingIn, isMobile }: {
  totalWaitlist: number | null;
  onGetStarted: () => void;
  isLoggingIn: boolean;
  isMobile: boolean;
}) => {
  return (
    <motion.header 
      className="relative z-50 px-6 py-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/images/logo1.png" 
            alt="dapps.co" 
            className="h-10 w-auto"
          />
        </div>
        
        <div className="flex items-center gap-4">
          {/* Mobile App Links */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://apps.apple.com/app/dapps-co"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Apple className="h-4 w-4" />
              iOS
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=co.dapps.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Smartphone className="h-4 w-4" />
              Android
            </a>
          </div>

          <Button 
            onClick={isMobile ? () => window.open('https://onelink.to/n6g5k2', '_blank') : onGetStarted}
            disabled={isLoggingIn}
            size="sm"
            className="rounded-full"
          >
            {isLoggingIn ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              isMobile ? 'Get App' : 'Get Started'
            )}
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

// Invite Message Component
const InviteMessage = ({ referrerHandle, referrerAvatar }: {
  referrerHandle: string;
  referrerAvatar: string;
}) => {
  return (
    <motion.div 
      className="px-6 mb-4 md:mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="max-w-md mx-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/30 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-4"></div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-blue-200 dark:border-blue-600 shadow-md">
              <AvatarImage 
                src={referrerAvatar || `https://img.dapps.co/avatar/${referrerHandle}.svg`} 
                alt={referrerHandle} 
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-800 dark:to-purple-800 text-blue-700 dark:text-blue-300 text-sm font-medium">
                {referrerHandle.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
              <span className="font-semibold text-blue-600 dark:text-blue-400">@{referrerHandle}</span> invited you to join{' '}
              <span className="font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">dapps.co</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">500 🦁 bonus</span>
              </div>
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Skip waitlist</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Hero Section Component
const HeroSection = ({ onGetStarted, isLoggingIn, hasInvite = false }: {
  onGetStarted: () => void;
  isLoggingIn: boolean;
  hasInvite?: boolean;
}) => {
  // Fixed spacing to prevent desktop overlap
  const sectionClass = hasInvite 
    ? "relative px-4 md:px-6 py-6 md:py-20 overflow-hidden min-h-[80vh] md:min-h-[85vh] flex items-center pb-16 md:pb-24"
    : "relative px-4 md:px-6 py-8 md:py-32 overflow-hidden min-h-screen flex items-center pb-16 md:pb-32";

  return (
    <section className={sectionClass}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-400 to-green-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
        <motion.h1 
          className={`${hasInvite ? 'text-4xl sm:text-5xl md:text-5xl lg:text-6xl' : 'text-6xl sm:text-7xl md:text-6xl lg:text-7xl'} font-bold mb-4 sm:mb-6 md:mb-8 leading-tight`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Own the
          <br />
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
            Internet
          </span>
        </motion.h1>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <motion.p 
          className={`${hasInvite ? 'text-base sm:text-lg md:text-xl' : 'text-xl sm:text-2xl md:text-xl lg:text-2xl'} text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-2 md:px-0`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          The first social platform where you{' '}
          <span className="text-foreground font-semibold">own your content</span>,{' '}
          <span className="text-foreground font-semibold">invest in communities</span>, and{' '}
          <span className="text-foreground font-semibold">earn real ETH</span>.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-8 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button 
            size="lg" 
            onClick={onGetStarted}
            disabled={isLoggingIn}
            className={`${hasInvite ? 'px-8 py-4 text-base' : 'px-10 py-5 text-lg'} md:px-10 md:py-5 md:text-lg font-semibold rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl w-full sm:w-auto`}
          >
            {isLoggingIn ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Join Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <a 
            href="#features" 
            className={`text-muted-foreground hover:text-foreground transition-colors px-6 md:px-6 py-3 md:py-4 ${hasInvite ? 'text-base' : 'text-lg'} md:text-lg font-medium rounded-full hover:bg-muted/20 flex items-center gap-2 group`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            See how it works
            <motion.span
              animate={{
                y: [0, 3, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-base group-hover:text-foreground"
            >
              👇
            </motion.span>
          </a>
        </motion.div>

        {/* Stats - Hidden on mobile */}
        <motion.div 
          className={`hidden md:grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto ${hasInvite ? 'mt-8' : 'mt-16'}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { 
              icon: Users, 
              value: "89K+", 
              label: "Users in waitlist",
              description: "The brightest minds in web3 ready to revolutionize social",
              gradient: "from-blue-500 to-purple-500"
            },
            { 
              icon: Shield, 
              value: "100%", 
              label: "Decentralized ownership",
              description: "Your content, your rules. No platform can silence you.",
              gradient: "from-green-500 to-emerald-500"
            },
            { 
              icon: Zap, 
              value: "Real", 
              label: "ETH rewards",
              description: "Quality content earns cryptocurrency, not just likes",
              gradient: "from-yellow-500 to-orange-500"
            }
          ].map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center group cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.gradient} mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-lg font-semibold text-foreground mb-2">{stat.label}</div>
              <div className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{stat.description}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: Coins,
      title: "Invest in Communities",
      description: "Buy and sell community shares like stocks. Early investors earn more as communities grow.",
      screenshot: "community-investing",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: DollarSign,
      title: "Earn Real ETH",
      description: "Get paid monthly from community reward pools. Quality content = real money.",
      screenshot: "eth-rewards",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Speak Without Fear",
      description: "Own your voice forever. Your thoughts and ideas become permanent digital assets that no one can delete or silence.",
      screenshot: "censorship-resistance",
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <section id="features" className="relative px-6 py-20 bg-gradient-to-b from-background to-muted/20">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How it works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple concepts that change everything about social media
          </p>
        </motion.div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              feature={feature}
              isReversed={index % 2 === 1}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Feature Card Component
const FeatureCard = ({ feature, isReversed, index }: {
  feature: any;
  isReversed: boolean;
  index: number;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div 
      ref={ref}
      className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ delay: index * 0.2, duration: 0.8 }}
    >
      {/* Content */}
      <div className="flex-1 text-center lg:text-left max-w-lg">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 shadow-lg`}>
          <feature.icon className="h-8 w-8 text-white" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold mb-4">
          {feature.title}
        </h3>
        
        <p className="text-lg text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Premium Mobile Mockup */}
      <div className="flex-1 w-full max-w-md mx-auto">
        <motion.div 
          className="relative"
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
        >
          {/* Subtle ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-[3rem] blur-3xl scale-110"></div>
          
          {/* Clean iPhone Frame */}
          <div className="relative w-64 h-[520px] mx-auto bg-gradient-to-b from-gray-900 to-black rounded-[3rem] shadow-2xl border border-gray-800">
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
            
            {/* Screen */}
            <div className="absolute inset-3 bg-white dark:bg-gray-950 rounded-[2.5rem] overflow-hidden">
              {/* Clean Status Bar */}
              <div className="h-12 bg-white dark:bg-gray-950 flex items-center justify-between px-6 pt-8">
                <span className="text-gray-900 dark:text-white text-sm font-medium">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                  <div className="w-6 h-3 border border-gray-300 dark:border-gray-600 rounded-sm">
                    <div className="w-4 h-1 bg-green-500 rounded-sm m-0.5"></div>
                  </div>
                </div>
              </div>

              {/* App Content */}
              <div className="px-4 py-2 bg-white dark:bg-gray-950 h-full">
                
                {/* Feature 1: Communities Discovery */}
                {index === 0 && (
                  <div className="space-y-4">
                    {/* Header with dapps icon */}
                    <div className="flex items-center gap-3 mb-6">
                      <img src="/dapps.png" alt="dapps" className="w-8 h-8 rounded-lg" />
                      <span className="text-gray-900 dark:text-white font-semibold">Communities</span>
                    </div>
                    
                    {/* Featured Community with Performance Graph */}
                    <motion.div 
                      className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">AI</span>
                        </div>
                        <div>
                          <div className="text-gray-900 dark:text-white font-semibold">AI Builders</div>
                          <div className="text-green-600 text-xs font-medium">+47% this week</div>
                        </div>
                      </div>
                      
                      {/* Mini Performance Graph */}
                      <div className="h-12 bg-white dark:bg-gray-800 rounded-lg mb-3 flex items-end justify-between px-2 py-1">
                        {[40, 55, 45, 70, 65, 85, 95].map((height, i) => (
                          <motion.div
                            key={i}
                            className="bg-gradient-to-t from-green-400 to-emerald-500 w-2 rounded-sm"
                            style={{ height: `${height}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                          />
                        ))}
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>7 days ago</span>
                        <span>Today</span>
                      </div>
                    </motion.div>
                    
                    {/* Other Communities */}
                    <div className="space-y-2">
                      {[
                        { name: 'DeFi Traders', members: '890', growth: '+23%', color: 'from-blue-400 to-blue-600' },
                        { name: 'NFT Artists', members: '1.4K', growth: '+12%', color: 'from-purple-400 to-pink-500' }
                      ].map((community, i) => (
                        <motion.div 
                          key={i}
                          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 + 0.8, duration: 0.4 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${community.color} flex items-center justify-center`}>
                                <span className="text-white text-xs font-bold">{community.name[0]}</span>
                              </div>
                              <div>
                                <div className="text-gray-900 dark:text-white font-medium text-sm">{community.name}</div>
                                <div className="text-gray-500 text-xs">{community.members} members</div>
                              </div>
                            </div>
                            <div className="text-green-600 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                              {community.growth}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Create Community Button with Pulse */}
                    <motion.button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-medium shadow-lg"
                      animate={{ boxShadow: ['0 4px 14px rgba(59, 130, 246, 0.3)', '0 4px 20px rgba(59, 130, 246, 0.5)', '0 4px 14px rgba(59, 130, 246, 0.3)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Create Community
                    </motion.button>
                  </div>
                )}
                
                {/* Feature 2: Real Earnings */}
                {index === 1 && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-gray-900 dark:text-white font-semibold">My Earnings</span>
                      <div className="text-green-500 text-sm font-medium">+24% today</div>
                    </div>
                    
                    {/* Main Earnings Card with Counter Animation */}
                    <motion.div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white relative overflow-hidden"
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <div className="relative z-10">
                        <div className="text-2xl font-bold mb-1">
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            0.
                          </motion.span>
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                          >
                            847
                          </motion.span>
                          <span className="text-lg ml-1">ETH</span>
                        </div>
                        <div className="text-green-100 text-sm">This Month</div>
                      </div>
                      {/* Floating coins animation */}
                      <motion.div
                        className="absolute top-2 right-2 text-yellow-300 text-lg"
                        animate={{ y: [-2, -8, -2], rotate: [0, 5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        💰
                      </motion.div>
                    </motion.div>
                    
                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-800">
                        <motion.div 
                          className="text-gray-900 dark:text-white font-bold text-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8, type: "spring" }}
                        >
                          47
                        </motion.div>
                        <div className="text-gray-500 text-xs">Quality Posts</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-800">
                        <motion.div 
                          className="text-gray-900 dark:text-white font-bold text-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1, type: "spring" }}
                        >
                          12
                        </motion.div>
                        <div className="text-gray-500 text-xs">Shares Owned</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Feature 3: Secure Content */}
                {index === 2 && (
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-gray-900 dark:text-white font-semibold">My Content</span>
                      <div className="flex items-center gap-1 text-green-500 text-xs bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                        <Shield className="w-3 h-3" />
                        <span>Secured</span>
                      </div>
                    </div>
                    
                    {/* Text Post */}
                    <motion.div 
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-start gap-2">
                        <img 
                          src="https://img.dapps.co/avatar/builder123.svg" 
                          alt="User avatar" 
                          className="w-7 h-7 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 dark:text-white text-xs mb-2 line-clamp-2">Building the future of decentralized social media! 🚀</div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <motion.div 
                              className="flex items-center gap-1"
                              whileHover={{ scale: 1.1 }}
                            >
                              <span className="text-orange-500 text-xs">🦁</span>
                              <motion.span 
                                className="text-orange-500 font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                              >
                                47
                              </motion.span>
                            </motion.div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-xs">💬</span>
                              <span className="text-gray-500 font-medium text-xs">12</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Image Post */}
                    <motion.div 
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-start gap-2">
                        <img 
                          src="https://img.dapps.co/avatar/nftcreate.svg" 
                          alt="User avatar" 
                          className="w-7 h-7 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 dark:text-white text-xs mb-2">Amazing NFT collection! 🎨</div>
                          {/* Compact Mock Image */}
                          <div className="w-full h-12 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-lg mb-2 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">🎨</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <motion.div 
                              className="flex items-center gap-1"
                              whileHover={{ scale: 1.1 }}
                            >
                              <span className="text-orange-500 text-xs">🦁</span>
                              <motion.span 
                                className="text-orange-500 font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                              >
                                89
                              </motion.span>
                            </motion.div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-xs">💬</span>
                              <span className="text-gray-500 font-medium text-xs">24</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Third Post */}
                    <motion.div 
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="flex items-start gap-2">
                        <img 
                          src="https://img.dapps.co/avatar/defitrader.svg" 
                          alt="User avatar" 
                          className="w-7 h-7 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 dark:text-white text-xs mb-2">Just earned 0.5 ETH from community rewards! 💰</div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <motion.div 
                              className="flex items-center gap-1"
                              whileHover={{ scale: 1.1 }}
                            >
                              <span className="text-orange-500 text-xs">🦁</span>
                              <motion.span 
                                className="text-orange-500 font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                              >
                                156
                              </motion.span>
                            </motion.div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-xs">💬</span>
                              <span className="text-gray-500 font-medium text-xs">31</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Partial Fourth Post (to show more content) */}
                    <motion.div 
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 opacity-60"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <div className="flex items-start gap-2">
                        <img 
                          src="https://img.dapps.co/avatar/creator999.svg" 
                          alt="User avatar" 
                          className="w-7 h-7 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 dark:text-white text-xs mb-2">Who else is excited about the future of...</div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <span className="text-orange-500 text-xs">🦁</span>
                              <span className="text-orange-500 font-medium">23</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-xs">💬</span>
                              <span className="text-gray-500 font-medium text-xs">8</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* IPFS Security Badge */}
                    <motion.div 
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 border border-blue-200 dark:border-blue-800"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.1 }}
                    >
                      <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <Shield className="w-3 h-3" />
                        </motion.div>
                        <span className="text-xs font-medium">Powered by IPFS</span>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full"></div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// CTA Section Component
const CTASection = ({ onGetStarted, isLoggingIn }: {
  onGetStarted: () => void;
  isLoggingIn: boolean;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.section 
      ref={ref}
      className="relative px-6 py-20 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent"></div>
      
      {/* Animated orbs */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/2 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-2xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to invest in communities that matter?
        </h2>
        
        <p className="text-xl text-muted-foreground mb-8">
          Join the creators, builders, and visionaries who believe your voice deserves to be heard and rewarded.
        </p>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg" 
            onClick={onGetStarted}
            disabled={isLoggingIn}
            className="px-8 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white/20"
          >
            {isLoggingIn ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Join Now
                <Rocket className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>

        <p className="text-sm text-muted-foreground mt-6">
          No credit card required • Join in seconds
        </p>
      </div>
    </motion.section>
  );
};

// Footer Component
const Footer = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  const links = [
    { name: 'Terms', href: '/terms' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Contact', href: '/contact' }
  ];

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/mydapps', icon: Github },
    { name: 'X', href: 'https://x.com/dapps_co', icon: Twitter },
    { name: 'Blog', href: 'https://mirror.xyz/dapps-co.eth', icon: Globe }
  ];

  return (
    <motion.footer 
      ref={ref}
      className="px-6 py-12 border-t border-border/50"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo1.png" 
              alt="dapps.co" 
              className="h-8 w-auto"
            />
          </div>

          <div className="flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </a>
            ))}
            
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border/50">
              {socialLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={link.name}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} dapps.co. Built for the decentralized future.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Index3; 