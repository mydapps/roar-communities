import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useDevice } from '@/components/providers/DeviceProvider';

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
  const { isMobileApp, isIOSApp } = useDevice();
  
  // Pages where we want to ensure zoom is disabled
  const noZoomPages = [
    '/feed',
    '/my-shares',
    '/communities',
    '/c/',
    '/',
    '/index'
  ];
  
  // Check if current path matches any of our no-zoom pages
  const shouldDisableZoom = noZoomPages.some(page => 
    path === page || path.startsWith(page)
  );
  
  // Create viewport content string with safe area support
  const getViewportContent = () => {
    // Base content with or without zoom disabled
    const baseContent = shouldDisableZoom 
      ? "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
      : "width=device-width, initial-scale=1.0";
    
    // Always add viewport-fit=cover for mobile app, especially important for iOS
    return isMobileApp ? `${baseContent}, viewport-fit=cover` : baseContent;
  };
  
  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      
      {/* Set viewport meta based on current route and device */}
      <meta 
        name="viewport" 
        content={getViewportContent()}
      />
      
      {/* Add additional meta tag for apple-mobile-web-app-capable for iOS */}
      {isIOSApp && (
        <>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </>
      )}
      
      {children}
    </Helmet>
  );
};

export default ZoomDisabledHelmet; 