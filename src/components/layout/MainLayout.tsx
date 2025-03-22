
import React from 'react';
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
  
  const handleRefresh = async () => {
    // Simulate a refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force a refresh of the current route
    navigate(0);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>
      <div className="flex flex-1 pt-16"> {/* Added pt-16 to account for fixed navbar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <PullToRefresh 
          onRefresh={handleRefresh}
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
        >
          <main className={isMobile ? "pb-16" : ""}>
            <div className="container py-6 px-4 sm:px-6 max-w-5xl mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </PullToRefresh>
      </div>
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;
