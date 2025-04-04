import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Check if we're on a post detail page
  const isPostDetailPage = 
    /^\/c\/[\w-]+\/[\w-]+$/.test(location.pathname) || // community post: /c/communityId/postId
    /^\/[\w-]+\/[\w-]+$/.test(location.pathname) ||    // user post: /handle/postId
    /^\/post\/[\w-]+$/.test(location.pathname);        // generic post: /post/postId
  
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
  
  // Don't render the bottom nav on post detail pages
  if (isPostDetailPage) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden transition-transform duration-300 ease-in-out",
      !visible && isScrollSensitive ? "translate-y-full" : "translate-y-0"
    )}>
      <div className="flex justify-around items-center py-3 px-2">
        <NavItem to="/feed" icon={<Home className="h-5 w-5" />} label="Feed" />
        <NavItem to="/search" icon={<Search className="h-5 w-5" />} label="Search" />
        <NavItem to="/communities" icon={<Users className="h-5 w-5" />} label="Communities" />
        <NavItem to="/my-shares" icon={<Wallet className="h-5 w-5" />} label="Wallet" />
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center rounded-md p-2 text-xs transition-all",
          isActive
            ? "text-primary scale-110 font-medium"
            : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            "relative mb-1 flex items-center justify-center",
            isActive ? "after:absolute after:-bottom-1.5 after:h-1 after:w-1 after:rounded-full after:bg-primary" : ""
          )}>
            {icon}
          </div>
          <span className="mt-1">{label}</span>
        </>
      )}
    </NavLink>
  );
};

export default MobileBottomNav;
