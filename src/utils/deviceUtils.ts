import { deviceInfo } from "webtonative";

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
}

/**
 * Check if the user is running the app on a native mobile platform
 * @returns Promise<boolean> true if on native mobile app, false if on web
 */
export const isNativeMobileApp = async (): Promise<boolean> => {
  try {
    // For testing in development: check URL param
    if (isMobileAppParam()) {
      return true;
    }
    
    const device = await deviceInfo();
    return device && (device.platform === "android" || device.platform === "ios");
  } catch (error) {
    console.log("Not using a native mobile app or error:", error);
    
    // For testing in development: check URL param as fallback
    return isMobileAppParam();
  }
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
 * Check if the device is running Android
 * @returns Promise<boolean> true if Android, false otherwise
 */
export const isAndroid = async (): Promise<boolean> => {
  try {
    // For testing in development: check URL param
    if (isMobileAppParam()) {
      // Default to Android when using the test parameter
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('platform') !== 'ios';
    }
    
    const device = await deviceInfo();
    return device && device.platform === "android";
  } catch (error) {
    console.log("Not using an Android app or error:", error);
    
    // For testing in development: check URL param as fallback
    if (isMobileAppParam()) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('platform') !== 'ios';
    }
    return false;
  }
};

/**
 * Check if the device is running iOS
 * @returns Promise<boolean> true if iOS, false otherwise
 */
export const isIOS = async (): Promise<boolean> => {
  try {
    // For testing in development: check URL param
    if (isMobileAppParam()) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('platform') === 'ios';
    }
    
    const device = await deviceInfo();
    return device && device.platform === "ios";
  } catch (error) {
    console.log("Not using an iOS app or error:", error);
    
    // For testing in development: check URL param as fallback
    if (isMobileAppParam()) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('platform') === 'ios';
    }
    return false;
  }
};

/**
 * Get detailed device information when running in a native app
 * @returns Promise<DeviceInfo | null> Device information object or null if error/not in native app
 */
export const getDeviceInfo = async (): Promise<DeviceInfo | null> => {
  try {
    // For testing in development: provide mock data if URL param is present
    if (isMobileAppParam()) {
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform') === 'ios' ? 'ios' : 'android';
      
      return {
        platform,
        os: platform === 'ios' ? 'iOS' : 'Android',
        osVersion: platform === 'ios' ? '16.0' : '13',
        model: platform === 'ios' ? 'iPhone 14' : 'Google Pixel 7',
        appId: 'com.dapps.roarcommunities',
        appVersion: '1.0.0',
      };
    }
    
    const device = await deviceInfo();
    return device || null;
  } catch (error) {
    console.log("Error getting device info or not in mobile app:", error);
    
    // For testing in development: provide mock data as fallback
    if (isMobileAppParam()) {
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform') === 'ios' ? 'ios' : 'android';
      
      return {
        platform,
        os: platform === 'ios' ? 'iOS' : 'Android',
        osVersion: platform === 'ios' ? '16.0' : '13',
        model: platform === 'ios' ? 'iPhone 14' : 'Google Pixel 7',
        appId: 'com.dapps.roarcommunities',
        appVersion: '1.0.0',
      };
    }
    
    return null;
  }
};

/**
 * Get a safe device platform string for logging or display
 * @returns Promise<string> "android", "ios", or "web"
 */
export const getPlatformType = async (): Promise<string> => {
  try {
    // For testing in development: check URL param
    if (isMobileAppParam()) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('platform') === 'ios' ? 'ios' : 'android';
    }
    
    const device = await deviceInfo();
    if (!device) return "web";
    
    if (device.platform === "android") return "android";
    if (device.platform === "ios") return "ios";
    
    return "web";
  } catch (error) {
    console.log("Error getting platform type:", error);
    
    // For testing in development: check URL param as fallback
    if (isMobileAppParam()) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('platform') === 'ios' ? 'ios' : 'android';
    }
    
    return "web";
  }
}; 