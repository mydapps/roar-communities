import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Crown, Medal, Sparkles, TrendingUp, User, Flame, Star, Rocket } from 'lucide-react';
import { fetchTopRoarFarmers, TopRoarFarmersResponse, RoarFarmer, CurrentUserFarmer } from '@/utils/leaderboardApi';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

const RoarLeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState<TopRoarFarmersResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserHandle, setCurrentUserHandle] = useState<string>('');
  const navigate = useNavigate();

  // Get current user handle from localStorage
  useEffect(() => {
    const userHandle = localStorage.getItem('dapps_user_handle') || '';
    setCurrentUserHandle(userHandle);
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchTopRoarFarmers(30);
      setLeaderboardData(response);
      
      // Fire celebratory confetti if user is in top 3
      if (response.data.current_user && response.data.current_user.rank <= 3) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#f59e0b', '#d97706', '#92400e']
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard. Please try again.');
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Get rank emoji and styling
  const getRankStyling = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          emoji: '👑',
          icon: <Crown className="h-5 w-5 text-yellow-500" />,
          gradient: 'from-yellow-400 via-yellow-500 to-amber-600',
          border: 'border-yellow-400/40',
          glow: 'shadow-lg shadow-yellow-500/25',
          text: 'text-yellow-800 dark:text-yellow-200'
        };
      case 2:
        return {
          emoji: '🥈',
          icon: <Medal className="h-5 w-5 text-gray-400" />,
          gradient: 'from-gray-300 via-gray-400 to-gray-500',
          border: 'border-gray-400/40',
          glow: 'shadow-lg shadow-gray-400/25',
          text: 'text-gray-700 dark:text-gray-200'
        };
      case 3:
        return {
          emoji: '🥉',
          icon: <Medal className="h-5 w-5 text-amber-600" />,
          gradient: 'from-amber-500 via-amber-600 to-amber-700',
          border: 'border-amber-500/40',
          glow: 'shadow-lg shadow-amber-500/25',
          text: 'text-amber-800 dark:text-amber-200'
        };
      default:
        return {
          emoji: '🦁',
          icon: <Trophy className="h-4 w-4 text-amber-500" />,
          gradient: 'from-background to-muted/50',
          border: 'border-border',
          glow: '',
          text: 'text-foreground'
        };
    }
  };

  // Enhanced farmer row with more visual appeal
  const renderFarmerRow = (farmer: RoarFarmer | CurrentUserFarmer, isCurrentUser: boolean = false, index: number = 0) => {
    const styling = getRankStyling(farmer.rank);
    const isTopThree = farmer.rank <= 3;
    
    return (
      <motion.div
        key={`${farmer.handle}-${farmer.rank}`}
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ 
          duration: 0.4, 
          delay: Math.min(index * 0.08, 1.2),
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        whileHover={{ scale: 1.02, y: -2 }}
        className={`
          relative overflow-hidden rounded-xl border-2 transition-all duration-300
          ${isCurrentUser 
            ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/50 shadow-lg shadow-primary/20' 
            : `bg-gradient-to-r ${styling.gradient} ${styling.border} ${styling.glow}`
          }
          ${isTopThree ? 'p-6' : 'p-4'}
          hover:shadow-xl
        `}
      >
        {/* Background pattern for top 3 */}
        {isTopThree && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        )}
        
        {/* Rank badge */}
        <div className="absolute top-2 left-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              ${isTopThree ? 'bg-white/20 backdrop-blur-sm' : 'bg-muted/20'}
              border-2 ${styling.border}
            `}
          >
            <span className="text-lg font-bold">{styling.emoji}</span>
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-between pl-14 gap-3 min-w-0">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            {/* Avatar with enhanced styling */}
            <Link to={`/u/${farmer.handle}`} className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative"
              >
                <Avatar className={`
                  ${isTopThree ? 'h-12 w-12 md:h-16 md:w-16' : 'h-10 w-10 md:h-12 md:w-12'} 
                  ring-4 ${isCurrentUser ? 'ring-primary/50' : 'ring-white/30'} 
                  shadow-lg hover:ring-primary/60 transition-all cursor-pointer
                `}>
                  <AvatarImage src={farmer.avatar || ''} alt={farmer.handle} />
                  <AvatarFallback className={`${styling.text} font-bold text-xs md:text-sm`}>
                    {farmer.handle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Rank number overlay */}
                <div className="absolute -bottom-1 -right-1 bg-background border-2 border-current rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold">
                  {farmer.rank}
                </div>
              </motion.div>
            </Link>

            {/* User info */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                <Link to={`/u/${farmer.handle}`} className="hover:opacity-80 transition-opacity">
                  <span className={`font-bold ${isTopThree ? 'text-lg md:text-xl' : 'text-base md:text-lg'} ${styling.text} truncate max-w-[120px] md:max-w-none cursor-pointer hover:underline`}>
                    {farmer.handle}
                  </span>
                </Link>
                {isCurrentUser && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="flex-shrink-0"
                  >
                    <Badge className="bg-primary text-primary-foreground shadow-lg text-xs">
                      <Star className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                      You
                    </Badge>
                  </motion.div>
                )}
                {isTopThree && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0] 
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatDelay: 3 
                    }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                  </motion.div>
                )}
              </div>
              
              {/* Progress indicator for current rank */}
              {farmer.rank <= 10 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">Elite Farmer</span>
                  <Flame className="h-2 w-2 md:h-3 md:w-3 text-orange-500" />
                </div>
              )}
            </div>
          </div>

          {/* Token count with enhanced styling */}
          <div className="text-right flex-shrink-0">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.4 }}
              className={`font-bold ${isTopThree ? 'text-lg md:text-2xl' : 'text-base md:text-xl'} ${styling.text}`}
            >
              {farmer.token_count_formatted}
            </motion.div>
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <span>ROAR</span>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                🦁
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Enhanced podium with more visual flair
  const renderPodium = () => {
    if (!leaderboardData?.data.top_farmers) return null;
    
    const top3 = leaderboardData.data.top_farmers.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <Card className="mb-8 overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800">
        <CardHeader className="text-center pb-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <CardTitle className="flex items-center justify-center gap-3 text-2xl">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Trophy className="h-8 w-8 text-amber-600" />
              </motion.div>
              <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent font-bold">
                Hall of Fame
              </span>
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.5 }}
              >
                <Crown className="h-8 w-8 text-amber-600" />
              </motion.div>
            </CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent className="p-4 sm:p-8">
          <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-6 mb-6 overflow-hidden">
            {/* Second Place */}
            {top3[1] && (
              <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center group flex-1 max-w-[120px] sm:max-w-none"
              >
                {/* Podium */}
                <motion.div 
                  className="relative h-24 w-20 bg-gradient-to-t from-gray-400 via-gray-300 to-gray-200 rounded-t-xl shadow-lg mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-t-xl" />
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                    <span className="text-white font-bold text-lg drop-shadow-lg">2</span>
                  </div>
                  <motion.div
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2"
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Medal className="h-6 w-6 text-gray-600" />
                  </motion.div>
                </motion.div>
                
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-4 ring-gray-400 mb-3 group-hover:ring-gray-300 transition-all shadow-xl">
                  <AvatarImage src={top3[1].avatar || ''} alt={top3[1].handle} />
                  <AvatarFallback className="bg-gray-100 text-gray-700 font-bold">
                    {top3[1].handle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center min-w-0 w-full">
                  <Link to={`/u/${top3[1].handle}`} className="hover:opacity-80 transition-opacity">
                    <div className="font-bold text-sm sm:text-lg text-gray-700 dark:text-gray-200 mb-1 hover:underline cursor-pointer truncate">{top3[1].handle}</div>
                  </Link>
                  <div className="text-xs sm:text-sm text-amber-600 font-semibold truncate">{top3[1].token_count_formatted} ROAR</div>
                </div>
              </motion.div>
            )}

            {/* First Place - Center and highest */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center relative group flex-1 max-w-[140px] sm:max-w-none"
            >
              {/* Winner effects */}
              <motion.div
                className="absolute -inset-8 bg-gradient-to-r from-yellow-400/20 via-amber-400/30 to-yellow-400/20 rounded-full"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Podium */}
              <motion.div 
                className="relative h-32 w-20 bg-gradient-to-t from-yellow-600 via-yellow-400 to-yellow-300 rounded-t-xl shadow-xl mb-4"
                whileHover={{ scale: 1.08 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-t-xl" />
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                  <span className="text-yellow-900 font-bold text-xl drop-shadow-lg">1</span>
                </div>
                <motion.div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  animate={{ 
                    y: [-3, 3, -3],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <Crown className="h-8 w-8 text-yellow-700" />
                </motion.div>
              </motion.div>
              
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 sm:ring-6 ring-yellow-400 mb-3 group-hover:ring-yellow-300 transition-all shadow-2xl">
                <AvatarImage src={top3[0].avatar || ''} alt={top3[0].handle} />
                <AvatarFallback className="bg-yellow-100 text-yellow-800 font-bold text-lg">
                  {top3[0].handle.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center min-w-0 w-full">
                <Link to={`/u/${top3[0].handle}`} className="hover:opacity-80 transition-opacity">
                  <div className="font-bold text-lg sm:text-xl text-yellow-700 dark:text-yellow-200 mb-1 flex items-center gap-1 sm:gap-2 justify-center hover:underline cursor-pointer">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate min-w-0">{top3[0].handle}</span>
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  </div>
                </Link>
                <div className="text-sm sm:text-base text-amber-600 font-bold truncate">{top3[0].token_count_formatted} ROAR</div>
                <Badge className="mt-2 bg-yellow-500 text-yellow-900 shadow-lg text-xs">
                  <Crown className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  Champion
                </Badge>
              </div>
            </motion.div>

            {/* Third Place */}
            {top3[2] && (
              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.6, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center group flex-1 max-w-[120px] sm:max-w-none"
              >
                {/* Podium */}
                <motion.div 
                  className="relative h-20 w-20 bg-gradient-to-t from-amber-700 via-amber-600 to-amber-500 rounded-t-xl shadow-lg mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-t-xl" />
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                    <span className="text-white font-bold text-lg drop-shadow-lg">3</span>
                  </div>
                  <motion.div
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2"
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <Medal className="h-6 w-6 text-amber-800" />
                  </motion.div>
                </motion.div>
                
                <Avatar className="h-10 w-10 sm:h-14 sm:w-14 ring-4 ring-amber-500 mb-3 group-hover:ring-amber-400 transition-all shadow-xl">
                  <AvatarImage src={top3[2].avatar || ''} alt={top3[2].handle} />
                  <AvatarFallback className="bg-amber-100 text-amber-800 font-bold">
                    {top3[2].handle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center min-w-0 w-full">
                  <Link to={`/u/${top3[2].handle}`} className="hover:opacity-80 transition-opacity">
                    <div className="font-bold text-sm sm:text-base text-amber-700 dark:text-amber-200 mb-1 hover:underline cursor-pointer truncate">{top3[2].handle}</div>
                  </Link>
                  <div className="text-xs sm:text-sm text-amber-600 font-semibold truncate">{top3[2].token_count_formatted} ROAR</div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-16 pb-8 max-w-4xl">
        <Helmet>
          <title>Roar Farming Leaderboard - dapps.co</title>
        </Helmet>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            </motion.div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">Loading Hall of Fame...</p>
            <p className="text-sm text-muted-foreground">Calculating farmer rankings</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !leaderboardData) {
    return (
      <div className="container mx-auto px-4 pt-16 pb-8 max-w-4xl">
        <Helmet>
          <title>Roar Farming Leaderboard - dapps.co</title>
        </Helmet>
        <div className="text-center">
          <div className="mb-6">
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
          </div>
          <Button onClick={fetchLeaderboard} size="lg" className="gap-2">
            <Rocket className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { top_farmers, current_user, is_authenticated } = leaderboardData.data;
  const userInTop30 = current_user && top_farmers.some(farmer => farmer.handle === current_user.handle);
  const userInTop3 = current_user && current_user.rank <= 3;

  return (
    <div className="container mx-auto px-4 pt-16 pb-8 max-w-6xl">
      <Helmet>
        <title>Roar Farming Leaderboard - dapps.co</title>
        <meta name="description" content="See the top roar farmers and compete for the highest rewards on dapps.co" />
      </Helmet>

      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <div className="relative">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent"
            animate={{ 
              backgroundPosition: ['0%', '100%', '0%']
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🏆 Roar Leaderboard
          </motion.h1>
          
          {/* Floating elements */}
          <motion.div
            className="absolute -top-4 left-1/4"
            animate={{ 
              y: [-10, 10, -10],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          >
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </motion.div>
          
          <motion.div
            className="absolute -top-2 right-1/4"
            animate={{ 
              y: [10, -10, 10],
              rotate: [0, -10, 10, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            <Flame className="h-6 w-6 text-orange-500" />
          </motion.div>
        </div>
        
        <motion.p 
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          🚀 Compete and earn your place among the elite roar farmers!
        </motion.p>
      </motion.div>

      {/* Podium */}
      {renderPodium()}

      {/* Full Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <Card className="overflow-hidden shadow-xl border-2 border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2 border-border/50">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="h-6 w-6 text-primary" />
              </motion.div>
              Elite Farmers Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {top_farmers.slice(3).map((farmer, index) => {
                const isCurrentUser = farmer.handle === currentUserHandle;
                return renderFarmerRow(farmer, isCurrentUser, index);
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current User (if not in top 30) */}
      {is_authenticated && current_user && !userInTop30 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-8"
        >
          <Card className="overflow-hidden border-2 border-primary/30 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="border-b border-primary/20">
              <CardTitle className="flex items-center gap-3 text-xl">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <User className="h-6 w-6 text-primary" />
                </motion.div>
                Your Current Position
                <Badge className="bg-primary text-primary-foreground">
                  Rank #{current_user.rank}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {renderFarmerRow(current_user, true, 0)}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 text-center"
              >
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                  <p className="text-lg font-semibold mb-2">🎯 Ready to climb higher?</p>
                  <p className="text-muted-foreground mb-4">
                    Keep farming to break into the top 30 elite farmers!
                  </p>
                  <Link to="/roar-farming">
                    <Button size="lg" className="gap-2 shadow-lg">
                      <Rocket className="h-5 w-5" />
                      Start Farming Now
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Call to Action for authenticated users in ranks 4-30 */}
      {is_authenticated && userInTop30 && !userInTop3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-8 text-center"
        >
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-2 border-amber-200 dark:border-amber-800 shadow-xl">
            <CardContent className="p-8">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <h3 className="text-2xl font-bold mb-3 text-amber-700 dark:text-amber-300">
                  🎉 Congratulations, Elite Farmer!
                </h3>
              </motion.div>
              <p className="text-lg text-muted-foreground mb-6">
                You're in the top 30! Keep farming to climb higher and reach the Hall of Fame!
              </p>
              <Link to="/roar-farming">
                <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg">
                  <Sparkles className="h-5 w-5" />
                  Continue Farming
                  <Flame className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default RoarLeaderboardPage; 