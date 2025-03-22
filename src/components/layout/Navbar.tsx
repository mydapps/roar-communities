
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, Menu, Search, User, Gift, Sparkles, LogOut } from 'lucide-react';
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

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const isMobile = useIsMobile();
  const { logout } = usePrivy();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      console.log('Logging out user...');
      
      // 1. Clear ALL localStorage items
      localStorage.clear();
      console.log('Cleared all localStorage items');
      
      // 2. Logout from Privy
      await logout();
      console.log('Logged out from Privy');
      
      // 3. Redirect to home page using navigate instead of window.location
      console.log('Redirecting to homepage...');
      navigate('/');
      
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out. Please try again.');
    }
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl">
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
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://dapps.co/logo1.png" 
              alt="dapps.co" 
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-1">
          <div className="relative w-64 mx-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search communities..."
              className="w-full rounded-full bg-muted pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/referral">
                <Gift className="h-5 w-5 text-primary animate-pulse" />
              </Link>
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              3
            </span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/account" className="cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/my-shares" className="cursor-pointer">
                  My Shares
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
        </div>
      </div>
    </header>
  );
};

export default Navbar;
