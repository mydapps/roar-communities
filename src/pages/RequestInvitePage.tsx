
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  XIcon, 
  Send, 
  Trophy,
  ArrowUp,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2
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
}

const RequestInvitePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [inviteCode, setInviteCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
      action: () => handleCompleteTask('connect-twitter')
    },
    {
      id: 'tweet-about',
      title: 'Share on X',
      description: 'Tweet about ROAR to improve your position',
      icon: <XIcon className="h-5 w-5" />,
      cta: 'Tweet Now',
      completed: false,
      disabled: true,
      points: 25000,
      action: () => handleShareTask('twitter')
    },
    {
      id: 'quote-tweet',
      title: 'Quote Tweet',
      description: 'Quote tweet about ROAR for an additional boost',
      icon: <XIcon className="h-5 w-5" />,
      cta: 'Quote Tweet',
      completed: false,
      disabled: true,
      points: 10000,
      action: () => handleShareTask('quote-tweet')
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
    const userKey = localStorage.getItem('dapps_user_key');
    const isRegistered = localStorage.getItem('dapps_user_registered');
    
    // If no user key, clear localStorage and redirect to index
    if (!userKey) {
      localStorage.clear();
      navigate('/');
      return;
    }
    
    // If user is registered, redirect to feed
    if (isRegistered === '1') {
      navigate('/feed');
      return;
    }
    
    // Fetch invite status
    fetchInviteStatus(userKey);
  }, [navigate]);

  const fetchInviteStatus = async (userKey: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.dapps.co/request_invite_status', {
        method: 'GET',
        headers: {
          'x-user-key': userKey
        }
      });
      
      if (response.ok) {
        const data: ApiResponse = await response.json();
        
        if (data.success) {
          // Update queue position
          setQueuePosition(data.rank);
          setTotalInQueue(data.total);
          
          // Update task status
          const updatedTasks = [...tasks];
          
          // Update Twitter Connect task
          updatedTasks[0].completed = data.tasks.twitter_connect === 1;
          
          // Update Tweet task
          updatedTasks[1].completed = data.tasks.tweet === 1;
          updatedTasks[1].disabled = data.tasks.twitter_connect === 0;
          
          // Update Quote Tweet task
          updatedTasks[2].completed = data.tasks.quote_tweet === 1;
          updatedTasks[2].disabled = data.tasks.twitter_connect === 0;
          
          setTasks(updatedTasks);
        } else {
          toast.error('Failed to fetch invite status. Please try again.');
        }
      } else {
        toast.error('Failed to fetch invite status. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching invite status:', error);
      toast.error('Failed to fetch invite status. Please try again.');
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

  const handleCompleteTask = (taskId: string) => {
    // In a real implementation, this would connect to the Twitter API
    // For now, we'll just simulate it with a delay
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1 || tasks[taskIndex].completed) return;
    
    toast.info('Connecting to X account...');
    
    setTimeout(() => {
      // This would be replaced with the actual API call to connect X
      toast.success('Successfully connected X account!');
      triggerConfetti();
      
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex].completed = true;
      
      // If this is the Twitter connect task, enable the other tasks
      if (taskId === 'connect-twitter') {
        updatedTasks[1].disabled = false;
        updatedTasks[2].disabled = false;
      }
      
      setTasks(updatedTasks);
      
      // Refresh invite status
      const userKey = localStorage.getItem('dapps_user_key');
      if (userKey) {
        fetchInviteStatus(userKey);
      }
    }, 1500);
  };

  const handleShareTask = (platform: 'twitter' | 'quote-tweet') => {
    const text = "I just joined the waitlist for ROAR, a revolutionary social platform for web3 communities! Join me and get early access:";
    const url = `${window.location.origin}/invite/${generateRandomCode()}`;
    
    let taskId;
    if (platform === 'twitter') {
      taskId = 'tweet-about';
    } else {
      taskId = 'quote-tweet';
    }
    
    shareToSocialMedia('twitter', { url, text })
      .then(() => {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1 || tasks[taskIndex].completed) return;
        
        // This would be replaced with the actual API call to verify the tweet
        toast.success(`Successfully ${taskId === 'tweet-about' ? 'tweeted' : 'quote tweeted'} about ROAR!`);
        triggerConfetti();
        
        const updatedTasks = [...tasks];
        updatedTasks[taskIndex].completed = true;
        setTasks(updatedTasks);
        
        // Refresh invite status
        const userKey = localStorage.getItem('dapps_user_key');
        if (userKey) {
          fetchInviteStatus(userKey);
        }
      });
  };

  const handleSubmitInviteCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    if (inviteCode.toUpperCase() === "ABC123") {
      setTimeout(() => {
        toast.success("🚀 Invite code accepted! Welcome to ROAR!");
        triggerConfetti();
        
        setShowStories(true);
        setIsSubmitting(false);
      }, 1000);
    } else {
      setTimeout(() => {
        setErrorMessage(getRandomWittyResponse());
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading your invite status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in">
          <div className="text-center mb-8">
            <img 
              src="https://dapps.co/logo1.png" 
              alt="Dapps.co Logo" 
              className="h-16 md:h-20 mb-6 mx-auto animate-scale-in hover:scale-105 transition-transform duration-300"
            />
            <h1 className="text-3xl md:text-4xl font-bold mb-2">You're Almost There!</h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Complete these tasks to get early access to ROAR.
            </p>
          </div>

          <Card className="mb-8 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10 p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Your Current Position</h2>
              <div className="flex items-center justify-center">
                <User className="h-6 w-6 mr-2 text-muted-foreground" />
                <div className="text-4xl font-bold">
                  #{queuePosition.toLocaleString()}
                </div>
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground">
                Out of {totalInQueue.toLocaleString()} people in the queue
              </div>
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
                    <Label htmlFor="inviteCode">Enter your invite code</Label>
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
                    {isSubmitting ? 'Verifying...' : 'Activate Code'}
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
                      disabled={task.completed || task.disabled}
                      onClick={task.action}
                    >
                      {task.completed ? (
                        <span className="flex items-center">
                          <Check className="h-4 w-4 mr-2" /> Completed
                        </span>
                      ) : task.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
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
