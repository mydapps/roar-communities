import React, { createContext, useContext, ReactNode } from 'react';
import useDevicePlatform from '@/hooks/use-device-platform';
import { DeviceInfo } from '@/utils/deviceUtils';

// Define the context shape
interface DeviceContextType {
  isMobileApp: boolean;
  isAndroidApp: boolean;
  isIOSApp: boolean;
  isWebApp: boolean;
  deviceInfo: DeviceInfo | null;
  isLoading: boolean;
  error: Error | null;
}

// Create context with default values
const DeviceContext = createContext<DeviceContextType>({
  isMobileApp: false,
  isAndroidApp: false,
  isIOSApp: false,
  isWebApp: true,
  deviceInfo: null,
  isLoading: true,
  error: null
});

// Provider props type
interface DeviceProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes device information available throughout the app
 */
export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  // Use our custom hook to get device information
  const devicePlatform = useDevicePlatform();
  
  return (
    <DeviceContext.Provider value={devicePlatform}>
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