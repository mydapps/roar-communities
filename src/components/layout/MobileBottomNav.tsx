
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const location = useLocation();
  
  // Check if we're on a post detail page
  const isPostDetailPage = 
    /^\/c\/[\w-]+\/[\w-]+$/.test(location.pathname) || // community post: /c/communityId/postId
    /^\/[\w-]+\/[\w-]+$/.test(location.pathname) ||    // user post: /handle/postId
    /^\/post\/[\w-]+$/.test(location.pathname);        // generic post: /post/postId
  
  // Don't render the bottom nav on post detail pages
  if (isPostDetailPage) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden">
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
