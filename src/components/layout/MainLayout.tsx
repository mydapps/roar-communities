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
            <main className={isMobile && !isPostDetailPage ? "pb-16" : ""}>
              <div className="container py-6 px-4 sm:px-6 max-w-5xl mx-auto animate-fade-in">
                <Outlet />
              </div>
            </main>
          </PullToRefresh>
        </div>
      </div>
      
      {/* Only show MobileBottomNav when not on a post detail page */}
      {isMobile && isLoggedIn && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;
