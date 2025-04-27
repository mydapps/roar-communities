import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNativePlatform, setIsNativePlatform] = useState(false);

  useEffect(() => {
    // Check if running on a native platform via Capacitor
    setIsNativePlatform(Capacitor.isNativePlatform());
    
    // Set initial mobile state based on screen width
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Set initial value
    checkIsMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkIsMobile);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return { 
    isMobile, 
    isNativePlatform,
    isIOS: isNativePlatform && Capacitor.getPlatform() === 'ios',
    isAndroid: isNativePlatform && Capacitor.getPlatform() === 'android'
  };
};

export default useIsMobile; 