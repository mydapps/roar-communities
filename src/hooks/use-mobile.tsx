
import { useState, useEffect } from 'react';
import { isMobile as checkIsMobile } from '@/utils/responsive';

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
