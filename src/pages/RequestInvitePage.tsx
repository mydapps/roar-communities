import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Check, 
  XIcon, 
  Send, 
  Trophy,
  ArrowUp,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PartyPopper,
  Unlock,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { shareToSocialMedia } from '@/utils/shareUtils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import OnboardingStories from '@/components/onboarding/OnboardingStories';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import * as apiBase from '@/utils/apiBase';

interface Task {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  cta: string;
  completed: boolean;
  points: number;
  disabled: boolean;
  action: () => void;
}

interface ApiResponse {
  success: boolean;
  rank: number;
  total: number;
  tasks: {
    twitter_connect: number;
    tweet: number;
    quote_tweet: number;
  };
  registered: number;
}

const RequestInvitePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { logout } = usePrivy();
  const [inviteCode, setInviteCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [displayQueuePosition, setDisplayQueuePosition] = useState(0);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectingTwitter, setIsConnectingTwitter] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const [checkIntervalId, setCheckIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [loadingTimeoutId, setLoadingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'connect-twitter',
      title: 'Connect X Account',
      description: 'Connect your X account to jump ahead in the queue',
      icon: <XIcon className="h-5 w-5" />,
      cta: 'Connect X',
      completed: false,
      disabled: false,
      points: 15000,
      action: () => handleConnectTwitter()
    },
    {
      id: 'tweet-about',
      title: 'Share on X',
      description: 'Tweet about dapps.co to improve your position',
      icon: <XIcon className="h-5 w-5" />,
      cta: 'Tweet Now',
      completed: false,
      disabled: true,
      points: 25000,
      action: () => handleTweet()
    },
    {
      id: 'quote-tweet',
      title: 'Quote Tweet',
      description: 'Quote tweet about dapps.co for an additional boost',
      icon: <XIcon className="h-5 w-5" />,
      cta: 'Quote Tweet',
      completed: false,
      disabled: true,
      points: 10000,
      action: () => handleQuoteTweet()
    }
  ]);

  const wittyResponses = [
    "Nice try, but that's not a golden ticket! 🎫",
    "That code is as real as unicorns with credit cards! 🦄",
    "Close, but no crypto! Try another code.",
    "Our AI says this code is from a parallel universe. Try one from this dimension!",
    "That's like trying to open a digital door with an analog key!",
    "The blockchain gods have reviewed your code and... they're still laughing.",
    "Error 404: Valid Code Not Found. But your persistence is impressive!",
    "That code expired sometime during the Jurassic period. Got a newer one?",
  ];

  useEffect(() => {
    // Check for user ID instead of API key
    const userId = localStorage.getItem('dapps_user_id'); 
    const isRegistered = localStorage.getItem('dapps_user_registered');
    const isOnboarded = localStorage.getItem('dapps_onboarded');
    
    console.log('RequestInvitePage - User registration status:', isRegistered);
    console.log('RequestInvitePage - User ID found:', !!userId);
    
    // If there's no userId, the user shouldn't be here (likely auth failed earlier)
    // Redirect to login/home page. Avoid clearing localStorage here.
    if (!userId) { 
      console.log('RequestInvitePage - No user ID found, redirecting to home');
      // localStorage.clear(); // DO NOT CLEAR LOCAL STORAGE HERE
      navigate('/');
      return;
    }
    
    const savedInviteCode = localStorage.getItem('dapps_invite_code');
    if (savedInviteCode) {
      setInviteCode(savedInviteCode);
      setShowCodeInput(true);
    }
    
    // Set a timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      // If still loading after 15 seconds, show the page anyway
      if (isLoading) {
        console.log('RequestInvitePage - Loading timeout reached, showing page');
        setIsLoading(false);
        
        // Double-check registration status before showing page
        const currentIsRegistered = localStorage.getItem('dapps_user_registered');
        const currentIsOnboarded = localStorage.getItem('dapps_onboarded');
        if (currentIsRegistered === '1') {
          if (currentIsOnboarded === '1') {
            navigate('/feed');
          } else {
            navigate('/successful-onboarding');
          }
        }
      }
    }, 15000);
    
    setLoadingTimeoutId(timeout);
    
    // Fetch status using cookie auth (no key needed)
    fetchInviteStatus(); 
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [navigate]);

  // Clean up any auth windows, intervals, and timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      if (checkIntervalId) {
        clearInterval(checkIntervalId);
      }
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
    };
  }, [authWindow, checkIntervalId, loadingTimeoutId]);

  useEffect(() => {
    if (displayQueuePosition !== queuePosition) {
      const interval = setInterval(() => {
        setDisplayQueuePosition(prev => {
          if (prev > queuePosition) {
            const step = Math.max(1, Math.ceil((prev - queuePosition) / 20));
            return Math.max(queuePosition, prev - step);
          }
          return prev;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [queuePosition, displayQueuePosition]);

  useEffect(() => {
    const allCompleted = tasks.every(task => task.completed);
    if (allCompleted && !showCelebration && tasks.length > 0) {
      setTimeout(() => {
        triggerCelebration();
      }, 1000);
    }
  }, [tasks]);

  // Removed userKey parameter, rely on cookie auth
  const fetchInviteStatus = async () => { 
    setIsLoading(true);
    try {
      // Use relative path for proxy
      const response = await fetch('/api/request_invite_status', {
        method: 'GET',
        headers: {
          // Remove x-user-key header
        },
        credentials: 'include' // Keep this for cookie auth
      });
      
      if (response.ok) {
        const data: ApiResponse = await response.json();
        
        if (data.success) {
          // Check if the API response indicates the user is now registered
          if (data.registered === 1) {
            console.log('RequestInvitePage - User is registered (API response)');
            localStorage.setItem('dapps_user_registered', '1');
            
            const isOnboarded = localStorage.getItem('dapps_onboarded');
            if (isOnboarded === '1') {
              console.log('RequestInvitePage - User is onboarded, redirecting to feed');
              navigate('/feed');
            } else {
              console.log('RequestInvitePage - User not onboarded, redirecting to onboarding');
              navigate('/successful-onboarding');
            }
            return;
          }
          
          const previousPosition = queuePosition;
          
          setQueuePosition(data.rank);
          if (previousPosition === 0) {
            setDisplayQueuePosition(data.rank);
          }
          setTotalInQueue(data.total);
          
          console.log('Queue Position (Rank):', data.rank);
          console.log('Total Users in Queue:', data.total);
          
          const updatedTasks = [...tasks];
          
          updatedTasks[0].completed = data.tasks.twitter_connect === 1;
          
          updatedTasks[1].completed = data.tasks.tweet === 1;
          updatedTasks[1].disabled = data.tasks.twitter_connect === 0;
          
          updatedTasks[2].completed = data.tasks.quote_tweet === 1;
          updatedTasks[2].disabled = data.tasks.twitter_connect === 0;
          
          setTasks(updatedTasks);
        } else {
          toast.error("Failed to fetch invite status. Please try again.");
        }
      } else {
        toast.error("Failed to fetch invite status. Please try again.");
      }
    } catch (error) {
      console.error('Error fetching invite status:', error);
      toast.error("Failed to fetch invite status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomWittyResponse = () => {
    return wittyResponses[Math.floor(Math.random() * wittyResponses.length)];
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    
    const duration = 3000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff']
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff']
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
    
    toast.success("🎉 Amazing work! You're at the top of our list! Expect your invite very soon.");
    
    setTimeout(() => setShowCelebration(false), 5000);
  };

  const handleConnectTwitter = async () => {
    // Check for user ID instead of API key
    const userId = localStorage.getItem('dapps_user_id');
    if (!userId) {
      toast.error("User not authenticated. Please sign in again.");
      return;
    }
    
    setIsConnectingTwitter(true);
    
    try {
      toast.loading("Connecting to X account...");
      
      // Use relative path for proxy
      const response = await fetch('/api/twitter_auth', {
        method: 'GET',
        headers: { 
          // Remove x-user-key header
        },
        credentials: 'include' // Keep this for cookie auth
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          if (data.url) {
            // Close any existing windows and clear intervals
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }
            if (checkIntervalId) {
              clearInterval(checkIntervalId);
            }
            
            // Open the auth URL in a new window
            const width = 600;
            const height = 600;
            const left = window.innerWidth / 2 - width / 2;
            const top = window.innerHeight / 2 - height / 2;
            const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
            
            const newWindow = window.open(data.url, '_blank', features);
            setAuthWindow(newWindow);
            
            // If window failed to open (common on some mobile browsers), redirect instead
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
              console.log("Popup blocked or not supported, redirecting to auth URL");
              window.location.href = data.url;
              return;
            }
            
            // Set up interval to check for success
            const interval = setInterval(async () => {
              try {
                // Use relative path for proxy in status check
                const statusResponse = await fetch('/api/request_invite_status', {
                  method: 'GET',
                  headers: {
                    // Remove x-user-key header
                  },
                  credentials: 'include' // Keep this for cookie auth
                });
                
                if (statusResponse.ok) {
                  const statusData: ApiResponse = await statusResponse.json();
                  
                  if (statusData.tasks.twitter_connect === 1) {
                    clearInterval(interval);
                    setCheckIntervalId(null);
                    
                    if (authWindow && !authWindow.closed) {
                      authWindow.close();
                    }
                    setAuthWindow(null);
                    
                    toast.success("Successfully connected X account!");
                    triggerConfetti();
                    
                    const updatedTasks = [...tasks];
                    updatedTasks[0].completed = true;
                    updatedTasks[1].disabled = false;
                    updatedTasks[2].disabled = false;
                    
                    setTasks(updatedTasks);
                    setIsConnectingTwitter(false);
                    
                    // Fetch status using cookie auth
                    fetchInviteStatus(); 
                  }
                }
              } catch (error) {
                console.error("Error checking Twitter connection status:", error);
              }
            }, 3000);
            
            setCheckIntervalId(interval);
            
            setTimeout(() => {
              clearInterval(interval);
              setCheckIntervalId(null);
              
              if (!tasks[0].completed) {
                setIsConnectingTwitter(false);
                toast.error("Failed to connect X account. Please try again.");
              }
            }, 120000);
          } else {
            setTimeout(() => {
              toast.success("Successfully connected X account!");
              triggerConfetti();
              
              const updatedTasks = [...tasks];
              updatedTasks[0].completed = true;
              updatedTasks[1].disabled = false;
              updatedTasks[2].disabled = false;
              
              setTasks(updatedTasks);
              setIsConnectingTwitter(false);
              
              // Fetch status using cookie auth
              fetchInviteStatus(); 
            }, 1500);
          }
        } else {
          toast.error("Failed to connect X account. Please try again.");
          setIsConnectingTwitter(false);
        }
      } else {
        toast.error("Failed to connect X account. Please try again.");
        setIsConnectingTwitter(false);
      }
    } catch (error) {
      console.error('Error connecting X account:', error);
      toast.error("Failed to connect X account. Please try again.");
      setIsConnectingTwitter(false);
    }
  };

  const handleTweet = async () => {
    // Check for user ID instead of API key
    const userId = localStorage.getItem('dapps_user_id');
    if (!userId) {
      toast.error("User not authenticated. Please sign in again.");
      return;
    }
    
    const taskIndex = tasks.findIndex(task => task.id === 'tweet-about');
    if (taskIndex === -1 || tasks[taskIndex].completed) return;
    
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex].disabled = true;
    setTasks(updatedTasks);
    
    try {
      toast.loading("Posting tweet about dapps.co...");
      
      // Use relative path for proxy
      const response = await fetch('/api/twitter_tweet', {
        method: 'POST',
        headers: {
          // Remove x-user-key header
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Keep this for cookie auth
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast.success("Successfully tweeted about dapps.co!");
          triggerConfetti();
          
          updatedTasks[taskIndex].completed = true;
          updatedTasks[taskIndex].disabled = false;
          setTasks(updatedTasks);
          
          // Fetch status using cookie auth
          fetchInviteStatus(); 
        } else {
          toast.error("Failed to post tweet. Please try again.");
          updatedTasks[taskIndex].disabled = false;
          setTasks(updatedTasks);
        }
      } else {
        toast.error("Failed to post tweet. Please try again.");
        updatedTasks[taskIndex].disabled = false;
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error posting tweet:', error);
      toast.error("Failed to post tweet. Please try again.");
      updatedTasks[taskIndex].disabled = false;
      setTasks(updatedTasks);
    }
  };

  const handleQuoteTweet = async () => {
    // Check for user ID instead of API key
    const userId = localStorage.getItem('dapps_user_id');
    if (!userId) {
      toast.error("User not authenticated. Please sign in again.");
      return;
    }
    
    const taskIndex = tasks.findIndex(task => task.id === 'quote-tweet');
    if (taskIndex === -1 || tasks[taskIndex].completed) return;
    
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex].disabled = true;
    setTasks(updatedTasks);
    
    try {
      toast.loading("Posting quote tweet about dapps.co...");
      
      // Use relative path for proxy
      const response = await fetch('/api/twitter_quote_tweet', {
        method: 'POST',
        headers: {
          // Remove x-user-key header
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Keep this for cookie auth
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast.success("Successfully quote tweeted about dapps.co!");
          triggerConfetti();
          
          updatedTasks[taskIndex].completed = true;
          updatedTasks[taskIndex].disabled = false;
          setTasks(updatedTasks);
          
          // Fetch status using cookie auth
          fetchInviteStatus(); 
        } else {
          toast.error("Failed to post quote tweet. Please try again.");
          updatedTasks[taskIndex].disabled = false;
          setTasks(updatedTasks);
        }
      } else {
        toast.error("Failed to post quote tweet. Please try again.");
        updatedTasks[taskIndex].disabled = false;
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error posting quote tweet:', error);
      toast.error("Failed to post quote tweet. Please try again.");
      updatedTasks[taskIndex].disabled = false;
      setTasks(updatedTasks);
    }
  };

  const handleShareTask = (platform: 'twitter' | 'quote-tweet') => {
    const text = "I just joined the waitlist for dapps.co, a revolutionary social platform for web3 communities! Join me and get early access:";
    const url = `${window.location.origin}/invite/${generateRandomCode()}`;
    
    shareToSocialMedia('twitter', { url, text });
  };

  const handleSubmitInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    // Check for user ID instead of API key
    const userId = localStorage.getItem('dapps_user_id');
    if (!userId) {
      toast.error("User not authenticated. Please sign in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use relative path for proxy
      const response = await fetch('/api/invite_code_submit', {
        method: 'POST',
        headers: {
          // Remove x-user-key header
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inviteCode: inviteCode }),
        credentials: 'include' // Keep this for cookie auth
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('dapps_user_registered', '1');
        // Set a flag to show the onboarding page on this session
        localStorage.setItem('dapps_show_onboarding', '1');
        
        toast.success(data.message || "Welcome to dapps.co! 🚀");
        
        triggerConfetti();
        
        setTimeout(() => {
          navigate('/successful-onboarding');
        }, 2000);
      } else {
        setErrorMessage(data.error || "Invalid invite code. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting invite code:', error);
      setErrorMessage("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out user...');
      
      await apiBase.logoutCurrentDevice();
      console.log('Logged out from current device, key invalidated');
      
      await logout();
      console.log('Logged out from Privy');
      
      console.log('Redirecting to homepage...');
      navigate('/');
      
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading your invite status...</p>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsLoading(false)}
            className="mt-4 text-muted-foreground"
          >
            Taking too long? Click here
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col items-center bg-gradient-to-b from-purple-50 via-indigo-50 to-white overflow-y-auto relative", isMobile ? 'pt-16' : 'pt-24')}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4 z-50 text-gray-500 hover:text-gray-700"
        onClick={handleLogout}
        aria-label="Logout"
      >
        <LogOut className="h-5 w-5" />
      </Button>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in">
        <div className="text-center mb-8">
          <img 
            src="/images/logo1.png" 
            alt="Dapps.co Logo" 
            className="h-10 mr-3" 
          />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">You're Almost There!</h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Complete these tasks to get early access to dapps.co.
          </p>
        </div>

        <Card className="mb-8 overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10 p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Your Current Position</h2>
            <div className="flex items-center justify-center">
              <User className="h-6 w-6 mr-2 text-muted-foreground" />
              <AnimatePresence mode="wait">
                <motion.div 
                  key={displayQueuePosition}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-4xl font-bold"
                >
                  #{displayQueuePosition.toLocaleString()}
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="mt-2 text-sm text-muted-foreground">
              Out of {totalInQueue.toLocaleString()} people in the queue
            </div>
            
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-4 p-3 bg-green-500/20 rounded-lg flex items-center justify-center text-green-600"
              >
                <PartyPopper className="h-5 w-5 mr-2" />
                <span className="font-semibold">You're at the top of our list!</span>
              </motion.div>
            )}
          </div>
          
          <CardContent className="pt-6">
            {!showCodeInput ? (
              <Button 
                variant="outline" 
                className="w-full text-base py-6" 
                onClick={() => setShowCodeInput(true)}
              >
                I have an invite code
              </Button>
            ) : (
              <form onSubmit={handleSubmitInviteCode} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inviteCode">Enter your invite code</Label>
                    {inviteCode && localStorage.getItem('dapps_invite_code') === inviteCode && (
                      <div className="flex items-center text-green-600 text-sm">
                        <Check className="h-4 w-4 mr-1" />
                        <span>Code verified</span>
                      </div>
                    )}
                  </div>
                  {errorMessage && (
                    <div className="flex items-center p-3 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm mb-2">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter code (e.g. ABC123)"
                    className={cn(
                      "text-lg py-6",
                      errorMessage && "border-red-500 focus-visible:ring-red-500"
                    )}
                    autoFocus
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full py-6 text-base"
                  disabled={isSubmitting || !inviteCode.trim()}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Unlock className="h-5 w-5 mr-2" /> Unlock Access
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Jump the Queue</h2>
            <div className="text-muted-foreground text-sm">
              Complete tasks to get ahead
            </div>
          </div>
          
          <div className="grid gap-4">
            {tasks.map((task, index) => (
              <Card 
                key={task.id} 
                className={cn(
                  "transition-all duration-300 border overflow-hidden animate-slide-up",
                  task.completed && "border-green-500/50 bg-green-500/5",
                  task.disabled && "opacity-70"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-full",
                        task.completed ? "bg-green-500/20" : "bg-secondary"
                      )}>
                        {task.completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : task.icon}
                      </div>
                      <h3 className="font-semibold">{task.title}</h3>
                    </div>
                    <div className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      Jump ahead
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4">
                    {task.description}
                  </p>
                  
                  <Button
                    variant={task.completed ? "outline" : "default"}
                    className={cn(
                      "w-full",
                      task.completed && "border-green-500 text-green-600"
                    )}
                    disabled={task.completed || task.disabled || (task.id === 'connect-twitter' && isConnectingTwitter)}
                    onClick={task.action}
                  >
                    {task.completed ? (
                      <span className="flex items-center">
                        <Check className="h-4 w-4 mr-2" /> Completed
                      </span>
                    ) : task.id === 'connect-twitter' && isConnectingTwitter ? (
                      <span className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...
                      </span>
                    ) : (
                      task.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <OnboardingStories 
        open={showStories} 
        onOpenChange={setShowStories} 
      />
    </div>
  );
};

export default RequestInvitePage;
