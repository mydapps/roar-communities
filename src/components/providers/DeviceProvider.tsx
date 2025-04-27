import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import {
  DeviceInfo,
  getDeviceInfo,
  hasWTNBridge,
  isAndroid,
  isIOS,
  isNativeMobileApp,
  hasMobileAppIndicators
} from "@/utils/deviceUtils";

// Define the context shape
interface DeviceContextType {
  isMobileApp: boolean;
  isIOSApp: boolean;
  isAndroidApp: boolean;
  deviceInfo: DeviceInfo | null;
  deviceInfoLoading: boolean;
  isLoading: boolean; // Added for backwards compatibility with existing code
}

// Create context with default values
const DeviceContext = createContext<DeviceContextType>({
  isMobileApp: false,
  isIOSApp: false,
  isAndroidApp: false,
  deviceInfo: null,
  deviceInfoLoading: true,
  isLoading: true
});

// Provider props type
interface DeviceProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes device information available throughout the app
 */
export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [isMobileApp, setIsMobileApp] = useState<boolean>(false);
  const [isIOSApp, setIsIOSApp] = useState<boolean>(false);
  const [isAndroidApp, setIsAndroidApp] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deviceInfoLoading, setDeviceInfoLoading] = useState<boolean>(true);

  // Attempt immediate deviceInfo check on mount
  useEffect(() => {
    const immediateCheck = async () => {
      console.log("DeviceProvider: Attempting immediate deviceInfo check...");
      try {
        // Try to get device info directly - this should work in the native app
        const device = await getDeviceInfo();
        console.log("DeviceProvider: Immediate deviceInfo result:", device);
        
        if (device && (device.platform === "android" || device.platform === "ios")) {
          console.log("DeviceProvider: Found mobile platform in immediate check:", device.platform);
          setIsMobileApp(true);
          setDeviceInfo(device);
          
          if (device.platform === "android") {
            console.log("DeviceProvider: Setting Android app");
            setIsAndroidApp(true);
          }
          
          if (device.platform === "ios") {
            console.log("DeviceProvider: Setting iOS app");
            setIsIOSApp(true);
          }
        }
      } catch (error) {
        console.log("DeviceProvider: Immediate deviceInfo check failed:", error);
        // We'll continue with other detection methods
      }
    };
    
    immediateCheck();
  }, []);

  // Check for direct WTN bridge presence immediately
  useEffect(() => {
    const wtnPresent = hasWTNBridge();
    console.log("DeviceProvider: Initial WTN bridge check:", wtnPresent);
    if (wtnPresent) {
      setIsMobileApp(true);
      
      // If WTN is present, try to determine platform from user agent
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDetected = userAgent.includes('iphone') || 
                          userAgent.includes('ipad') || 
                          userAgent.includes('ipod');
      const isAndroidDetected = userAgent.includes('android');
      
      console.log("DeviceProvider: Quick platform check from user agent:", { 
        isIOSDetected, isAndroidDetected, userAgent 
      });
      
      if (isIOSDetected) setIsIOSApp(true);
      if (isAndroidDetected) setIsAndroidApp(true);
    }
  }, []);

  // Complete device check with all methods
  useEffect(() => {
    const checkDevice = async () => {
      console.log("DeviceProvider: Starting complete device detection...");
      try {
        // First try the new mobile indicators check
        const hasMobileIndicators = await hasMobileAppIndicators();
        console.log("DeviceProvider: hasMobileAppIndicators result:", hasMobileIndicators);
        if (hasMobileIndicators) {
          console.log("DeviceProvider: Mobile indicators found, setting isMobileApp=true");
          setIsMobileApp(true);
        }
        
        // Fallback to the comprehensive check
        if (!hasMobileIndicators) {
          const mobileApp = await isNativeMobileApp();
          console.log("DeviceProvider: isNativeMobileApp detection result:", mobileApp);
          setIsMobileApp(prev => prev || mobileApp);
        }

        // If we've determined this is a mobile app through any method, check platform details
        if (isMobileApp) {
          // Check if running on iOS
          const ios = await isIOS();
          console.log("DeviceProvider: isIOS detection result:", ios);
          setIsIOSApp(ios);

          // Check if running on Android
          const android = await isAndroid();
          console.log("DeviceProvider: isAndroid detection result:", android);
          setIsAndroidApp(android);

          // Get detailed device info
          const deviceInfoResult = await getDeviceInfo();
          console.log("DeviceProvider: getDeviceInfo result:", deviceInfoResult);
          setDeviceInfo(deviceInfoResult);
        }
      } catch (error) {
        console.error("DeviceProvider: Error in complete device detection:", error);
      } finally {
        console.log("DeviceProvider: Complete device detection finished");
        setDeviceInfoLoading(false);
      }
    };

    checkDevice();
  }, [isMobileApp]);

  useEffect(() => {
    // Log complete state after all checks are done
    if (!deviceInfoLoading) {
      console.log("DeviceProvider final state:", {
        isMobileApp,
        isIOSApp,
        isAndroidApp,
        deviceInfo,
        userAgent: navigator.userAgent
      });
    }
  }, [deviceInfoLoading, isMobileApp, isIOSApp, isAndroidApp, deviceInfo]);

  return (
    <DeviceContext.Provider
      value={{
        isMobileApp,
        isIOSApp,
        isAndroidApp,
        deviceInfo,
        deviceInfoLoading,
        isLoading: deviceInfoLoading // Added for backwards compatibility
      }}
    >
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