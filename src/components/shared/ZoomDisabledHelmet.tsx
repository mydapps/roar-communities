import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface ZoomDisabledHelmetProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * A wrapper around Helmet that includes a viewport meta tag to disable zooming
 * This helps prevent UI layout issues on mobile devices
 */
const ZoomDisabledHelmet: React.FC<ZoomDisabledHelmetProps> = ({ 
  title,
  description,
  children 
}) => {
  const location = useLocation();
  const path = location.pathname;
  
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
  
  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      
      {/* Set viewport meta based on current route */}
      <meta 
        name="viewport" 
        content={
          shouldDisableZoom 
            ? "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
            : "width=device-width, initial-scale=1.0"
        }
      />
      
      {children}
    </Helmet>
  );
};

export default ZoomDisabledHelmet; 