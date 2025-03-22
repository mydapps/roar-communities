
import { useState, useEffect } from 'react';
import { isMobile as checkIsMobile } from '@/utils/responsive';

// Constants for breakpoints
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => checkIsMobile());

  useEffect(() => {
    function handleResize() {
      setIsMobile(checkIsMobile());
    }

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Check initially
    handleResize();
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(() => 
    typeof window !== 'undefined' 
      ? window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT
      : false
  );

  useEffect(() => {
    function handleResize() {
      setIsTablet(
        window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT
      );
    }

    window.addEventListener('resize', handleResize);
    
    // Check initially
    handleResize();
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isTablet;
}

export function useResponsive() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(
    typeof window !== 'undefined' 
      ? window.innerWidth < MOBILE_BREAKPOINT 
        ? 'mobile' 
        : window.innerWidth < TABLET_BREAKPOINT 
          ? 'tablet' 
          : 'desktop'
      : 'desktop'
  );

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setDeviceType('mobile');
      } else if (window.innerWidth < TABLET_BREAKPOINT) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    }
    
    window.addEventListener('resize', handleResize);
    
    // Check initially
    handleResize();
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType
  };
}
