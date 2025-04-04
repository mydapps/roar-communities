import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      
      {/* Disable zooming on mobile devices */}
      <meta 
        name="viewport" 
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
      />
      
      {children}
    </Helmet>
  );
};

export default ZoomDisabledHelmet; 