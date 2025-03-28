
import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useIsMobile } from '@/hooks/use-mobile';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const userKey = localStorage.getItem('dapps_user_key');
    setIsLoggedIn(!!userKey);
  }, [location]);
  
  const handleRefresh = async () => {
    // Simulate a refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force a refresh of the current route
    navigate(0);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-50">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>
      
      {/* Main content area - modified for proper sidebar scrolling */}
      <div className="flex flex-1">
        {isLoggedIn && (
          <div className="hidden md:block"> 
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
        )}
        
        <div className="flex-1 overflow-auto">
          <PullToRefresh 
            onRefresh={handleRefresh}
            className="transition-all duration-300 ease-in-out h-full"
          >
            <main className={isMobile ? "pb-16" : ""}>
              <div className="container py-6 px-4 sm:px-6 max-w-5xl mx-auto animate-fade-in">
                <Outlet />
              </div>
            </main>
          </PullToRefresh>
        </div>
      </div>
      
      {isMobile && isLoggedIn && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;
