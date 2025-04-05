import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Users, 
  Wallet, 
  Gift, 
  Settings,
  X,
  Sparkles,
  Plus,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createAuthHeaders, cleanupAuthState } from '@/utils/apiBase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Community {
  name: string;
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
  
  // Check authentication status on mount and listen for auth events
  useEffect(() => {
    const userKey = localStorage.getItem('dapps_user_key');
    setIsLoggedIn(!!userKey);
    
    if (userKey) {
      fetchCommunities();
    }
    
    // Set up listener for auth invalidation events
    const handleAuthInvalidated = () => {
      console.log('Auth invalidated event received');
      setIsLoggedIn(false);
      setCommunities([]);
      setHasCommunities(false);
    };
    
    document.addEventListener('dapps_auth_invalidated', handleAuthInvalidated);
    
    return () => {
      document.removeEventListener('dapps_auth_invalidated', handleAuthInvalidated);
    };
  }, []);
  
  const fetchCommunities = async () => {
    setLoadingCommunities(true);
    
    try {
      // Check if we have a user key in localStorage
      const userKey = localStorage.getItem('dapps_user_key');
      if (!userKey) {
        console.log('No user key found in localStorage');
        setLoadingCommunities(false);
        return;
      }
      
      // Use auth headers utility from apiBase to ensure proper authentication
      const headers = createAuthHeaders(false);
      
      // Debug the headers to see what's being sent
      console.log('Auth headers:', JSON.stringify(headers));
      
      // Double check if we have headers (if not, user not authenticated)
      if (!headers['x-user-key']) {
        console.log('No auth headers available, retrying in 1 second...');
        // If no headers but retry count is low, try again after a delay
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchCommunities();
          }, 1000);
          return;
        } else {
          throw new Error('Authentication required. Please log in again.');
        }
      }
      
      console.log('Fetching communities with auth headers');
      
      const response = await fetch("https://api.dapps.co/get_communities?personal=1&category=popular&page=1&limit=5", {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error(`API error response: ${response.status}`, errText);
        
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
      console.error('Error fetching communities:', error);
      
      // If 401 error and retries < 3, try again after delay (auth might still be initializing)
      if (error instanceof Error && error.message.includes('401') && retryCount < 3) {
        console.log(`Auth error, retrying (${retryCount + 1}/3)...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCommunities();
        }, 1500);
        return;
      }
      
      if (retryCount >= 3) {
        toast.error('Unable to load communities. Please refresh the page.');
      } else {
        toast.error('Failed to load communities');
      }
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
          "w-[280px] border-r bg-card z-30",
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
              <NavItem to="/search" icon={<Search className="h-5 w-5" />} label="Search" />
              <NavItem to="/communities" icon={<Users className="h-5 w-5" />} label="Communities" />
              <NavItem to="/my-shares" icon={<Wallet className="h-5 w-5" />} label="My Shares" />
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
              <NavItem to="/account" icon={<Settings className="h-5 w-5" />} label="Account" />
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
                            img={community.image} 
                          />
                        ))}
                      </div>
                      
                      {communities.length > 4 && (
                        <NavLink 
                          to="/communities"
                          className="block mt-2 text-sm text-primary hover:underline font-medium"
                        >
                          View more
                        </NavLink>
                      )}
                    </>
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">
                      <p>Join communities to see them here</p>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-primary text-sm"
                        onClick={() => {
                          // Reset retry count and try again
                          setRetryCount(0);
                          fetchCommunities();
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Create community button - only show if logged in */}
            {isLoggedIn && (
              <div className="py-4">
                <Button asChild className="w-full" size="sm">
                  <NavLink to="/create-community" className="flex items-center gap-1.5">
                    <Plus className="h-4 w-4" />
                    Create Community
                  </NavLink>
                </Button>
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
}

const NavItem = ({ to, icon, label, className }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
};

interface CommunityItemProps {
  name: string;
  img: string;
}

const CommunityItem = ({ name, img }: CommunityItemProps) => {
  const communityPath = `/c/${name.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <NavLink
      to={communityPath}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive 
            ? "bg-muted text-foreground" 
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )
      }
    >
      <img 
        src={img || "https://dapps.co/dapps.png"} 
        alt={name} 
        className="h-6 w-6 rounded-full object-cover"
        onError={(e) => {
          // Fallback if image fails to load
          (e.target as HTMLImageElement).src = "https://dapps.co/dapps.png";
        }}
      />
      <span>{name}</span>
    </NavLink>
  );
};

export default Sidebar;
