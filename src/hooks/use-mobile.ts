import { useState, useEffect } from 'react';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to determine if current viewport is mobile-sized
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkIfMobile();

    // Add listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Clean up listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
}

// Add the useResponsive hook for compatibility with existing code
export function useResponsive(): { isMobile: boolean; isTablet: boolean; isDesktop: boolean } {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false, 
    isDesktop: true
  });

  useEffect(() => {
    // Function to determine current viewport size
    const checkScreenSize = () => {
      setScreenSize({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
      });
    };

    // Check on mount
    checkScreenSize();

    // Add listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Clean up listener
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
} 