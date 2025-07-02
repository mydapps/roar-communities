import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, DollarSign, Shield, Sparkles, Rocket, ExternalLink, Apple, Smartphone, CheckCircle, TrendingUp, Coins, Zap, Heart } from 'lucide-react';
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

  // Fetch waitlist count
  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        const response = await fetch('/api/waitlist_count', { credentials: 'include' });
        const data = await response.json();
        if (data.success) setTotalWaitlist(data.count);
      } catch (error) {
        console.error('Error fetching waitlist count:', error);
      }
    };
    fetchWaitlistCount();
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
const Header = ({ totalWaitlist, onGetStarted, isLoggingIn }: {
  totalWaitlist: number | null;
  onGetStarted: () => void;
  isLoggingIn: boolean;
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
            className="h-8 w-auto"
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

          {/* Waitlist Counter */}
          {totalWaitlist && (
            <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">
                {totalWaitlist.toLocaleString()} waiting
              </span>
            </div>
          )}

          <Button 
            onClick={onGetStarted}
            disabled={isLoggingIn}
            size="sm"
            className="rounded-full"
          >
            {isLoggingIn ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              'Get Started'
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
      className="px-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="max-w-lg mx-auto bg-primary/10 border border-primary/20 rounded-2xl p-6">
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
            <p className="font-medium">
              <span className="text-primary font-bold">@{referrerHandle}</span> invited you
            </p>
            <p className="text-sm text-muted-foreground">
              Skip the waitlist + get <span className="font-bold text-yellow-500">500 🦁 tokens</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Hero Section Component
const HeroSection = ({ onGetStarted, isLoggingIn }: {
  onGetStarted: () => void;
  isLoggingIn: boolean;
}) => {
  return (
    <section className="relative px-6 py-20 md:py-32 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-400 to-green-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
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
          className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
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
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button 
            size="lg" 
            onClick={onGetStarted}
            disabled={isLoggingIn}
            className="px-8 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl"
          >
            {isLoggingIn ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start Building
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <a 
            href="#features" 
            className="text-muted-foreground hover:text-foreground transition-colors px-6 py-3"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            See how it works
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { 
              icon: Users, 
              value: "75,000+", 
              label: "Builders in waitlist",
              description: "Global community ready to own the future",
              gradient: "from-blue-500 to-purple-500"
            },
            { 
              icon: TrendingUp, 
              value: "$2.5M+", 
              label: "Total community value",
              description: "Invested across 500+ communities",
              gradient: "from-green-500 to-emerald-500"
            },
            { 
              icon: Coins, 
              value: "24/7", 
              label: "Passive earning",
              description: "Your content works while you sleep",
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
      description: "Truly censorship-resistant. Your content lives on the blockchain forever.",
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
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          {/* Floating elements for visual appeal */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl"></div>
          
          {/* iPhone 15 Pro Frame */}
          <div className="relative w-64 h-[520px] mx-auto bg-gray-900 rounded-[3rem] shadow-2xl border-4 border-gray-800">
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
            
            {/* Screen */}
            <div className="absolute inset-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-[2.5rem] overflow-hidden">
              {/* Status Bar */}
              <div className="h-12 bg-white dark:bg-gray-900 flex items-center justify-between px-8 pt-8">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-900 dark:bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-900 dark:bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-900 dark:bg-white rounded-full"></div>
                  <span className="text-gray-900 dark:text-white text-sm font-medium ml-2">9:41</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                  <div className="w-6 h-3 border-2 border-gray-900 dark:border-white rounded-sm">
                    <div className="w-3 h-1 bg-green-500 rounded-sm m-0.5"></div>
                  </div>
                </div>
              </div>

              {/* App Content */}
              <div className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"></div>
                    <span className="text-gray-900 dark:text-white font-bold">dapps.co</span>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>

                {/* Feature-specific Content */}
                {index === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg">Communities</h3>
                    <div className="space-y-3">
                      {['AI Builders', 'Crypto Traders', 'Web3 Devs'].map((name, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${i === 0 ? 'from-green-400 to-green-600' : i === 1 ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-purple-600'}`}></div>
                              <div>
                                <div className="text-gray-900 dark:text-white font-medium text-sm">{name}</div>
                                <div className="text-gray-500 text-xs">{Math.floor(Math.random() * 1000) + 200} members</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-bold ${i === 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {i === 0 ? '+24%' : i === 1 ? '+12%' : '-3%'}
                              </div>
                              <div className="text-xs text-gray-500">24h</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {index === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg">Earnings</h3>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
                      <div className="text-3xl font-bold mb-2">0.847 ETH</div>
                      <div className="text-green-100 text-sm mb-4">Monthly Rewards</div>
                      <div className="flex justify-between text-sm">
                        <span>This month</span>
                        <span>+47%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="text-gray-900 dark:text-white font-bold">124</div>
                        <div className="text-gray-500 text-xs">Quality Posts</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="text-gray-900 dark:text-white font-bold">89</div>
                        <div className="text-gray-500 text-xs">Shares Owned</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {index === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg">Your Posts</h3>
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-gray-900 dark:text-white text-sm mb-1">The future of social media is here...</div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>2h ago</span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                47
                              </span>
                              <span className="flex items-center gap-1 text-green-500">
                                <Shield className="w-3 h-3" />
                                Blockchain
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Permanently stored on blockchain</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-400 rounded-full"></div>
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
          Ready to own your future?
        </h2>
        
        <p className="text-xl text-muted-foreground mb-8">
          Join thousands building the future of social media.
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
                Start Building Today
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
              className="h-6 w-auto"
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