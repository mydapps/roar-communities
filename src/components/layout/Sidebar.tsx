import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Users, 
  MessageCircle, 
  Settings, 
  X, 
  Loader2, 
  Plus, 
  ArrowUpRight,
  Wallet,
  Gift,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createAuthHeaders, cleanupAuthState } from '@/utils/apiBase';
import { fetchUnreadCount } from '@/utils/messagingApi';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Community {
  name: string;
  display_name: string;
  ticker: string | null;
  image: string;
  membersCount: number;
}

interface CommunitiesResponse {
  success: boolean;
  communities: Community[];
  pagination: {
    totalItems: number;
    hasNextPage: boolean;
  };
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [hasCommunities, setHasCommunities] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [userHandle, setUserHandle] = useState('');
  const [personalCommunities, setPersonalCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();
  
  // Check authentication status on mount and listen for auth events
  useEffect(() => {
    const userId = localStorage.getItem('dapps_user_id');
    const handle = localStorage.getItem('dapps_user_handle');
    setIsLoggedIn(!!userId);
    setUserHandle(handle || '');
    
    if (userId) {
      fetchCommunities();
    }
    
    // Set up listener for auth invalidation events
    const handleAuthInvalidated = () => {
      setIsLoggedIn(false);
      setCommunities([]);
      setHasCommunities(false);
      setUnreadCount(0);
    };
    
    document.addEventListener('dapps_auth_invalidated', handleAuthInvalidated);
    
    return () => {
      document.removeEventListener('dapps_auth_invalidated', handleAuthInvalidated);
    };
  }, []);

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      const response = await fetchUnreadCount();
      if (response.success) {
        setUnreadCount(response.unread_count);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn]);
  
  const fetchCommunities = async () => {
    setLoadingCommunities(true);
    
    try {
      // Check if we have a user ID in localStorage to know if user is logged in
      const userId = localStorage.getItem('dapps_user_id');
      if (!userId) {
        setLoadingCommunities(false);
        return;
      }
      
      // Create headers with just content type
      const headers = createAuthHeaders(false);
      
      // If retry count is high, show error and stop trying
      if (retryCount >= 3) {
        toast.error('Unable to load communities. Please refresh the page.');
        setLoadingCommunities(false);
          return;
      }
      
      const response = await fetch("/api/get_communities?personal=1&category=popular&page=1&limit=5", {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errText = await response.text();
        
        if (response.status === 401) {
          // Use the centralized cleanup function for auth failures
          cleanupAuthState();
          setIsLoggedIn(false);
          return;
        }
        
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: CommunitiesResponse = await response.json();
      
      if (data.success && data.communities.length > 0) {
        setCommunities(data.communities);
        setHasCommunities(true);
      } else {
        setHasCommunities(false);
      }
    } catch (error) {
      // If error and retries < 3, try again after delay (auth might still be initializing)
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCommunities();
        }, 1500);
        return;
      }
      
        toast.error('Failed to load communities');
    } finally {
      setLoadingCommunities(false);
    }
  };
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        document.body.style.overflow = '';
      } else if (isOpen) {
        document.body.style.overflow = 'hidden';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchPersonalCommunities = async () => {
      const userId = localStorage.getItem('dapps_user_id');
      if (!userId) {
        setPersonalCommunities([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Use relative proxy path
        const response = await fetch("/api/get_communities?personal=1&category=popular&page=1&limit=5", {
          credentials: 'include' // Add credentials
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.communities)) {
          setPersonalCommunities(data.communities.slice(0, 5)); // Limit to 5
        } else {
          setPersonalCommunities([]);
        }
      } catch (error) {
        console.error("Failed to fetch personal communities:", error);
        setPersonalCommunities([]); // Set empty on error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPersonalCommunities();
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar - position changed to make it scroll with the page on desktop */}
      <aside
        className={cn(
          "w-[280px] md:w-56 lg:w-[280px] border-r bg-card/95 backdrop-blur-sm z-30",
          "md:sticky md:top-16 md:h-[calc(100vh-64px)] md:self-start",
          isOpen ? "fixed top-0 left-0 h-full translate-x-0" : "fixed top-0 -translate-x-full md:translate-x-0 h-full left-0"
        )}
      >
        {/* Mobile header */}
        <div className="flex h-16 items-center justify-between px-4 md:hidden shrink-0">
          <span className="font-display text-xl font-bold text-primary">dapps.co</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Main content area */}
        <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6">
          <div className="px-3 py-4 space-y-8">
            {/* Navigation links */}
            <nav className="space-y-1">
              <NavItem to="/feed" icon={<Home className="h-5 w-5" />} label="Feed" />
              {/* Only show Search on mobile */}
              {isMobile && (
                <NavItem to="/search" icon={<Search className="h-5 w-5" />} label="Search" />
              )}
              <NavItem to="/communities" icon={<Users className="h-5 w-5" />} label="Communities" />
              <NavItem 
                to="/messages" 
                icon={<MessageCircle className="h-5 w-5" />} 
                label="Messages" 
                badgeCount={unreadCount}
              />
              <NavItem to="/wallet" icon={<Wallet className="h-5 w-5" />} label="Wallet" />
              <NavItem 
                to="/referral" 
                icon={
                  <div className="relative">
                    <Gift className="h-5 w-5 text-primary" />
                    <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-primary" />
                  </div>
                } 
                label="Share the Love" 
                className="font-medium"
              />
              <NavItem to={userHandle ? `/u/${userHandle}` : "/account"} icon={<Settings className="h-5 w-5" />} label="Account" />
            </nav>

            {/* Communities section - only show if logged in and has communities */}
            {isLoggedIn && (
              <div className="space-y-2">
                <div className="py-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">My Communities</h4>
                  
                  {loadingCommunities ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    </div>
                  ) : hasCommunities ? (
                    <>
                      <div className="space-y-1">
                        {communities.map((community) => (
                          <CommunityItem 
                            key={community.name} 
                            name={community.name}
                            display_name={community.display_name}
                            ticker={community.ticker}
                            img={community.image} 
                          />
                        ))}
                      </div>
                      
                      {communities.length > 4 && (
                        <NavLink 
                          to="/communities"
                          className="flex items-center gap-1 text-xs text-primary mt-3 font-medium hover:underline"
                        >
                          View all communities
                          <ArrowUpRight className="h-3 w-3 mt-0.5" />
                        </NavLink>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg bg-muted/50 border-border/40 border p-3">
                      <p className="text-xs text-muted-foreground">Join or create communities to see them here</p>
                      <NavLink 
                        to="/communities"
                        className="mt-2 flex items-center justify-center gap-1 w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded-md py-1.5 font-medium"
                      >
                        <Plus className="h-3 w-3" />
                        Browse Communities
                      </NavLink>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Create Community Button */}
            {isLoggedIn && (
              <div className="pt-4 border-t">
                <NavLink 
                  to="/community_token_new"
                  className={({ isActive }) => cn(
                    "flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-sm font-medium",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Create Community
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
  badgeCount?: number;
}

const NavItem = ({ to, icon, label, className, badgeCount }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <div className="relative">
      {icon}
        
        {/* Unread Badge */}
        <AnimatePresence>
          {badgeCount && badgeCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg border border-background"
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {label}
    </NavLink>
  );
};

interface CommunityItemProps {
  name: string;
  display_name: string;
  ticker: string | null;
  img: string;
}

const CommunityItem = ({ name, display_name, ticker, img }: CommunityItemProps) => {
  // Use ticker for routing if available, otherwise fall back to name
  const linkTo = ticker ? `/c/${ticker}` : `/c/${name}`;
  
  // Generate initials from display_name or name
  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(display_name || name);

  return (
    <NavLink
      to={linkTo}
      className={({ isActive }) => cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Avatar className="h-6 w-6">
        <AvatarImage src={img} alt={display_name || name} />
        <AvatarFallback className="text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{display_name || name}</span>
    </NavLink>
  );
};

export default Sidebar;
