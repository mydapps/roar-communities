import { useEffect, useRef } from 'react';

export const usePreventZoom = () => {
  // Use a ref to track if the event listener is already attached
  const isAttachedRef = useRef(false);
  
  useEffect(() => {
    // Skip if already attached to avoid duplicate listeners
    if (isAttachedRef.current) return;
    
    // More selective prevention - only prevent default for pinch gestures
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // Only prevent on multi-touch (likely zooming)
        // This approach is more performance-friendly
        e.preventDefault();
      }
    };

    // Handle wheel events separately - only prevent ctrl+wheel zoom
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Mark as attached
    isAttachedRef.current = true;

    // Add the event listeners with passive: false to allow preventDefault
    // Only attach to specific elements where zoom should be prevented
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('wheel', preventWheelZoom, { passive: false });

    // Clean up - ensure we remove the listeners
    return () => {
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('wheel', preventWheelZoom);
      isAttachedRef.current = false;
    };
  }, []);
};
