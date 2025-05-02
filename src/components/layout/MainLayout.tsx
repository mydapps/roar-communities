import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDevice } from '@/components/providers/DeviceProvider';
import { cn } from '@/lib/utils';
import { isMobileApp } from '@/utils/deviceUtils';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isMobileApp: isMobileAppContext } = useDevice();
  const isMobileAppUser = isMobileApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check if we're on a post detail page
  const isPostDetailPage = 
    /^\/c\/[\w-]+\/[\w-]+$/.test(location.pathname) || // community post: /c/communityId/postId
    /^\/[\w-]+\/[\w-]+$/.test(location.pathname) ||    // user post: /handle/postId
    /^\/post\/[\w-]+$/.test(location.pathname);        // generic post: /post/postId
  
  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('dapps_user_id');
    setIsLoggedIn(!!userId);
  }, [location]);
  
  // Add global search keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        
        // If we're already on the search page, focus the input
        if (location.pathname === '/search') {
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        } else {
          // Navigate to search page
          navigate('/search');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location.pathname]);
  
  const handleRefresh = async () => {
    // Simulate a refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for localStorage values to determine if we're logged in
    const hasUserId = localStorage.getItem('dapps_user_id');
    
    // Only perform a full refresh if necessary
    if (hasUserId) {
      console.log('User has credentials, performing local data refresh only');
      // Here you could add specific refresh logic for different routes
      // without reloading the entire page
      
      // For now, just reload data related to the current view
      // by dispatching a custom event
      window.dispatchEvent(new CustomEvent('app:refresh'));
    } else {
      // Force a refresh of the current route if no credentials exist
      navigate(0);
    }
  };
  
  // Apply safe area insets for mobile app
  const mainContentClass = cn(
    isMobile && !isPostDetailPage ? "pb-16" : "",
    isMobileAppContext ? "safe-area-inset-y" : ""
  );
  
  return (
    <div className={cn(
      // This outer div manages the overall flex column layout and minimum height
      "min-h-screen flex flex-col bg-background", 
      isMobileAppContext ? "safe-area-inset-y" : ""
    )}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* This div now manages the main content row (sidebar + scrollable area) */}
      {/* It takes remaining space (flex-1) and hides overflow for its children */}
      <div className="flex flex-1 overflow-hidden"> 
        {/* Sidebar (conditionally rendered) */}
        {isLoggedIn && !isMobileAppUser && (
          // Sidebar takes fixed width, content area takes rest
          <div className="hidden md:block flex-shrink-0 w-64 border-r border-border/40">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
        )}
        
        {/* Make PullToRefresh the main scrollable container */}
        {/* It needs to grow (flex-1) and handle its own vertical scroll */}
        <PullToRefresh 
          onRefresh={handleRefresh}
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
        >
          {/* Main content inside the scrollable container */}
          <main className={cn(
            mainContentClass, 
            isMobileAppUser ? "pt-16" : "" // Keep mobile app top padding
          )}>
            <div className="container py-6 px-4 sm:px-6 max-w-5xl mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </PullToRefresh>
        
      </div> {/* End flex-1 overflow-hidden div */}
      
      {/* Mobile Bottom Navigation - outside the main scroll area */}
      {(isMobile || isMobileAppUser) && isLoggedIn && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;
