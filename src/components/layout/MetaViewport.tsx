import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component to manage viewport meta tags for specific routes
 * This helps ensure zoom is disabled on mobile for specific pages
 */
const MetaViewport: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    // Get the existing viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    // Pages where we want to ensure zoom is disabled
    const noZoomPages = [
      '/feed',
      '/my-shares',
      '/communities',
      '/c/',
    ];
    
    // Check if current path matches any of our no-zoom pages
    const shouldDisableZoom = noZoomPages.some(page => 
      path === page || path.startsWith(page)
    );
    
    if (viewportMeta && shouldDisableZoom) {
      // Make sure zoom is disabled
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    } else if (viewportMeta) {
      // For other pages, use default viewport settings
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0'
      );
    }
    
    // Clean up function not needed since we're not adding new meta tags
  }, [path]);

  // This component doesn't render anything
  return null;
};

export default MetaViewport; 