import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, Search, User, Gift, Sparkles, LogOut, ArrowLeft, Home, Moon, Sun } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import * as apiBase from '@/utils/apiBase';
import NotificationIcon from '@/components/notifications/NotificationIcon';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { getUserProfile } from '@/utils/userApi';
import { useDevice } from '@/components/providers/DeviceProvider';
import { useTheme } from '@/contexts/ThemeContext';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const isMobile = useIsMobile();
  const { isMobileApp, isIOSApp } = useDevice();
  const { logout } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatar, setUserAvatar] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userHandle, setUserHandle] = useState('');
  const [roarBalance, setRoarBalance] = useState('0');
  const { theme, toggleTheme, isTransitioning } = useTheme();
  
  const isFeedPage = location.pathname === '/feed';
  const isHomePage = location.pathname === '/' || location.pathname === '/index';
  
  // Use the safe area CSS classes instead of hard-coded padding
  const safeAreaTopClass = isMobileApp ? 'safe-area-top' : '';
  
  useEffect(() => {
    // Check for user ID instead of API key
    const userId = localStorage.getItem('dapps_user_id');
    const handle = localStorage.getItem('dapps_user_handle');
    setIsLoggedIn(!!userId); // Use userId to determine login status
    setUserHandle(handle || '');
    
    const avatar = localStorage.getItem('dapps_user_avatar');
    if (avatar) {
      setUserAvatar(avatar);
    }
    
    // Fetch user roar balance if logged in (using handle)
    if (handle) { // Use handle existence, which implies login
      fetchUserRoarBalance(handle);
    }
    
    // Listen for auth invalidation events
    const handleAuthInvalidated = () => {
      const currentPath = location.pathname;
      if (currentPath.startsWith('/feed') || 
          currentPath.startsWith('/my-shares') || 
          currentPath.startsWith('/account') ||
          currentPath.startsWith('/communities') ||
          currentPath === '/edit-profile') {
        navigate('/');
      }
    };
    
    // Listen for avatar updates from other components
    const handleAvatarUpdated = (event: CustomEvent) => {
      const { avatarCode } = event.detail;
      if (avatarCode) {
        setUserAvatar(avatarCode);
      }
    };
    
    document.addEventListener('dapps_auth_invalidated', handleAuthInvalidated);
    window.addEventListener('avatar_updated', handleAvatarUpdated as EventListener);
    
    return () => {
      document.removeEventListener('dapps_auth_invalidated', handleAuthInvalidated);
      window.removeEventListener('avatar_updated', handleAvatarUpdated as EventListener);
    };
  }, [location.pathname, navigate]);
  
  // Function to fetch user roar balance
  const fetchUserRoarBalance = async (handle: string) => {
    try {
      const response = await getUserProfile(handle);
      if (response.success && response.user) {
        setRoarBalance(response.user.formatted_roar_holdings || '0');
      }
    } catch (error) {
      console.error('Error fetching roar balance:', error);
    }
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
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out. Please try again.');
    }
  };
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchFocused(false);
    }
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };
  
  return (
    <header className={cn(
      "fixed left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl shadow-sm top-0",
      isMobileApp ? "safe-area-top bg-background" : ""
    )}>
      <div className={cn(
        "container flex h-16 items-center justify-between px-4",
        // For mobile app, use space-between for layout
        isMobileApp ? "justify-between" : ""
      )}>
        {/* Logo and back button area */}
        <div className="flex items-center gap-2">
          {!isMobile && !isMobileApp && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          
          {!isHomePage && !isFeedPage && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="mr-1 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleBackClick}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
          
          <Link to="/" className="flex items-center gap-2">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img 
                src="/images/logo1.png" 
                alt="Dapps.co Logo" 
                className="h-8 w-auto relative"
              />
            </motion.div>
          </Link>
        </div>

        {/* Search bar - only show on web, not on mobile app */}
        {isLoggedIn && !isMobileApp && (
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center max-w-md mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className={cn(
                "relative transition-all duration-300 group", 
                searchFocused ? "w-full" : "w-[90%] mx-auto"
              )}>
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full blur-md transition-opacity", 
                  searchFocused ? "opacity-100" : "opacity-0"
                )}></div>
                <Search className={cn(
                  "absolute left-3 top-2.5 h-4 w-4 transition-colors",
                  searchFocused ? "text-primary" : "text-muted-foreground"
                )} />
                <input
                  type="text"
                  placeholder="Search communities, posts, users..."
                  className={cn(
                    "peer w-full rounded-full bg-muted pl-10 pr-4 py-2 text-sm border transition-all",
                    searchFocused 
                      ? "border-primary/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30" 
                      : "border-transparent"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
            </form>
          </div>
        )}

        {/* User account and actions area */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Restore gift icon for all mobile devices including app */}
              {isMobile && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link to="/referral">
                      <Gift className="h-5 w-5 text-primary animate-pulse" />
                    </Link>
                  </Button>
                </motion.div>
              )}
              
              {/* Restore notification icon for all platforms including mobile app */}
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <NotificationIcon />
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1 py-1.5 px-2 rounded-full bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700"
                  asChild
                >
                  <Link to="/roar-farming">
                    <span className="text-base">🦁</span>
                    <span className="font-medium text-sm">{roarBalance}</span>
                  </Link>
                </Button>
              </motion.div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-full opacity-0 hover:opacity-100 transition-opacity"></div>
                    <Avatar className="h-8 w-8 border border-muted-foreground/10 hover:border-primary/30 transition-colors">
                      <AvatarImage src={`https://img.dapps.co/avatar/${userAvatar}.svg`} alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-lg border-primary/20">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs text-muted-foreground">
                        @{localStorage.getItem('dapps_user_handle') || 'user'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/feed" className="cursor-pointer flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Feed</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/u/${localStorage.getItem('dapps_user_handle') || ''}`} className="cursor-pointer flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/edit-profile" className="cursor-pointer flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={toggleTheme}
                    className="cursor-pointer flex items-center gap-2 relative overflow-hidden group"
                    disabled={isTransitioning}
                  >
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: theme === 'dark' ? 360 : 0,
                        scale: isTransitioning ? [1, 1.3, 0.9, 1] : 1,
                        y: isTransitioning ? [0, -4, 0] : 0
                      }}
                      transition={{ 
                        duration: isTransitioning ? 0.8 : 0.5, 
                        ease: "easeInOut",
                        times: isTransitioning ? [0, 0.3, 0.7, 1] : undefined
                      }}
                      className="relative flex items-center justify-center w-4 h-4"
                    >
                      {theme === 'light' ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, ease: "backOut" }}
                        >
                          <Moon className="h-4 w-4 text-blue-400 drop-shadow-lg" />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, ease: "backOut" }}
                          className="relative"
                        >
                          <Sun className="h-4 w-4 text-yellow-500 drop-shadow-lg" />
                          <motion.div
                            animate={{ 
                              scale: [1, 1.4, 1],
                              opacity: [0.3, 0.8, 0.3]
                            }}
                            transition={{ 
                              duration: 2.5, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute inset-0 rounded-full bg-yellow-400/30"
                          />
                        </motion.div>
                      )}
                      
                      {/* Magical sparkles around the icon */}
                      {isTransitioning && (
                        <>
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, x: 0, y: 0 }}
                              animate={{ 
                                scale: [0, 1.5, 0],
                                x: [0, (Math.cos(i * 45 * Math.PI / 180) * 25)],
                                y: [0, (Math.sin(i * 45 * Math.PI / 180) * 25)]
                              }}
                              transition={{ 
                                duration: 1,
                                delay: i * 0.08,
                                ease: "easeOut"
                              }}
                              className="absolute w-1 h-1 bg-gradient-to-r from-yellow-400 to-blue-400 rounded-full"
                              style={{
                                boxShadow: '0 0 6px currentColor'
                              }}
                            />
                          ))}
                        </>
                      )}
                    </motion.div>
                    
                    <motion.span 
                      className="flex items-center gap-1 font-medium"
                      animate={{
                        color: isTransitioning 
                          ? ["currentColor", "#3b82f6", "#8b5cf6", "currentColor"]
                          : "currentColor"
                      }}
                      transition={{ duration: 0.8 }}
                    >
                      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                      {isTransitioning && (
                        <motion.div
                          animate={{ 
                            rotate: 360,
                            scale: [1, 1.3, 1]
                          }}
                          transition={{ 
                            rotate: { duration: 1.2, repeat: Infinity, ease: "linear" },
                            scale: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                          }}
                          className="w-3 h-3 border-2 border-blue-400 border-t-yellow-400 rounded-full shadow-lg"
                        />
                      )}
                    </motion.span>
                    
                    {/* Background glow effect */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileHover={{ 
                        opacity: 0.1, 
                        scale: 1,
                        background: theme === 'dark' 
                          ? 'linear-gradient(45deg, #3b82f6, #8b5cf6)' 
                          : 'linear-gradient(45deg, #f59e0b, #3b82f6)'
                      }}
                      className="absolute inset-0 rounded-md"
                      transition={{ duration: 0.4 }}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/referral" className="cursor-pointer flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      <span className="text-primary font-medium">Share the Love</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="default" 
                onClick={() => navigate('/index')}
                className="font-medium relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10">Login / Signup</span>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
