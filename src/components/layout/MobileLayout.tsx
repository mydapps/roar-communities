import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, UserCircle, Bell, ChevronLeft, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StatusBar, Style } from '@capacitor/status-bar';
import useIsMobile from '@/hooks/useIsMobile';
import { Toast } from '@/components/ui/toast';
import { ToastProvider } from '@/components/ui/toast';

interface MobileLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  title?: string;
  onBackClick?: () => void;
  hideNav?: boolean;
  transparent?: boolean;
  actionButton?: ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showBackButton = false,
  title = '',
  onBackClick,
  hideNav = false,
  transparent = false,
  actionButton
}) => {
  const location = useLocation();
  const { isNativePlatform } = useIsMobile();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.history.back();
    }
  };

  const setLightStatusBar = async () => {
    if (isNativePlatform) {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#000000' });
      } catch (err) {
        console.error('Error setting status bar', err);
      }
    }
  };

  const setDarkStatusBar = async () => {
    if (isNativePlatform) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      } catch (err) {
        console.error('Error setting status bar', err);
      }
    }
  };

  // Adjust status bar based on transparent header
  React.useEffect(() => {
    if (transparent) {
      setLightStatusBar();
    } else {
      setDarkStatusBar();
    }
  }, [transparent]);

  const navItems = [
    { name: 'Home', path: '/feed', icon: Home },
    { name: 'Explore', path: '/search', icon: Search },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/account', icon: UserCircle },
  ];

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen bg-background relative">
        {/* Header */}
        {!transparent && (
          <header className="sticky top-0 z-50 bg-background border-b border-border h-14 px-4 flex items-center justify-between">
            {showBackButton ? (
              <button 
                onClick={handleBackClick}
                className="w-8 h-8 flex items-center justify-center rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="w-8"></div>
            )}
            
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
            
            {actionButton ? (
              <div>{actionButton}</div>
            ) : (
              <div className="w-8"></div>
            )}
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-16">{children}</main>

        {/* Bottom Navigation */}
        {!hideNav && (
          <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex items-center justify-around px-4 z-40">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center px-2 py-1 rounded-md transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <IconComponent size={22} />
                  <span className="text-xs mt-1">{item.name}</span>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 h-1 w-10 bg-primary rounded-t-md"
                      layoutId="navbar-indicator"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}
        
        <Toast />
      </div>
    </ToastProvider>
  );
};

export default MobileLayout; 