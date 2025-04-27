import { useState, useEffect } from 'react';
import { 
  isNativeMobileApp,
  isAndroid,
  isIOS,
  getDeviceInfo,
  DeviceInfo
} from '@/utils/deviceUtils';

interface DevicePlatformState {
  isMobileApp: boolean;
  isAndroidApp: boolean;
  isIOSApp: boolean;
  isWebApp: boolean;
  deviceInfo: DeviceInfo | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to detect the current device platform and provide detailed device info
 * Automatically handles loading states and errors
 */
export function useDevicePlatform() {
  const [state, setState] = useState<DevicePlatformState>({
    isMobileApp: false,
    isAndroidApp: false,
    isIOSApp: false,
    isWebApp: true,
    deviceInfo: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const detectPlatform = async () => {
      try {
        // Run all checks in parallel for efficiency
        const [
          mobileAppResult,
          androidResult,
          iosResult,
          deviceInfoResult
        ] = await Promise.all([
          isNativeMobileApp(),
          isAndroid(),
          isIOS(),
          getDeviceInfo()
        ]);

        if (isMounted) {
          setState({
            isMobileApp: mobileAppResult,
            isAndroidApp: androidResult,
            isIOSApp: iosResult,
            isWebApp: !mobileAppResult,
            deviceInfo: deviceInfoResult,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error in useDevicePlatform hook:', error);
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Unknown error detecting platform')
          }));
        }
      }
    };

    detectPlatform();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

export default useDevicePlatform; 