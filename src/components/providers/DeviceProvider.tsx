import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import {
  DeviceInfo,
  getDeviceInfo,
  isNativeMobileApp,
  isAndroid,
  isIOS,
  isMobileApp,
  isAndroidApp,
  isIOSApp
} from "@/utils/deviceUtils";

// Define the context shape
interface DeviceContextType {
  isMobileApp: boolean;
  isIOSApp: boolean;
  isAndroidApp: boolean;
  deviceInfo: DeviceInfo | null;
  isLoading: boolean;
  detectionComplete: boolean;
}

// Create context with default values
const DeviceContext = createContext<DeviceContextType>({
  isMobileApp: false,
  isIOSApp: false,
  isAndroidApp: false,
  deviceInfo: null,
  isLoading: true,
  detectionComplete: false
});

// Provider props type
interface DeviceProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes device information available throughout the app
 */
export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isMobileAppState, setIsMobileApp] = useState<boolean>(false);
  const [isAndroidAppState, setIsAndroidApp] = useState<boolean>(false);
  const [isIOSAppState, setIsIOSApp] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [detectionComplete, setDetectionComplete] = useState<boolean>(false);

  // Only run device detection once on mount
  useEffect(() => {
    // Prevent running detection again if already complete
    if (detectionComplete) return;

    console.log('DeviceProvider: Running device detection on mount');
    
    const detectDevice = async () => {
      try {
        // Directly check the user agent string for app identifiers
        const mobileAppResult = isMobileApp();
        const isAndroidResult = isAndroidApp();
        const isIOSResult = isIOSApp();
        
        console.log('DeviceProvider: Mobile app check result:', mobileAppResult);
        console.log('DeviceProvider: Platform checks - iOS:', isIOSResult, 'Android:', isAndroidResult);
        console.log('DeviceProvider: User agent:', navigator.userAgent);
        
        // Get device info (now uses the same user agent detection)
        const deviceInfoResult = await getDeviceInfo();
        
        // Update all state at once to avoid multiple renders
        setDeviceInfo(deviceInfoResult);
        setIsMobileApp(mobileAppResult);
        setIsAndroidApp(isAndroidResult);
        setIsIOSApp(isIOSResult);
        setIsLoading(false);
        setDetectionComplete(true);
        
        console.log('DeviceProvider: Device detection complete', {
          isMobileApp: mobileAppResult,
          isAndroidApp: isAndroidResult,
          isIOSApp: isIOSResult,
          deviceInfo: deviceInfoResult
        });
      } catch (error) {
        console.error('DeviceProvider: Error detecting device:', error);
        
        // Even on error, we should stop loading and mark detection as complete
        setIsLoading(false);
        setDetectionComplete(true);
      }
    };
    
    detectDevice();
  }, []); // Empty dependency array ensures this only runs once on mount

  // Context value 
  const contextValue: DeviceContextType = {
    isMobileApp: isMobileAppState,
    isAndroidApp: isAndroidAppState,
    isIOSApp: isIOSAppState,
    deviceInfo,
    isLoading,
    detectionComplete
  };

  // Debug log when values change, but don't include in dependency array
  useEffect(() => {
    console.log('DeviceProvider: Context value updated', {
      isMobileApp: isMobileAppState,
      isAndroidApp: isAndroidAppState,
      isIOSApp: isIOSAppState,
      isLoading,
      deviceInfoExists: !!deviceInfo
    });
  }, [isMobileAppState, isAndroidAppState, isIOSAppState, isLoading, deviceInfo]);

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
};

/**
 * Hook for consuming device context in child components
 */
export const useDevice = () => {
  const context = useContext(DeviceContext);
  
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  
  return context;
};

export default DeviceProvider; 