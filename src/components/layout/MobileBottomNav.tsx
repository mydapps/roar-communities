import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Users, Wallet, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileApp, isIOSApp } from '@/utils/deviceUtils';
import { fetchUnreadCount } from '@/utils/messagingApi';
import { motion, AnimatePresence } from 'framer-motion';

const MobileBottomNav = () => {
  const location = useLocation();
  const isAppUser = isMobileApp();
  const isIOSUser = isIOSApp();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    const loadUnreadCount = async () => {
      const response = await fetchUnreadCount();
      if (response.success) {
        setUnreadCount(response.unread_count);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);
  
  // Check if we're on a post detail page or roar farming page
  const isPostDetailPage = 
    /^\/c\/[\w-]+\/[\w-]+$/.test(location.pathname) || // community post: /c/communityId/postId
    /^\/[\w-]+\/[\w-]+$/.test(location.pathname) ||    // user post: /handle/postId
    /^\/post\/[\w-]+$/.test(location.pathname);        // generic post: /post/postId
  
  const isRoarFarmingPage = location.pathname === '/roar-farming';
  const isCommunityTokensPage = location.pathname === '/community-tokens' || location.pathname === '/community_tokens';
  const isPaidConversationPage = /^\/messages\/paid\/[\w-]+$/.test(location.pathname);
  const isWalletPage = location.pathname === '/wallet';
  const isCommunitiesPage = location.pathname === '/communities';
  
  // Only on the feed page, we want to hide/show the bottom nav based on scroll
  const isScrollSensitive = location.pathname === '/feed';
  
  // Handle scroll event to show/hide the bottom nav based on scroll direction
  useEffect(() => {
    if (!isScrollSensitive) {
      setVisible(true);
      return;
    }
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Simple scroll direction detection with threshold
      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < 50) {
        // Always show at the top of the page
        setVisible(true);
      } else if (currentScrollY < lastScrollY - 10) {
        // Scrolling up - show after 10px of upward movement
        setVisible(true);
      } else if (currentScrollY > lastScrollY + 10) {
        // Scrolling down - hide after 10px of downward movement
        setVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, isScrollSensitive]);
  
  // Don't render the bottom nav on post detail pages, roar farming page, community tokens page, wallet page, communities page, or paid conversation page
  if (isPostDetailPage || isRoarFarmingPage || isCommunityTokensPage || isPaidConversationPage || isWalletPage || isCommunitiesPage) {
    return null;
  }

  // Add proper safe area padding for iOS mobile app plus animation classes
  const bottomNavClass = cn(
    "fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden transition-transform duration-300 ease-in-out",
    !visible && isScrollSensitive ? "translate-y-full" : "translate-y-0",
    isIOSUser ? "pb-6" : "pb-2", // Extra padding for iOS notch devices
    "pt-2"
  );

  return (
    <div className={bottomNavClass}>
      <div className="w-full flex justify-around items-center py-3">
        <NavItem to="/feed" icon={<Home className="h-5 w-5" />} label="Feed" />
        <NavItem to="/search" icon={<Search className="h-5 w-5" />} label="Search" />
        <NavItem to="/communities" icon={<Users className="h-5 w-5" />} label="Communities" />
        <NavItem to="/wallet" icon={<Wallet className="h-5 w-5" />} label="Wallet" />
        <NavItem 
          to="/messages" 
          icon={<MessageCircle className="h-5 w-5" />} 
          label="Messages" 
          badgeCount={unreadCount}
        />
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badgeCount?: number;
}

const NavItem = ({ to, icon, label, badgeCount }: NavItemProps) => {
  const location = useLocation();
  
  const handleClick = (e: React.MouseEvent) => {
    // If we're clicking on the Feed button and we're already on the feed page
    if (to === '/feed' && location.pathname === '/feed') {
      e.preventDefault();
      // Dispatch a custom event to trigger feed refresh
      window.dispatchEvent(new CustomEvent('feedRefresh'));
      // Scroll to top smoothly
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center p-2 text-xs transition-all w-full",
          isActive
            ? "text-primary font-medium"
            : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            "relative flex items-center justify-center mb-1",
            isActive ? "after:absolute after:-bottom-1 after:h-1 after:w-1 after:rounded-full after:bg-primary" : ""
          )}>
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
          <span className="mt-1">{label}</span>
        </>
      )}
    </NavLink>
  );
};

export default MobileBottomNav;
