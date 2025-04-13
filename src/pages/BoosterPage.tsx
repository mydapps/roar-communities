import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Twitter, Users, Medal, Calendar, Clock, Link as LinkIcon, CheckCircle2, LucideIcon, Trophy, Rocket, Zap, Share2, MessageCircle, Award, ArrowRight, RefreshCw, ChevronRight, UserPlus, User, Gem, Target, Globe, Loader2, Lock, X, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { createAuthHeaders, fetchAvailableBoosters, AvailableBoostersResponse } from '@/utils/apiBase';
import { Link, useNavigate } from 'react-router-dom';
import { BoosterDetailModal } from '@/components/shared/BoosterDetailModal';
import { useEffect as useReactEffect, useLayoutEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock API data - replace with actual API implementation
const mockFetchBoosterData = async (): Promise<BoosterData> => {
  return {
    success: true,
    boosters: {
      collected_boosters: 2.5,
      available_boosters: 8.5,
      total_boosters: 11.0,
      collected_golden_boosters: 1,
      available_golden_boosters: 4,
      total_golden_boosters: 5,
      current_farming_rate: 2.5, // 1 (base) + collected boosts
      max_farming_rate: 6.0 // Maximum potential if all boosters are collected
    },
    activities: [
      // Golden boosters (permanent)
      {
        id: "connect_twitter",
        type: "golden" as const,
        title: "Connect Twitter",
        description: "Connect your Twitter account to unlock social boosters",
        boost: 1.0,
        completed: true,
        completed_on: "2023-04-10T15:30:00Z",
        icon: "Twitter",
        prerequisites: [],
        action_url: "/connect/twitter"
      },
      {
        id: "create_community",
        type: "golden" as const,
        title: "Create a Community",
        description: "Create your own thriving community",
        boost: 1.0,
        completed: false,
        icon: "Users",
        prerequisites: [],
        action_url: "/create-community"
      },
      {
        id: "verified_profile",
        type: "golden" as const,
        title: "Complete Your Profile",
        description: "Set your avatar, bio, and customize your profile",
        boost: 1.0,
        completed: false,
        icon: "User",
        prerequisites: [],
        action_url: "/edit-profile"
      },
      {
        id: "join_discord",
        type: "golden" as const,
        title: "Join Discord Community",
        description: "Connect with the wider Roar community",
        boost: 1.0,
        completed: false,
        icon: "MessageCircle",
        prerequisites: [],
        action_url: "https://discord.gg/roarcommunity"
      },
      {
        id: "enable_notifications",
        type: "golden" as const,
        title: "Enable Notifications",
        description: "Stay updated on latest activities and farming boosts",
        boost: 1.0,
        completed: false,
        icon: "Bell",
        prerequisites: [],
        action_url: "/notifications/settings"
      },
      
      // Regular boosters (single-time or repeatable)
      {
        id: "refer_friends",
        type: "regular" as const,
        title: "Invite Friends",
        description: "Invite 5 friends to join Roar",
        boost: 0.5,
        completed: true,
        completed_on: "2023-04-09T12:45:00Z",
        icon: "UserPlus",
        progress: {
          current: 5,
          target: 5
        },
        next_level: {
          id: "refer_friends_10",
          title: "Invite 10 Friends",
          boost: 0.5,
          current: 5,
          target: 10
        },
        prerequisites: [],
        action_url: "/referral"
      },
      {
        id: "daily_tweet",
        type: "regular" as const,
        title: "Daily Tweet",
        description: "Share your Roar experience on Twitter",
        boost: 0.5,
        completed: true,
        completed_on: "2023-04-12T09:15:00Z",
        icon: "Share2",
        refresh: {
          type: "daily",
          next_available: "2023-04-13T00:00:00Z"
        },
        prerequisites: ["connect_twitter"],
        action_url: "/share/twitter"
      },
      {
        id: "quote_tweet",
        type: "regular" as const,
        title: "Quote Tweet",
        description: "Quote tweet a Roar announcement post",
        boost: 0.5,
        completed: false,
        icon: "MessageCircle",
        refresh: {
          type: "weekly",
          next_available: null
        },
        prerequisites: ["connect_twitter"],
        action_url: "/share/quote-tweet"
      },
      {
        id: "daily_check_in",
        type: "regular" as const,
        title: "Daily Check-in",
        description: "Check in to the app every day",
        boost: 0.5,
        completed: false,
        streak: {
          current: 2,
          max_achieved: 5,
          multiplier: {
            threshold: 5,
            boost: 0.1
          }
        },
        icon: "Calendar",
        refresh: {
          type: "daily",
          next_available: null
        },
        prerequisites: [],
        action_url: "/check-in"
      },
      {
        id: "share_community",
        type: "regular" as const,
        title: "Share a Community",
        description: "Share your favorite community on social media",
        boost: 0.5,
        completed: false,
        icon: "Share2",
        prerequisites: [],
        action_url: "/communities"
      },
      {
        id: "first_post",
        type: "regular" as const,
        title: "Create First Post",
        description: "Create your first post in any community",
        boost: 0.5,
        completed: false,
        icon: "PenTool",
        prerequisites: [],
        action_url: "/communities"
      },
      {
        id: "buy_shares",
        type: "regular" as const,
        title: "Buy Community Shares",
        description: "Invest in community shares for the first time",
        boost: 0.5,
        completed: false,
        icon: "TrendingUp",
        prerequisites: [],
        action_url: "/communities"
      },
      {
        id: "engage_posts",
        type: "regular" as const,
        title: "Engage with 10 Posts",
        description: "Like or comment on 10 different posts",
        boost: 0.5,
        completed: false,
        progress: {
          current: 3,
          target: 10
        },
        icon: "ThumbsUp",
        prerequisites: [],
        action_url: "/feed"
      }
    ],
    // Achievements and milestones
    achievements: [
      {
        id: "early_adopter",
        title: "Early Adopter",
        description: "Joined during the beta phase",
        reward: "Special Profile Badge",
        completed: true,
        icon: "Rocket"
      },
      {
        id: "community_builder",
        title: "Community Builder",
        description: "Create a community with 50+ members",
        reward: "1.0x Golden Booster",
        completed: false,
        progress: {
          current: 12,
          target: 50
        },
        icon: "Users"
      },
      {
        id: "social_butterfly",
        title: "Social Butterfly",
        description: "Connect all available social accounts",
        reward: "0.5x Booster",
        completed: false,
        progress: {
          current: 1,
          target: 3
        },
        icon: "Globe"
      }
    ]
  };
};

// Types
interface BoosterProgressData {
  collected_boosters: number;
  available_boosters: number;
  total_boosters: number;
  collected_golden_boosters: number;
  available_golden_boosters: number;
  total_golden_boosters: number;
  current_farming_rate: number;
  max_farming_rate: number;
}

interface BoosterProgress {
  current: number;
  target: number;
}

interface NextLevel {
  id: string;
  title: string;
  boost: number;
  current: number;
  target: number;
}

interface RefreshInfo {
  type: "daily" | "weekly" | "monthly";
  next_available: string | null;
}

interface StreakInfo {
  current: number;
  max_achieved: number;
  multiplier: {
    threshold: number;
    boost: number;
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  reward: string;
  completed: boolean;
  progress?: BoosterProgress;
  icon: string;
}

interface BoosterActivity {
  id: string;
  type: "golden" | "regular";
  title: string;
  description: string;
  boost: number;
  completed: boolean;
  completed_on?: string;
  icon: string;
  progress?: BoosterProgress;
  next_level?: NextLevel;
  prerequisites: string[];
  refresh?: RefreshInfo;
  streak?: StreakInfo;
  action_url: string;
}

interface BoosterData {
  success: boolean;
  boosters: BoosterProgressData;
  activities: BoosterActivity[];
  achievements: Achievement[];
}

const getIconComponent = (iconName: string): React.ReactNode => {
  const icons: Record<string, LucideIcon> = {
    Twitter: Twitter,
    Users: Users,
    Trophy: Trophy,
    TrendingUp: Trophy,
    ThumbsUp: CheckCircle2,
    Share2: Share2,
    Rocket: Rocket,
    RefreshCw: RefreshCw,
    PenTool: Sparkles,
    MessageCircle: MessageCircle,
    Medal: Medal,
    Gift: Gift,
    Globe: Globe,
    Calendar: Calendar,
    Clock: Clock,
    Gem: Gem,
    UserPlus: UserPlus,
    User: User,
    Bell: Medal,
    Target: Target
  };

  const IconComponent = icons[iconName] || Sparkles;
  return <IconComponent className="h-5 w-5" />;
};

// Booster card component
interface BoosterCardProps {
  activity: BoosterActivity;
  onClaim: (id: string) => Promise<void>;
  isProcessing: boolean;
}

const BoosterCard: React.FC<BoosterCardProps> = ({ activity, onClaim, isProcessing }) => {
  const [claiming, setClaiming] = useState(false);
  const navigate = useNavigate();
  
  // Check if all prerequisites are met (would need to be implemented with actual data)
  const prerequisitesMet = true;
  
  const handleAction = async () => {
    if (activity.completed) return;
    
    if (activity.action_url.startsWith('http')) {
      window.open(activity.action_url, '_blank');
      return;
    }
    
    // If it's an internal link with a claim action
    if (activity.action_url === '/check-in') {
      setClaiming(true);
      await onClaim(activity.id);
      setClaiming(false);
      return;
    }
    
    // Otherwise navigate to the action page
    navigate(activity.action_url);
  };
  
  const isRefreshable = activity.refresh && activity.completed;
  const isReady = activity.refresh && activity.completed && new Date(activity.refresh.next_available || "") <= new Date();
  
  // Format the time until available
  const formatTimeUntilAvailable = () => {
    if (!activity.refresh || !activity.refresh.next_available) return '';
    
    const now = new Date();
    const available = new Date(activity.refresh.next_available);
    const diffMs = available.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Available now';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `Available in ${diffHrs}h ${diffMins}m`;
    } else {
      return `Available in ${diffMins}m`;
    }
  };
  
  return (
    <Card className={`
      overflow-hidden transition-all duration-200 hover:shadow-md
      ${activity.type === 'golden' ? 'border-yellow-200 dark:border-yellow-800/50' : 'border-blue-100 dark:border-blue-900/30'}
      ${activity.completed ? 'bg-gray-50/50 dark:bg-gray-900/20' : 'bg-white dark:bg-gray-900/10'}
    `}>
      <CardHeader className={`pb-2 ${activity.type === 'golden' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/10 dark:to-yellow-950/10' : ''}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`
              p-2 rounded-full 
              ${activity.type === 'golden' 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' 
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'}
            `}>
              {getIconComponent(activity.icon)}
            </div>
            <div>
              <CardTitle className="text-base">
                {activity.title}
                {activity.type === 'golden' && (
                  <span className="ml-2 text-yellow-500 dark:text-yellow-400 text-xs">✨ Golden</span>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {activity.description}
              </CardDescription>
            </div>
          </div>
          
          <Badge variant={activity.type === 'golden' ? 'default' : 'secondary'} className={`
            ${activity.type === 'golden' 
              ? 'bg-yellow-100 hover:bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50' 
              : 'bg-blue-50 hover:bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'}
          `}>
            +{activity.boost.toFixed(1)}x
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3 pb-3">
        {/* Progress bar for incomplete activities with progress */}
        {!activity.completed && activity.progress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Progress</span>
              <span className="font-medium">{activity.progress.current} / {activity.progress.target}</span>
            </div>
            <Progress
              value={(activity.progress.current / activity.progress.target) * 100}
              className={`h-1.5 ${activity.type === 'golden' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
            />
          </div>
        )}
        
        {/* Streak info if applicable */}
        {activity.streak && (
          <div className="flex items-center gap-1 mb-2 bg-blue-50 dark:bg-blue-900/10 p-1.5 rounded-md text-xs">
            <span className="font-medium">Streak: {activity.streak.current} days</span>
            {activity.streak.current >= activity.streak.multiplier.threshold && (
              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-blue-100 dark:bg-blue-800/30 border-blue-200 dark:border-blue-700">
                +{activity.streak.multiplier.boost.toFixed(1)}x Bonus
              </Badge>
            )}
          </div>
        )}
        
        {/* Refresh timer for repeatable actions */}
        {isRefreshable && !isReady && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Clock className="h-3 w-3" />
            <span>{formatTimeUntilAvailable()}</span>
          </div>
        )}
        
        {/* Next level information */}
        {activity.completed && activity.next_level && (
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Next level: {activity.next_level.title}</span>
              <span className="font-medium">+{activity.next_level.boost.toFixed(1)}x</span>
            </div>
            <Progress
              value={(activity.next_level.current / activity.next_level.target) * 100}
              className={`h-1.5 ${activity.type === 'golden' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        {activity.completed ? (
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span>Completed</span>
            </div>
            
            {isRefreshable && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                disabled={!isReady || claiming}
                onClick={handleAction}
              >
                {claiming ? (
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                  </motion.div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Repeat
              </Button>
            )}
            
            {activity.next_level && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={handleAction}
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        ) : (
          <Button 
            variant={activity.type === 'golden' ? 'default' : 'secondary'}
            className={`w-full ${activity.type === 'golden' 
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white' 
              : ''
            }`}
            disabled={claiming || isProcessing || !prerequisitesMet}
            onClick={handleAction}
          >
            {claiming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {prerequisitesMet ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {activity.progress ? 'Continue' : 'Claim Booster'}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Prerequisites Required
                  </>
                )}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Achievement card component
interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${achievement.completed ? 'border-green-200 dark:border-green-800/60' : 'border-purple-200 dark:border-purple-800/30'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {getIconComponent(achievement.icon)}
            </div>
            <CardTitle className="text-base">{achievement.title}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-purple-50 hover:bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200">
            {achievement.reward}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-1 ml-10">{achievement.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-3 pb-4">
        {achievement.progress && !achievement.completed && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Progress</span>
              <span className="font-medium">{achievement.progress.current} / {achievement.progress.target}</span>
            </div>
            <Progress
              value={(achievement.progress.current / achievement.progress.target) * 100}
              className="h-1.5 bg-purple-50 dark:bg-purple-900/20"
            />
          </div>
        )}
        
        {achievement.completed && (
          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            <span>Achievement Unlocked</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper component to ensure drawer renders correctly on mobile
const MobileModalRenderer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  boosterData: AvailableBoostersResponse | null;
}> = ({ isOpen, onClose, boosterData }) => {
  const isMobile = useIsMobile();
  
  // Check for drawer elements and log their state
  useReactEffect(() => {
    if (!isOpen || !isMobile) return;
    
    console.log('MobileModalRenderer: Modal opened, checking elements...');
    setTimeout(() => {
      const drawerContent = document.querySelector('.drawer-content');
      const drawerOverlay = document.querySelector('.drawer-overlay');
      
      console.log('Drawer content found:', !!drawerContent);
      console.log('Drawer overlay found:', !!drawerOverlay);
      
      if (drawerContent) {
        console.log('Drawer content display:', getComputedStyle(drawerContent).display);
        console.log('Drawer content visibility:', getComputedStyle(drawerContent).visibility);
        console.log('Drawer content z-index:', getComputedStyle(drawerContent).zIndex);
        
        // Force the drawer to be visible and positioned correctly
        (drawerContent as HTMLElement).style.display = 'flex';
        (drawerContent as HTMLElement).style.visibility = 'visible';
        (drawerContent as HTMLElement).style.zIndex = '9999';
        (drawerContent as HTMLElement).style.position = 'fixed';
        (drawerContent as HTMLElement).style.bottom = '0';
        (drawerContent as HTMLElement).style.left = '0';
        (drawerContent as HTMLElement).style.right = '0';
        (drawerContent as HTMLElement).style.transform = 'translateY(0)';
        (drawerContent as HTMLElement).style.backgroundColor = 'var(--background, white)';
        (drawerContent as HTMLElement).style.borderTopLeftRadius = '12px';
        (drawerContent as HTMLElement).style.borderTopRightRadius = '12px';
        (drawerContent as HTMLElement).style.boxShadow = '0 -4px 20px rgba(0, 0, 0, 0.15)';
        (drawerContent as HTMLElement).style.maxHeight = '80vh';
        (drawerContent as HTMLElement).style.overflowY = 'auto';
      }
      
      if (drawerOverlay) {
        console.log('Drawer overlay display:', getComputedStyle(drawerOverlay).display);
        console.log('Drawer overlay visibility:', getComputedStyle(drawerOverlay).visibility);
        console.log('Drawer overlay z-index:', getComputedStyle(drawerOverlay).zIndex);
        
        // Force the overlay to be visible
        (drawerOverlay as HTMLElement).style.display = 'block';
        (drawerOverlay as HTMLElement).style.visibility = 'visible';
        (drawerOverlay as HTMLElement).style.zIndex = '9998';
        (drawerOverlay as HTMLElement).style.opacity = '1';
        (drawerOverlay as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      }
    }, 100);
  }, [isOpen, isMobile]);
  
  if (!isMobile) return null;
  
  return isOpen ? (
    <BoosterDetailModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      boosterData={boosterData}
    />
  ) : null;
};

// Main booster page component
const BoosterPage: React.FC = () => {
  const [boosterData, setBoosterData] = useState<BoosterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const navigate = useNavigate();
  
  // State for API-based booster data (for modal)
  const [apiBoosterData, setApiBoosterData] = useState<AvailableBoostersResponse | null>(null);
  const [isLoadingApiData, setIsLoadingApiData] = useState(false);
  
  // New state for default tab value
  const [activeTab, setActiveTab] = useState<string>("golden");
  
  // Add a ref to track if we're on mobile
  const isMobileRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Update mobile detection
    isMobileRef.current = window.innerWidth <= 768;
    
    // Only hide bottom navigation, don't try to manipulate modals with CSS
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 768px) {
        .fixed.bottom-0:not([role="dialog"]), 
        nav.fixed.bottom-0, 
        nav.fixed.z-50:not([role="dialog"]),
        nav.bottom-0,
        .bottom-0:not(.md\\:hidden):not([role="dialog"]),
        [class*="navbar"][class*="bottom"],
        [class*="navigation"][class*="bottom"] {
          display: none !important;
        }
        
        body {
          overflow-x: hidden;
          padding-bottom: 0 !important;
          margin-bottom: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Fetch booster data on mount
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the mock data for the page
        const pageMockData = await mockFetchBoosterData();
        setBoosterData(pageMockData);
        
        // Also fetch the API data for the modal
        await fetchApiBoosterData();
      } catch (error) {
        console.error('Error fetching booster data:', error);
        toast.error('Failed to load booster data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      // Clean up
      if (style && style.parentNode) {
        try {
          document.head.removeChild(style);
        } catch (e) {
          console.error('Error removing style element:', e);
        }
      }
    };
  }, []);
  
  // Function to fetch API booster data for modal
  const fetchApiBoosterData = async () => {
    try {
      setIsLoadingApiData(true);
      const data = await fetchAvailableBoosters();
      if (data && data.success) {
        setApiBoosterData(data);
      }
    } catch (error) {
      console.error('Error fetching API booster data:', error);
    } finally {
      setIsLoadingApiData(false);
    }
  };
  
  const handleClaimBooster = async (boosterId: string) => {
    setIsProcessing(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Booster claimed successfully!');
      
      // Refresh data to reflect changes
      const updatedData = await mockFetchBoosterData();
      setBoosterData(updatedData);
      
      // Also refresh the API data
      await fetchApiBoosterData();
    } catch (error) {
      console.error('Error claiming booster:', error);
      toast.error('Failed to claim booster');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle booster modal click with special handling for mobile
  const handleShowBoosterModal = () => {
    console.log('handleShowBoosterModal called, isMobile:', window.innerWidth <= 768);
    
    // Force load data if needed
    if (!apiBoosterData) {
      console.log('No booster data, fetching first...');
      fetchApiBoosterData().then(() => {
        console.log('Data fetched, now opening modal');
        setShowRateModal(true);
      });
      return;
    }

    // Just open modal, our MobileModalRenderer will handle mobile-specific behavior
    console.log('Opening modal directly');
    setShowRateModal(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <Sparkles className="h-8 w-8 text-amber-500" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Loading boosters...</p>
        </div>
      </div>
    );
  }
  
  if (!boosterData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load boosters</h2>
          <p className="text-muted-foreground mb-4">Please try again later</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
  
  const { boosters, activities, achievements } = boosterData;
  
  // Filter activities by type
  const goldenBoosters = activities.filter(activity => activity.type === 'golden');
  const regularBoosters = activities.filter(activity => activity.type === 'regular');
  
  // Calculate overall completion percentage
  const totalCompleted = activities.filter(a => a.completed).length;
  const totalActivities = activities.length;
  const completionPercentage = (totalCompleted / totalActivities) * 100;
  
  return (
    <>
      <Helmet>
        <title>Booster Hub | Roar Communities</title>
      </Helmet>
      
      {/* Render desktop modal */}
      {!isMobileRef.current && (
        <BoosterDetailModal 
          open={showRateModal} 
          onOpenChange={setShowRateModal} 
          boosterData={apiBoosterData}
        />
      )}
      
      {/* Render mobile modal with our helper component */}
      <MobileModalRenderer
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        boosterData={apiBoosterData}
      />
      
      <div className="container max-w-3xl mx-auto px-4 py-6 mt-14 pb-20 overflow-x-hidden">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Link 
              to="/roar-farming"
              className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground mr-2"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Back to Farming
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Booster Hub
            </h1>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShowBoosterModal}
              className="flex items-center gap-2 bg-amber-100/60 hover:bg-amber-200/70 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-800/40 dark:text-amber-300 px-3 rounded-full border border-amber-300/30 dark:border-amber-700/30"
            >
              <span className="font-bold">{apiBoosterData ? apiBoosterData.effective_total.toFixed(1) : boosters.current_farming_rate.toFixed(1)}x</span>
              <Info className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <p className="text-muted-foreground">Complete activities to boost your farming rate</p>
        </div>
        
        {/* Completion Summary */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Completion Progress</h2>
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/30">
              {totalCompleted} / {totalActivities} Completed
            </Badge>
          </div>
          
          <Progress 
            value={completionPercentage} 
            className="h-2 bg-gray-100 dark:bg-gray-800"
          />
        </div>
        
        {/* Mobile Optimized Tabs with horizontal scroll */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <TabsList className="mb-4 bg-gray-100 dark:bg-gray-800/50 w-full md:w-auto flex justify-between min-w-[480px]">
              <TabsTrigger 
                value="golden" 
                className="flex-1 py-3 px-4 text-base data-[state=active]:bg-yellow-100 dark:data-[state=active]:bg-yellow-900/30 data-[state=active]:text-yellow-800 dark:data-[state=active]:text-yellow-300"
              >
                <Gift className="h-4 w-4 mr-2" />
                Golden Boosters
              </TabsTrigger>
              <TabsTrigger 
                value="regular" 
                className="flex-1 py-3 px-4 text-base data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-300"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Regular Boosters
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="flex-1 py-3 px-4 text-base data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-800 dark:data-[state=active]:text-purple-300"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Instructions for mobile users - improve with game design principles */}
          <div className="md:hidden bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4 border border-amber-200 dark:border-amber-800/30">
            <h3 className="font-medium flex items-center gap-2 text-amber-800 dark:text-amber-300 mb-1">
              <Sparkles className="h-4 w-4" />
              Quest Hub
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Complete these quests to level up your farming rate! Each completed task unlocks new powers.
            </p>
            
            {/* Progress indicator */}
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div 
                  key={level} 
                  className={`h-1.5 flex-1 rounded-full ${
                    level <= Math.ceil(completionPercentage / 20) 
                      ? 'bg-amber-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <div className="mt-1 text-xs text-center text-amber-600 dark:text-amber-400">
              Level {Math.ceil(completionPercentage / 20)}/5 Booster Master
            </div>
          </div>
          
          <TabsContent value="golden" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {goldenBoosters.map(booster => (
                <motion.div
                  key={booster.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BoosterCard 
                    activity={booster} 
                    onClaim={handleClaimBooster}
                    isProcessing={isProcessing}
                  />
                </motion.div>
              ))}
              
              {/* Link to explore regular boosters */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Button 
                  variant="outline" 
                  className="w-full py-6 border-dashed border-2 border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/20 group transition-all duration-300"
                  onClick={() => setActiveTab("regular")}
                >
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800/30 group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-center">Explore Regular Boosters</span>
                    <div className="px-2 py-0.5 mt-1 rounded-full bg-blue-100/80 dark:bg-blue-800/30 text-xs text-blue-700 dark:text-blue-300">
                      {regularBoosters.filter(b => b.completed).length}/{regularBoosters.length} completed
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="regular" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {regularBoosters.map((booster, index) => (
                <motion.div
                  key={booster.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <BoosterCard 
                    activity={booster} 
                    onClaim={handleClaimBooster}
                    isProcessing={isProcessing}
                  />
                </motion.div>
              ))}
              
              {/* Link to explore achievements */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Button 
                  variant="outline" 
                  className="w-full py-6 border-dashed border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/20 group transition-all duration-300"
                  onClick={() => setActiveTab("achievements")}
                >
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-800/30 group-hover:scale-110 transition-transform duration-300">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <span className="text-center">View Your Achievements</span>
                    <div className="px-2 py-0.5 mt-1 rounded-full bg-purple-100/80 dark:bg-purple-800/30 text-xs text-purple-700 dark:text-purple-300">
                      {achievements.filter(a => a.completed).length}/{achievements.length} unlocked
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <AchievementCard key={achievement.id} achievement={achievement} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Fixed action button for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-gray-200 dark:border-gray-800 shadow-lg z-50">
          <Button 
            onClick={() => navigate('/roar-farming')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Return to Farming
          </Button>
        </div>
      </div>
    </>
  );
};

export default BoosterPage; 