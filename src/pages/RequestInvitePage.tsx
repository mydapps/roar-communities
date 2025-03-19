import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  XIcon, 
  Facebook, 
  Send, 
  Zap,
  Gift,
  Trophy,
  ArrowUp,
  User,
  CheckCircle2,
  AlertCircle
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
  action: () => void;
}

const RequestInvitePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [inviteCode, setInviteCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [queuePosition, setQueuePosition] = useState(75768);
  const [originalPosition, setOriginalPosition] = useState(75768);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'connect-twitter',
      title: 'Connect X Account',
      description: 'Connect your X account to jump 15,000 positions in the queue',
      icon: <XIcon className="h-5 w-5" />,
      cta: 'Connect X',
      completed: false,
      points: 15000,
      action: () => handleCompleteTask('connect-twitter')
    },
    {
      id: 'tweet-about',
      title: 'Share on X',
      description: 'Tweet about ROAR to jump 25,000 positions in the queue',
      icon: <XIcon className="h-5 w-5" />,
      cta: 'Tweet Now',
      completed: false,
      points: 25000,
      action: () => handleShareTask('twitter')
    },
    {
      id: 'share-facebook',
      title: 'Share on Facebook',
      description: 'Share ROAR with your Facebook friends to jump 10,000 positions',
      icon: <Facebook className="h-5 w-5" />,
      cta: 'Share',
      completed: false,
      points: 10000,
      action: () => handleShareTask('facebook')
    },
    {
      id: 'share-telegram',
      title: 'Share on Telegram',
      description: 'Share ROAR with your Telegram contacts to jump 8,000 positions',
      icon: <Send className="h-5 w-5" />,
      cta: 'Share',
      completed: false,
      points: 8000,
      action: () => handleShareTask('telegram')
    },
    {
      id: 'share-farcaster',
      title: 'Share on Farcaster',
      description: 'Cast about ROAR to jump 20,000 positions in the queue',
      icon: <Zap className="h-5 w-5" />,
      cta: 'Cast Now',
      completed: false,
      points: 20000,
      action: () => handleShareTask('farcaster')
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
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && !task.completed) {
        setTimeout(() => {
          toast.success(`🎉 You jumped ${task.points.toLocaleString()} positions in the queue!`);
          triggerConfetti();
        }, 500);
        
        setQueuePosition(current => Math.max(1, current - task.points));
        setPointsEarned(prev => prev + task.points);
        
        return { ...task, completed: true };
      }
      return task;
    }));
  };

  const handleShareTask = (platform: 'twitter' | 'facebook' | 'telegram' | 'farcaster') => {
    const text = "I just joined the waitlist for ROAR, a revolutionary social platform for web3 communities! Join me and get early access:";
    const url = `${window.location.origin}/invite/${generateRandomCode()}`;
    
    shareToSocialMedia(platform, { url, text })
      .then(() => {
        const taskId = platform === 'twitter' ? 'tweet-about' : 
                      platform === 'facebook' ? 'share-facebook' : 
                      platform === 'telegram' ? 'share-telegram' : 'share-farcaster';
                      
        handleCompleteTask(taskId);
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

  useEffect(() => {
    if (queuePosition < originalPosition) {
      const interval = setInterval(() => {
        setOriginalPosition(prev => {
          const diff = prev - queuePosition;
          const step = Math.max(1, Math.floor(diff / 10));
          return prev - step <= queuePosition ? queuePosition : prev - step;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [queuePosition, originalPosition]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-amber-500/10 rounded-full mb-4">
              <Gift className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">You're Almost There!</h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Get exclusive early access and <span className="font-semibold text-amber-500">free shares in a community</span> when you join with an invite code.
            </p>
          </div>

          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10 p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Your Current Position</h2>
              <div className="flex items-center justify-center">
                <User className="h-6 w-6 mr-2 text-muted-foreground" />
                <div className="text-4xl font-bold">
                  #{originalPosition.toLocaleString()}
                </div>
              </div>
              
              {pointsEarned > 0 && (
                <div className="mt-3 flex items-center justify-center text-green-500 font-medium">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Jumped {pointsEarned.toLocaleString()} positions!
                </div>
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
            
            <div className="grid gap-4 md:grid-cols-2">
              {tasks.map((task) => (
                <Card 
                  key={task.id} 
                  className={cn(
                    "transition-all duration-300 border overflow-hidden",
                    task.completed && "border-green-500/50 bg-green-500/5"
                  )}
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
                        +{task.points.toLocaleString()}
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
                      disabled={task.completed}
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

          <Card className="mb-8 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Supercharge Your Experience</h3>
                  <p className="text-muted-foreground">
                    Get instant access and earn free shares when you're referred by an existing member!
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="bg-white/50 dark:bg-black/50 border-amber-500/30 hover:border-amber-500/50"
                  onClick={() => setShowCodeInput(true)}
                >
                  Enter Invite Code
                </Button>
              </div>
            </CardContent>
          </Card>
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
