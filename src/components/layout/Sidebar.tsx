
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Users, 
  Wallet, 
  Gift, 
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
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

      {/* Sidebar - removed sticky and changed to relative position on desktop */}
      <aside
        className={cn(
          "fixed md:relative top-0 left-0 z-40 md:z-0 h-full w-[280px] border-r bg-card transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 md:hidden">
          <span className="font-display text-xl font-bold text-primary">dapps.co</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-4rem)] md:h-screen pb-10">
          <div className="px-3 py-4">
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

            <div className="mt-8 space-y-2">
              <div className="px-4 py-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">My Communities</h4>
                <div className="space-y-1">
                  <CommunityItem name="Ethereum Devs" img="https://github.com/shadcn.png" />
                  <CommunityItem name="DeFi Explorers" img="https://github.com/shadcn.png" />
                  <CommunityItem name="NFT Creators" img="https://github.com/shadcn.png" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 px-4">
              <Button className="w-full" size="sm">
                Create Community
              </Button>
            </div>
          </div>
        </ScrollArea>
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
      <img src={img} alt={name} className="h-6 w-6 rounded-full" />
      <span>{name}</span>
    </NavLink>
  );
};

export default Sidebar;
