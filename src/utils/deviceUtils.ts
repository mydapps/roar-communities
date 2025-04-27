import { deviceInfo as wtnDeviceInfoFn } from "webtonative";

// Define a simple getRandomString function since the import doesn't exist
function getRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Checks if the user agent contains Android app identifiers
 */
export const isAndroidApp = (): boolean => {
  return typeof navigator !== 'undefined' && 
    navigator.userAgent.toLowerCase().includes('android_dapps');
};

/**
 * Checks if the user agent contains iOS app identifiers
 */
export const isIOSApp = (): boolean => {
  return typeof navigator !== 'undefined' && 
    navigator.userAgent.toLowerCase().includes('ios_dapps');
};

/**
 * Check if the current environment is a mobile app based on user agent
 */
export const isMobileApp = (): boolean => {
  return isAndroidApp() || isIOSApp();
};

// Log device information once per session
if (typeof window !== 'undefined' && !(window as any).__deviceInfoInitialized) {
  (window as any).__deviceInfoInitialized = true;
  console.log("DeviceUtils: Initializing device detection");
  
  // Log device detection to console only
  console.log("DeviceUtils: Detection results", {
    isMobileApp: isMobileApp(),
    isAndroidApp: isAndroidApp(),
    isIOSApp: isIOSApp(),
    userAgent: navigator.userAgent
  });
}

// Define the DeviceInfo interface
export interface DeviceInfo {
  appId?: string;
  appVersion?: string;
  appVersionCode?: string | number;
  hardware?: string;
  installationId?: string;
  installationType?: string;
  language?: string;
  model?: string;
  operator?: string;
  os?: string;
  osVersion?: string;
  platform?: string;
  timeZone?: string;
  webContext?: string;
  [key: string]: any;
}

// Global cache to prevent repeated checks
const deviceDetectionCache = {
  isMobileApp: null as boolean | null,
  isAndroid: null as boolean | null,
  isIOS: null as boolean | null,
  deviceInfo: null as DeviceInfo | null,
};

// Helpers for accessing the window object safely
const getWindow = (): Window | undefined => {
  if (typeof window !== "undefined") {
    return window;
  }
  return undefined;
};

/**
 * Check if the current environment is a native mobile app
 * Uses user agent string to determine if running in the mobile app
 */
export const isNativeMobileApp = async (): Promise<boolean> => {
  // Return cached result if available
  if (deviceDetectionCache.isMobileApp !== null) {
    return deviceDetectionCache.isMobileApp;
  }

  try {
    // STEP 1: Check for development testing override
    if (process.env.NODE_ENV === 'development' && isMobileAppParam()) {
      console.log("Device: Using dev mode mobile app override parameter");
      deviceDetectionCache.isMobileApp = true;
      return true;
    }
    
    // STEP 2: Check user agent for mobile app identifiers
    const result = isMobileApp();
    
    // Cache and return the result
    deviceDetectionCache.isMobileApp = result;
    console.log("Device: Mobile app check result:", result);
    
    return result;
  } catch (error) {
    console.error("Error checking if native mobile app:", error);
    
    deviceDetectionCache.isMobileApp = false;
    return false;
  }
};

/**
 * Check if the device is on Android
 */
export const isAndroid = async (): Promise<boolean> => {
  // Return cached result if available
  if (deviceDetectionCache.isAndroid !== null) {
    return deviceDetectionCache.isAndroid;
  }

  try {
    // First determine if it's a mobile app at all
    const mobile = await isNativeMobileApp();
    if (!mobile) {
      deviceDetectionCache.isAndroid = false;
      return false;
    }

    // Check for Android app indicator in user agent
    const result = isAndroidApp();
    
    // Cache the result
    deviceDetectionCache.isAndroid = result;
    console.log("Device: Android check:", result);
    
    return result;
  } catch (error) {
    console.error("Error checking if Android:", error);
    deviceDetectionCache.isAndroid = false;
    return false;
  }
};

/**
 * Check if the device is on iOS
 */
export const isIOS = async (): Promise<boolean> => {
  // Return cached result if available
  if (deviceDetectionCache.isIOS !== null) {
    return deviceDetectionCache.isIOS;
  }

  try {
    // First determine if it's a mobile app at all
    const mobile = await isNativeMobileApp();
    if (!mobile) {
      deviceDetectionCache.isIOS = false;
      return false;
    }

    // Check for iOS app indicator in user agent
    const result = isIOSApp();
    
    // Cache the result
    deviceDetectionCache.isIOS = result;
    console.log("Device: iOS check:", result);
    
    return result;
  } catch (error) {
    console.error("Error checking if iOS:", error);
    deviceDetectionCache.isIOS = false;
    return false;
  }
};

/**
 * Get device information
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  // Return cached result if available
  if (deviceDetectionCache.deviceInfo !== null) {
    return deviceDetectionCache.deviceInfo;
  }

  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let platform = 'web';
    
    // Determine platform based on user agent
    if (isAndroidApp()) {
      platform = 'android';
    } else if (isIOSApp()) {
      platform = 'ios';
    }
    
    const deviceInfo: DeviceInfo = {
      appId: platform === 'web' ? 'web' : 'co.dapps.mobile',
      platform: platform,
      os: userAgent,
      // Generate a session ID if none exists in local storage
      installationId: localStorage.getItem("deviceId") || getRandomString(16),
    };

    // Store the device ID in local storage for persistence
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", deviceInfo.installationId as string);
    }
    
    // Cache the result
    deviceDetectionCache.deviceInfo = deviceInfo;
    console.log("Device: Device info determined:", deviceInfo);
    return deviceInfo;
  } catch (error) {
    console.error("Error getting device info:", error);
    
    // Minimal info as fallback
    const fallbackInfo: DeviceInfo = {
      platform: "web",
      appId: "web",
    };
    deviceDetectionCache.deviceInfo = fallbackInfo;
    return fallbackInfo;
  }
};

/**
 * Reset device detection cache for testing purposes
 */
export const resetDeviceDetectionCache = () => {
  deviceDetectionCache.isMobileApp = null;
  deviceDetectionCache.isAndroid = null;
  deviceDetectionCache.isIOS = null;
  deviceDetectionCache.deviceInfo = null;
};

/**
 * Helper function to check if the URL has a mobileapp=1 parameter (for testing)
 */
export const isMobileAppParam = (): boolean => {
  // Only use this in development mode for testing
  if (process.env.NODE_ENV === 'development') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mobileapp') === '1';
  }
  return false;
};

/**
 * Diagnostic function that returns detailed information about the current environment
 * Useful for debugging device detection issues
 */
export const getDeviceDiagnostics = async (): Promise<Record<string, any>> => {
  try {
    const win = getWindow();
    const deviceInfo = await getDeviceInfo();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      // Device detection results
      isMobileApp: isMobileApp(),
      isAndroidApp: isAndroidApp(),
      isIOSApp: isIOSApp(),
      isMobileAppPromise: deviceDetectionCache.isMobileApp !== null ? 
                   deviceDetectionCache.isMobileApp : 
                   await isNativeMobileApp(),
      isAndroidPromise: deviceDetectionCache.isAndroid !== null ? 
                 deviceDetectionCache.isAndroid : 
                 await isAndroid(),
      isIOSPromise: deviceDetectionCache.isIOS !== null ? 
             deviceDetectionCache.isIOS : 
             await isIOS(),
      // Environment info
      userAgent,
      userAgentLower: userAgent.toLowerCase(),
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
      screenHeight: typeof window !== 'undefined' ? window.innerHeight : 'unknown',
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 'unknown',
      hasTouch: typeof window !== 'undefined' ? 'ontouchstart' in window : 'unknown',
      // Device info
      deviceInfoAvailable: !!deviceInfo,
      deviceInfoSummary: deviceInfo ? {
        platform: deviceInfo.platform,
        appId: deviceInfo.appId,
        hasInstallationId: !!deviceInfo.installationId
      } : 'none'
    };
    
    return diagnostics;
  } catch (error) {
    return {
      error: 'Error generating diagnostics',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get a safe device platform string for logging or display
 * @returns string "android", "ios", or "web"
 */
export const getPlatformType = (): string => {
  if (isAndroidApp()) return "android";
  if (isIOSApp()) return "ios";
  
  // For testing in development: check URL param
  if (isMobileAppParam()) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('platform') === 'ios' ? 'ios' : 'android';
  }
  
  return "web";
};

export default {
  isNativeMobileApp,
  isAndroid,
  isIOS,
  getDeviceInfo,
  isMobileApp,
  isAndroidApp,
  isIOSApp,
}; 