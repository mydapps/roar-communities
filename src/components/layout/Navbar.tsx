import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, Search, User, Gift, Sparkles, LogOut, ArrowLeft, Home } from 'lucide-react';
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

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const isMobile = useIsMobile();
  const { logout } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatar, setUserAvatar] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const isFeedPage = location.pathname === '/feed';
  const isHomePage = location.pathname === '/' || location.pathname === '/index';
  
  useEffect(() => {
    const userKey = localStorage.getItem('dapps_user_key');
    setIsLoggedIn(!!userKey);
    
    const avatar = localStorage.getItem('dapps_user_avatar');
    if (avatar) {
      setUserAvatar(avatar);
    }
    
    // Listen for auth invalidation events
    const handleAuthInvalidated = () => {
      console.log('Auth invalidated event received in Navbar');
      setIsLoggedIn(false);
      
      // If on a protected route, redirect to home
      const currentPath = location.pathname;
      if (currentPath.startsWith('/feed') || 
          currentPath.startsWith('/my-shares') || 
          currentPath.startsWith('/account') ||
          currentPath.startsWith('/communities') ||
          currentPath === '/edit-profile') {
        navigate('/');
      }
    };
    
    document.addEventListener('dapps_auth_invalidated', handleAuthInvalidated);
    
    return () => {
      document.removeEventListener('dapps_auth_invalidated', handleAuthInvalidated);
    };
  }, [location.pathname, navigate]);
  
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {!isMobile && (
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
                src="https://dapps.co/logo1.png" 
                alt="dapps.co" 
                className="h-8 w-auto relative"
              />
            </motion.div>
            
            {isLoggedIn && isFeedPage && (
              <span className="font-semibold text-lg ml-1 hidden sm:block">
                Feed
              </span>
            )}
          </Link>
        </div>

        {isLoggedIn && (
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

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {isMobile && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link to="/referral">
                      <Gift className="h-5 w-5 text-primary animate-pulse" />
                    </Link>
                  </Button>
                </motion.div>
              )}
              
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
                <Button variant="ghost" size="sm" className="flex items-center gap-1 py-1.5 px-2 rounded-full bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700">
                  <span className="text-base">🦁</span>
                  <span className="font-medium text-sm">500</span>
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
                  <DropdownMenuItem asChild>
                    <Link to="/my-shares" className="cursor-pointer">
                      My Shares
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer">
                      Notifications
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
