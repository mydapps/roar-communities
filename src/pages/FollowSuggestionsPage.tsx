import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, UserPlus, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useTitle } from '@/hooks/useTitle';
import { toast } from 'sonner';
import axios from 'axios';
import { Progress } from '@/components/ui/progress';

// Types for user suggestions
interface SuggestedUser {
  id: string;
  handle: string;
  avatar: string;
  bio?: string;
  followers: number;
  following: boolean;
  isOG?: boolean;
  chickenJoke?: string;
  location?: string;
}

// This component creates a fullscreen layout without navbar or sidebar
const FullScreenLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, top: 0 }}>
      {children}
    </div>
  );
};

const FollowSuggestionsPage: React.FC = () => {
  useTitle('Find People to Follow - Dapps.co');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followedCount, setFollowedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const MIN_FOLLOWS_REQUIRED = 5;
  const USERS_PER_PAGE = 10;
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Fix: Using a proper React ref for mounted state instead of a regular ref
  const isMounted = useRef(true);
  
  useEffect(() => {
    // Set mounted to true when component mounts
    isMounted.current = true;
    console.log('Component mounted, isMounted set to true');
    
    // Only set to false when component unmounts, not on re-renders
    return () => {
      console.log('Component unmounting, isMounted set to false');
      isMounted.current = false;
    };
  }, []); // Empty dependency array ensures this only runs on mount/unmount

  // Generate fallback mock data for development
  const generateMockUsers = (pageNum: number, count: number = USERS_PER_PAGE): SuggestedUser[] => {
    console.log('Generating mock users as fallback');
    
    // Show a toast notification to inform the user we're using mock data
    if (pageNum === 1) {
      toast.info('Using mock data since API is unavailable', {
        description: 'The application is displaying mock user data for development purposes.',
        duration: 5000,
      });
    }
    
    const startIndex = (pageNum - 1) * count;
    
    return Array.from({ length: count }, (_, i) => {
      const index = startIndex + i;
      // Ensure the id is always defined and unique
      return {
        id: `mock-user-${index}`,
        handle: `user${index}`,
        avatar: `https://avatar.vercel.sh/${index}.png`,
        bio: index % 2 === 0 ? 'Building the future of web3 social' : 'Enthusiastic about decentralized communities',
        followers: Math.floor(Math.random() * 1000),
        following: false,
        isOG: index % 5 === 0,
        chickenJoke: index % 3 === 0 ? 'To get to the other blockchain' : 'Because web3 was on the other side',
        location: ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo'][index % 5]
      };
    });
  };

  // Fetch suggested users from API
  const fetchSuggestedUsers = async (pageNum: number) => {
    try {
      console.log(`Fetching suggested users for page ${pageNum}...`);
      
      // Try both API endpoints (with and without /api prefix) to handle different server configurations
      let response;
      try {
        // First try with the standard /api prefix
        response = await axios.get(`/api/profile-suggestion-signup?page=${pageNum}&limit=${USERS_PER_PAGE}`);
      } catch (e) {
        console.log('First endpoint attempt failed, trying alternative endpoint');
        try {
          // If that fails, try without the /api prefix (some configurations might use different base paths)
          response = await axios.get(`/profile-suggestion-signup?page=${pageNum}&limit=${USERS_PER_PAGE}`);
        } catch (e2) {
          console.log('Both API endpoints failed, using mock data');
          // If both fail, use mock data in development
          if (process.env.NODE_ENV !== 'production') {
            return generateMockUsers(pageNum);
          }
          throw e2; // Re-throw in production
        }
      }
      
      // Log the raw response for debugging
      console.log('API response data:', response.data);
      
      // Handle different possible response structures
      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        users = response.data.users;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
      } else {
        console.error('Unexpected API response structure:', response.data);
        toast.error('Invalid data format from API');
        
        // Use mock data in development if API returns invalid format
        if (process.env.NODE_ENV !== 'production') {
          return generateMockUsers(pageNum);
        }
        return [];
      }
      
      // If API returned empty array, use mock data in development
      if (users.length === 0 && process.env.NODE_ENV !== 'production') {
        console.log('API returned empty array, using mock data');
        return generateMockUsers(pageNum);
      }
      
      console.log(`Found ${users.length} users from API`);
      
      // Process users to normalize field names and ensure all fields exist
      users = users.map((user, index) => {
        // Ensure each user has an ID
        const processedUser = { 
          ...user,
          id: user.id || `generated-id-${Date.now()}-${index}` 
        };
        
        // Check for different field names for chicken joke answer
        // This handles variations in API response format
        if (!processedUser.chickenJoke) {
          // Try other possible field names
          processedUser.chickenJoke = 
            user.chicken_joke || 
            user.chickenJokeAnswer || 
            user.chicken_joke_answer || 
            user.jokeAnswer || 
            user.joke_answer;
          
          if (processedUser.chickenJoke) {
            console.log(`Found chicken joke for user ${user.handle || index} under alternative field name`);
          }
        }
        
        return processedUser;
      });
      
      // Log any users that have chicken jokes for debugging
      const usersWithJokes = users.filter(user => user.chickenJoke);
      console.log(`${usersWithJokes.length} out of ${users.length} users have chicken joke answers`);
      if (usersWithJokes.length > 0) {
        console.log('Sample joke:', usersWithJokes[0].handle, usersWithJokes[0].chickenJoke);
      }
      
      return users;
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      toast.error('Failed to load suggested users');
      
      // Use mock data in development if API fails
      if (process.env.NODE_ENV !== 'production') {
        return generateMockUsers(pageNum);
      }
      return [];
    }
  };

  // Add a debug function to help troubleshoot the infinite scroll
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔄 [InfiniteScroll]: ${message}`, data ? JSON.stringify(data) : '');
    }
  };

  // Initial load of suggested users
  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('dapps_user_id');
    if (!userId) {
      // Redirect to login if not logged in
      navigate('/');
      return;
    }

    // Load initial users
    const loadInitialUsers = async () => {
      setLoading(true);
      try {
        const users = await fetchSuggestedUsers(1);
        setSuggestedUsers(users);
        debugLog(`Loaded initial ${users.length} users`);
        
        // Force load more users if less than a full page
        if (users.length < USERS_PER_PAGE) {
          debugLog('Not enough users on first page, loading more');
          setTimeout(() => {
            loadMoreUsers();
          }, 500);
        }
      } catch (error) {
        console.error('Error loading initial users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialUsers();
  }, [navigate]);

  // Simplified infinite scrolling implementation
  useEffect(() => {
    debugLog(`Setting up infinite scroll observer (hasMore: ${hasMore}, loadingMore: ${loadingMore}, page: ${page})`);
    
    // Skip setup if we're already loading or there's nothing more to load
    if (!hasMore) {
      debugLog('Skipping observer setup - no more content to load');
      return;
    }
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting && !loadingMore && hasMore) {
        debugLog(`Observer target intersected (ratio: ${entry.intersectionRatio}), triggering load`);
        // Use a timeout to avoid React state batching issues
        setTimeout(() => {
          if (isMounted.current && !loadingMore && hasMore) {
            debugLog('Calling loadMoreUsers from intersection observer');
            loadMoreUsers();
          } else {
            debugLog(`Load canceled - conditions changed: mounted=${isMounted.current}, loading=${loadingMore}, hasMore=${hasMore}`);
          }
        }, 0);
      }
    };
    
    // Create a new observer with appropriate settings
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '200px', // Load when within 200px of viewport
      threshold: 0.1 // Trigger when at least 10% of the target is visible
    });
    
    // Get the current reference to the observer target
    const targetElement = observerTarget.current;
    
    if (targetElement) {
      observer.observe(targetElement);
      debugLog('Observer attached to target element');
    } else {
      console.error('❌ Scroll observer target element not found');
    }
    
    // Clean up the observer when the component unmounts or dependencies change
    return () => {
      observer.disconnect();
      debugLog('Observer disconnected');
    };
  }, [hasMore, loadingMore, page]); // Simplified dependencies

  // Simplified loadMoreUsers function
  const loadMoreUsers = async () => {
    // Double-check to prevent simultaneous calls
    if (loadingMore || !hasMore) {
      debugLog(`Prevented duplicate loadMoreUsers call: loadingMore=${loadingMore}, hasMore=${hasMore}`);
      return;
    }
    
    debugLog(`Loading more users, current page: ${page}`);
    setLoadingMore(true);
    
    try {
      const nextPage = page + 1;
      debugLog(`Fetching page ${nextPage}`);
      
      const newUsers = await fetchSuggestedUsers(nextPage);
      debugLog(`Received ${newUsers.length} new users for page ${nextPage}`);
      
      // Check if component is still mounted before updating state
      if (!isMounted.current) {
        debugLog('Component unmounted during API call, aborting update');
        return;
      }
      
      if (newUsers.length === 0) {
        debugLog('No more users available');
        setHasMore(false);
      } else {
        debugLog(`Adding ${newUsers.length} new users to the list`);
        setSuggestedUsers(prev => [...prev, ...newUsers]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more users:', error);
      toast.error('Failed to load more users');
    } finally {
      // Only update state if still mounted
      if (isMounted.current) {
        setLoadingMore(false);
        debugLog('Finished loading more users, loadingMore set to false');
      }
    }
  };

  // Add a manual reload button for testing
  const forceLoadMore = () => {
    if (!loadingMore && hasMore) {
      debugLog('Manually forcing load more');
      loadMoreUsers();
    }
  };

  const handleFollowToggle = async (user: SuggestedUser) => {
    // Ensure the user has an ID
    if (!user.id) {
      console.error('Attempted to follow/unfollow a user without an ID:', user);
      toast.error('Could not process this action');
      return;
    }
    
    try {
      // Clone the current user list
      const updatedUsers = [...suggestedUsers];
      const userIndex = updatedUsers.findIndex(u => u.id === user.id);
      
      if (userIndex === -1) {
        console.error('Could not find user in list:', user);
        return;
      }
      
      const isCurrentlyFollowing = updatedUsers[userIndex].following;
      
      // Optimistic update
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        following: !isCurrentlyFollowing,
        followers: isCurrentlyFollowing 
          ? updatedUsers[userIndex].followers - 1 
          : updatedUsers[userIndex].followers + 1
      };
      
      setSuggestedUsers(updatedUsers);
      
      // Update followed count
      setFollowedCount(prev => isCurrentlyFollowing ? prev - 1 : prev + 1);
      
      console.log(`${isCurrentlyFollowing ? 'Unfollowing' : 'Following'} user:`, user.handle);
      
      // Call real API endpoint
      if (isCurrentlyFollowing) {
        await axios.delete(`/api/follow/${user.handle}`);
      } else {
        await axios.post(`/api/follow/${user.handle}`);
      }
      
      // No toast notification since we're using progress bar instead
    } catch (error) {
      console.error(`Failed to ${user.following ? 'unfollow' : 'follow'} user:`, error);
      
      // Revert changes if API call fails
      toast.error(`Failed to ${user.following ? 'unfollow' : 'follow'} @${user.handle}`);
      
      const updatedUsers = [...suggestedUsers];
      const userIndex = updatedUsers.findIndex(u => u.id === user.id);
      
      if (userIndex !== -1) {
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          following: user.following,
          followers: user.following 
            ? updatedUsers[userIndex].followers + 1 
            : updatedUsers[userIndex].followers - 1
        };
        
        setSuggestedUsers(updatedUsers);
        setFollowedCount(prev => user.following ? prev + 1 : prev - 1);
      }
    }
  };

  const handleContinue = () => {
    localStorage.setItem('dapps_onboarded', '1');
    localStorage.removeItem('dapps_show_onboarding');
    navigate('/feed');
  };

  return (
    <FullScreenLayout>
      <div className="flex-1 flex flex-col bg-background overflow-auto">
        {/* Dynamic background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background overflow-hidden z-0">
          <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl"></div>
          <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl"></div>
        </div>

        <div className="relative flex-1 flex flex-col h-full" ref={scrollRef}>
          {/* Fixed sticky header */}
          <div className="sticky top-0 z-20 pt-6 pb-4 bg-background">
            <div className="container max-w-3xl mx-auto px-4">
              {/* Header Card */}
              <Card className="w-full overflow-hidden border-primary/20 shadow-lg bg-background/90 backdrop-blur-sm">
                <CardHeader className="relative pb-4">
                  <div className="mb-2">
                    <Progress 
                      value={(followedCount / MIN_FOLLOWS_REQUIRED) * 100} 
                      className="h-2 bg-primary/20"
                      indicatorClassName={followedCount >= MIN_FOLLOWS_REQUIRED ? "bg-green-500" : "bg-primary"}
                    />
                  </div>
                  
                  <motion.div 
                    className="absolute top-8 right-4 z-10"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    <Badge 
                      className={`${
                        followedCount >= MIN_FOLLOWS_REQUIRED 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-primary/10 text-primary border-primary/20"
                      } flex items-center gap-1 px-2.5 py-1`}
                    >
                      <Check className={`h-3 w-3 ${followedCount >= MIN_FOLLOWS_REQUIRED ? "text-green-600" : "text-primary"}`} />
                      <span className="text-xs font-medium">{followedCount}/{MIN_FOLLOWS_REQUIRED} followed</span>
                    </Badge>
                  </motion.div>
                  
                  <CardTitle className="text-2xl font-bold">Find People to Follow</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Follow at least {MIN_FOLLOWS_REQUIRED} people to get started. This will help us personalize your feed.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Main scrollable content */}
          <div className="container max-w-3xl mx-auto px-4 relative z-10 flex-1 flex flex-col">
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
                  <Users className="h-12 w-12" />
                </motion.div>
                <p className="text-lg text-muted-foreground">Finding people for you to follow...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col flex-1 pb-24"
              >
                {/* User Suggestions */}
                <div className="grid gap-4 mb-4">
                  {suggestedUsers.map((user, index) => {
                    // Verify each user has a unique ID
                    const userId = user.id || `fallback-id-${index}`;
                    return (
                      <motion.div
                        key={`user-card-${userId}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 1) }}
                      >
                        <Card className="overflow-hidden border-border/30 hover:border-primary/20 transition-colors bg-card">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <Avatar className="h-12 w-12 border border-border/20">
                                    <AvatarImage src={user.avatar} alt={user.handle} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {user.handle.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {user.isOG && (
                                    <div className="absolute -top-1 -right-1">
                                      <Badge className="bg-yellow-500/90 text-white border-0 flex items-center gap-0.5 px-1.5 py-0.5 text-[10px]">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        OG
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-card-foreground truncate">@{user.handle}</h3>
                                    {user.location && (
                                      <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-0 text-[10px]">
                                        {user.location}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {user.followers.toLocaleString()} {user.followers === 1 ? 'follower' : 'followers'}
                                  </p>
                                  {user.bio && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
                                  )}

                                  {/* Enhanced Chicken Joke Display */}
                                  {user.chickenJoke && (
                                    <div className="mt-2 bg-primary/10 rounded-md p-2 border border-primary/10">
                                      <p className="text-xs text-primary font-semibold mb-1">Why did the chicken cross the road?</p>
                                      <p className="text-sm italic">{user.chickenJoke}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <Button 
                                variant={user.following ? "outline" : "default"}
                                size="sm"
                                className={user.following ? 
                                  "border-primary/30 hover:bg-primary/5 ml-2 shrink-0" : 
                                  "bg-primary hover:bg-primary/90 ml-2 shrink-0"
                                }
                                onClick={() => handleFollowToggle(user)}
                              >
                                {user.following ? (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3.5 w-3.5" />
                                    Following
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Follow
                                  </span>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}

                  {/* Modified infinite scrolling observer target */}
                  {(hasMore || loadingMore) && (
                    <div 
                      ref={observerTarget} 
                      className="py-8 flex justify-center items-center my-4"
                      id="scroll-observer-target"
                      style={{ minHeight: '150px' }} // Increased height for better visibility
                    >
                      {loadingMore ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-primary font-medium">Loading more users...</p>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={forceLoadMore} 
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          Not loading automatically? Tap to load more
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Show when there are no more users */}
                  {!hasMore && suggestedUsers.length > 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border-t border-dashed border-muted mt-4 pt-4">
                      You've seen all suggested users
                    </div>
                  )}

                  {/* Force a spacer at the bottom to ensure scrollability even with few items */}
                  <div className="h-32" aria-hidden="true" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Continue Button - Only show when enough follows are made */}
          {followedCount >= MIN_FOLLOWS_REQUIRED && (
            <div className="fixed bottom-0 left-0 right-0 pt-4 pb-6 bg-gradient-to-t from-background to-transparent mt-auto z-30">
              <div className="container max-w-3xl mx-auto px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Button 
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-[#31bcc3] to-primary hover:from-primary hover:to-[#31bcc3] text-white py-6 text-lg"
                  >
                    <motion.div 
                      className="flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <span>Continue</span>
                      <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: [0, 5, 0] }}
                        transition={{ 
                          repeat: Infinity, 
                          repeatType: "reverse", 
                          duration: 1.5 
                        }}
                      >
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </motion.span>
                    </motion.div>
                  </Button>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add this somewhere in your JSX for debugging */}
      <div className="hidden">
        {/* This will cause a re-render when values change, useful for debugging */}
        Current state: Page {page}, Users: {suggestedUsers.length}, 
        HasMore: {hasMore.toString()}, Loading: {loadingMore.toString()}
      </div>
    </FullScreenLayout>
  );
};

export default FollowSuggestionsPage; 