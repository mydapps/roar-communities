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
    console.log('useDevicePlatform hook initialized');

    // Check for direct window.WTN access which should be present in the app
    const hasWtnObject = typeof window !== 'undefined' && window.WTN !== undefined;
    console.log('Direct check for window.WTN:', hasWtnObject);

    const detectPlatform = async () => {
      try {
        console.log('Starting platform detection...');
        
        // First check if we can directly detect WebToNative bridge (WTN)
        if (hasWtnObject) {
          console.log('WTN object detected directly, assuming mobile app');
          
          // Try to determine platform from WTN if available
          let isAndroidResult = false;
          let isIOSResult = false;

          if (typeof window !== 'undefined') {
            // Check for user agent or platform info to determine OS
            const userAgent = navigator.userAgent.toLowerCase();
            isAndroidResult = userAgent.includes('android');
            isIOSResult = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod');
            
            console.log('Platform detection from user agent:', { 
              userAgent, 
              isAndroid: isAndroidResult, 
              isIOS: isIOSResult 
            });
          }
          
          // Get device info if possible
          let deviceInfoResult = null;
          try {
            deviceInfoResult = await getDeviceInfo();
          } catch (error) {
            console.error('Error getting device info despite WTN presence:', error);
          }
          
          if (isMounted) {
            setState({
              isMobileApp: true,
              isAndroidApp: isAndroidResult,
              isIOSApp: isIOSResult,
              isWebApp: false,
              deviceInfo: deviceInfoResult,
              isLoading: false,
              error: null
            });
            console.log('Platform detection completed via WTN direct check:', { 
              isMobileApp: true,
              isAndroidApp: isAndroidResult,
              isIOSApp: isIOSResult 
            });
          }
          return;
        }
        
        // If no direct WTN detection, fall back to regular detection
        console.log('Falling back to standard platform detection methods');
        
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
        
        console.log('Standard detection results:', {
          mobileApp: mobileAppResult,
          android: androidResult,
          ios: iosResult,
          deviceInfo: deviceInfoResult ? 'Present' : 'Null'
        });

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
          console.log('Platform detection completed via standard methods:', { 
            isMobileApp: mobileAppResult,
            isAndroidApp: androidResult,
            isIOSApp: iosResult 
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