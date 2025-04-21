import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, ArrowRight, Zap, Trophy, Check, MessageCircle } from 'lucide-react';
import { useTitle } from '@/hooks/useTitle';
import { toast } from 'sonner';

interface Reward {
  community: string;
  amount: number;
  created_at: string;
}

interface ReferralRewards {
  success: boolean;
  referrer: string;
  rewards: Reward[];
  total_rewards: number;
}

// This component creates a fullscreen layout without navbar or sidebar
const FullScreenLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, top: 0 }}>
      {children}
    </div>
  );
};

const SuccessfulOnboarding: React.FC = () => {
  useTitle('Welcome to Dapps.co');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rewardsData, setRewardsData] = useState<ReferralRewards | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const userKey = localStorage.getItem('dapps_user_key');
  
  // Story content
  const stories = [
    {
      title: "Welcome to Dapps.co! 🎉",
      content: "You're now part of a truly censorship-resistant social platform where your voice matters."
    },
    {
      title: "You've received 500 🦁",
      content: "Roars are your way to express appreciation for content. Use them to support quality posts and engage with the community."
    },
    {
      title: "Express yourself freely",
      content: "Speak without fear of being arbitrarily banned. Your account and content are truly yours."
    },
    {
      title: "Earn real ETH rewards",
      content: "Each community has its own reward pool. Create quality content and earn monthly from these pools."
    },
    {
      title: "Invest in communities",
      content: "Community shares are a new asset class. Buy shares in communities you believe in and watch your investments grow."
    }
  ];

  // Fetch referral rewards data
  useEffect(() => {
    const fetchRewards = async () => {
      if (!userKey) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch('/api/referral_rewards', {
          headers: {
            'x-user-key': userKey
          },
          credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
          setRewardsData(data);
        } else {
          console.error('Failed to fetch rewards data:', data);
        }
      } catch (error) {
        console.error('Error fetching rewards:', error);
        toast.error('Something went wrong fetching your rewards');
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [userKey, navigate]);

  // Handle story progression
  useEffect(() => {
    if (storyIndex < stories.length) {
      const timer = setInterval(() => {
        if (storyProgress < 100) {
          setStoryProgress(prev => prev + 0.5);
        } else {
          setStoryProgress(0);
          setStoryIndex(prev => Math.min(prev + 1, stories.length - 1));
        }
      }, 50);
      
      return () => clearInterval(timer);
    }
  }, [storyIndex, storyProgress, stories.length]);

  // Handle click to advance story
  const handleStoryClick = (direction: 'left' | 'right') => {
    if (direction === 'left' && storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setStoryProgress(0);
    } else if (direction === 'right' && storyIndex < stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setStoryProgress(0);
    }
  };

  // Continue to feed
  const continueToFeed = () => {
    // Mark user as onboarded and remove the show onboarding flag
    localStorage.setItem('dapps_onboarded', '1');
    localStorage.removeItem('dapps_show_onboarding');
    navigate('/feed');
  };

  return (
    <FullScreenLayout>
      <div className="flex-1 flex flex-col bg-background">
        {/* Dynamic background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background overflow-hidden z-0">
          <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl"></div>
          <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl"></div>
        </div>

        <div className="container max-w-lg mx-auto px-4 py-6 pt-8 relative z-10 flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  },
                  scale: {
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                }}
                className="text-primary mb-4"
              >
                <Sparkles className="h-12 w-12" />
              </motion.div>
              <p className="text-lg text-muted-foreground">Loading your rewards...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col flex-1"
            >
              {/* Onboarding Card */}
              <Card className="w-full mb-4 overflow-hidden border-primary/20 shadow-xl relative bg-background/80 backdrop-blur-md flex-1 flex flex-col">
                {/* Story Progress Bar */}
                <div className="w-full px-2 pt-2 flex gap-1">
                  {stories.map((_, i) => (
                    <div 
                      key={i} 
                      className="h-1 rounded-full flex-1 bg-muted overflow-hidden"
                    >
                      {i === storyIndex && (
                        <motion.div 
                          className="h-full bg-primary" 
                          style={{ width: `${storyProgress}%` }}
                        />
                      )}
                      {i < storyIndex && (
                        <div className="h-full w-full bg-primary" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Story Navigation Areas */}
                <div className="absolute top-8 bottom-0 left-0 w-1/4 z-10" onClick={() => handleStoryClick('left')} />
                <div className="absolute top-8 bottom-0 right-0 w-1/4 z-10" onClick={() => handleStoryClick('right')} />
                
                {/* Add visible navigation arrows */}
                {storyIndex > 0 && (
                  <motion.div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-primary/10 hover:bg-primary/20 rounded-full p-2 cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStoryClick('left')}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="h-6 w-6 text-primary transform rotate-180" />
                  </motion.div>
                )}
                
                {storyIndex < stories.length - 1 && (
                  <motion.div 
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-primary/10 hover:bg-primary/20 rounded-full p-2 cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStoryClick('right')}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </motion.div>
                )}

                <CardContent className="p-4 pt-6 flex-1 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={storyIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      {storyIndex === 0 && (
                        <div className="flex flex-col items-center">
                          <motion.div 
                            className="mb-6"
                            animate={{ 
                              scale: [1, 1.1, 1],
                              rotateZ: [0, -5, 5, 0]
                            }}
                            transition={{ 
                              duration: 5,
                              repeat: Infinity,
                            }}
                          >
                            <img 
                              src="/images/logo1.png" 
                              alt="Dapps.co Logo" 
                              className="h-10 mr-3"
                            />
                          </motion.div>
                          <h1 className="text-2xl md:text-3xl font-bold mb-6">Welcome to Dapps.co!</h1>
                          <p className="text-lg text-muted-foreground mb-6">
                            You're now part of a truly censorship-resistant social platform where your voice matters.
                          </p>
                          <div className="w-full flex justify-center mb-6">
                            <div className="bg-[#31bcc3]/10 p-4 rounded-lg border border-[#31bcc3]/30 max-w-[250px]">
                              <p className="text-sm text-center mb-2 font-medium">Tap left/right to navigate</p>
                              <div className="flex justify-between text-[#31bcc3]">
                                <ArrowRight className="h-4 w-4 transform rotate-180" />
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {storyIndex === 1 && (
                        <div className="flex flex-col items-center">
                          <motion.div 
                            className="mb-6 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                            animate={{ 
                              boxShadow: [
                                '0 0 0 0px rgba(49, 188, 195, 0.2)', 
                                '0 0 0 15px rgba(49, 188, 195, 0)'
                              ],
                            }}
                            transition={{ 
                              repeat: Infinity,
                              duration: 2,
                            }}
                          >
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                              }}
                              transition={{ 
                                repeat: Infinity,
                                duration: 1.5,
                              }}
                            >
                              <span className="text-5xl">🦁</span>
                            </motion.div>
                          </motion.div>
                          <h1 className="text-2xl md:text-3xl font-bold mb-4">You've received 500 🦁</h1>
                          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-6">
                            <p className="text-primary font-bold text-xl">+ 500 🦁</p>
                          </div>
                          <p className="text-lg text-muted-foreground">
                            Use roars to express appreciation for content and engage with the community.
                          </p>
                        </div>
                      )}

                      {storyIndex === 2 && (
                        <div className="flex flex-col items-center">
                          <motion.div 
                            className="mb-6 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ 
                              repeat: Infinity,
                              duration: 2,
                            }}
                          >
                            <MessageCircle className="h-12 w-12 text-primary" />
                          </motion.div>
                          <h1 className="text-2xl md:text-3xl font-bold mb-4">Express yourself freely</h1>
                          <p className="text-lg text-muted-foreground mb-6">
                            Speak without fear of being arbitrarily banned. Your account and content are truly yours.
                          </p>
                          <div className="flex flex-col gap-3 w-full max-w-xs">
                            <div className="flex items-center gap-2 bg-primary/5 px-4 py-2.5 rounded-full text-sm">
                              <Check className="h-5 w-5 text-primary" />
                              <span>No arbitrary banning</span>
                            </div>
                            <div className="flex items-center gap-2 bg-primary/5 px-4 py-2.5 rounded-full text-sm">
                              <Check className="h-5 w-5 text-primary" />
                              <span>No shadowbanning</span>
                            </div>
                            <div className="flex items-center gap-2 bg-primary/5 px-4 py-2.5 rounded-full text-sm">
                              <Check className="h-5 w-5 text-primary" />
                              <span>True content ownership</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {storyIndex === 3 && (
                        <div className="flex flex-col items-center">
                          <motion.div 
                            className="mb-6 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                            animate={{ 
                              rotateZ: [0, 10, -10, 0],
                            }}
                            transition={{ 
                              repeat: Infinity,
                              duration: 3,
                            }}
                          >
                            <Zap className="h-12 w-12 text-primary" />
                          </motion.div>
                          <h1 className="text-2xl md:text-3xl font-bold mb-4">Earn real ETH rewards</h1>
                          <p className="text-lg text-muted-foreground mb-6">
                            Each community has its own reward pool. Create quality content and earn monthly from these pools.
                          </p>
                          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 w-full max-w-xs">
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Quality posts</span>
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">+0.05 ETH</Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Viral content</span>
                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">+0.10 ETH</Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Community leaders</span>
                                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">+0.25 ETH</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {storyIndex === 4 && (
                        <div className="flex flex-col items-center">
                          <motion.div 
                            className="mb-6 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ 
                              repeat: Infinity,
                              duration: 2,
                            }}
                          >
                            <Trophy className="h-12 w-12 text-primary" />
                          </motion.div>
                          <h1 className="text-2xl md:text-3xl font-bold mb-4">Invest in communities</h1>
                          <p className="text-lg text-muted-foreground mb-6">
                            Community shares are a new asset class. Buy shares in communities you believe in and watch your investments grow.
                          </p>
                          {rewardsData && rewardsData.rewards.length > 0 && (
                            <div className="w-full max-w-xs">
                              <div className="mb-4 text-center">
                                <p className="text-sm text-muted-foreground">Thanks to your referrer</p>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  <Avatar className="h-6 w-6 border border-primary/20">
                                    <AvatarImage src={rewardsData.referrer.avatar} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {rewardsData.referrer.handle.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-primary">@{rewardsData.referrer.handle}</span>
                                </div>
                              </div>
                              
                              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-4">
                                <p className="text-center text-sm font-medium mb-3">You've received community shares!</p>
                                <div className="space-y-3">
                                  {rewardsData.rewards.map((reward, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 border border-primary/20">
                                        <AvatarImage src={reward.community_image} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                          {reward.community.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{reward.community}</p>
                                      </div>
                                      <Badge className="bg-primary/10 text-primary border-primary/20">
                                        {reward.amount} shares
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-primary/10 flex justify-between">
                                  <span className="text-sm font-medium">Total shares</span>
                                  <span className="font-bold text-primary">{rewardsData.total_rewards} shares</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Continue to Feed Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full mt-auto"
              >
                <Button 
                  onClick={continueToFeed}
                  className="w-full bg-gradient-to-r from-[#31bcc3] to-primary hover:from-primary hover:to-[#31bcc3] text-white py-6 text-lg"
                >
                  <motion.div 
                    className="flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <span>Continue to Feed</span>
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.span>
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </FullScreenLayout>
  );
};

export default SuccessfulOnboarding; 