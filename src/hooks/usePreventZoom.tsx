import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to prevent pinch-to-zoom gestures on mobile devices
 * This improves the user experience when using the mobile app
 */
export const usePreventZoom = () => {
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    // Only apply this on web platforms since native apps handle this differently
    if (!isNative) {
      // Prevent pinch-to-zoom
      const handleTouchMove = (e: TouchEvent) => {
        // If two or more touches (pinch gesture), prevent default
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      // Only add the event listener in production to allow zooming during development
      if (process.env.NODE_ENV === 'production') {
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
      }
      
      return () => {
        if (process.env.NODE_ENV === 'production') {
          document.removeEventListener('touchmove', handleTouchMove);
        }
      };
    }
  }, []);
};

export default usePreventZoom;
