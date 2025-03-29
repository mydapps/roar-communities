
import { useEffect } from 'react';

export const usePreventZoom = () => {
  useEffect(() => {
    // Function to prevent default for touch events that might trigger zoom
    const preventZoom = (e: TouchEvent) => {
      // Prevent zoom when two fingers are used (pinch to zoom)
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Add the event listener with passive: false to allow preventDefault
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('touchstart', preventZoom, { passive: false });

    // Clean up
    return () => {
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchstart', preventZoom);
    };
  }, []);
};
