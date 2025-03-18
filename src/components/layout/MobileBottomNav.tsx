
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden">
      <div className="flex justify-around items-center py-2">
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
          "flex flex-col items-center justify-center rounded-md p-2 text-xs",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      {icon}
      <span className="mt-1">{label}</span>
    </NavLink>
  );
};

export default MobileBottomNav;
