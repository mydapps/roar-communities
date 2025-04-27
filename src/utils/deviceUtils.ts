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
 * Directly check device info fields to determine if we're in a native app
 * This is the most reliable method as it examines the actual device information
 * @returns Promise<boolean> true if device info contains mobile app indicators
 */
export const hasMobileAppIndicators = async (): Promise<boolean> => {
  try {
    console.log("Checking device info for mobile app indicators...");
    const device = await deviceInfo();
    
    // Log the complete device info for debugging
    console.log("Full device info from webtonative:", device);
    
    // Check for the presence of key fields that only exist in the mobile app
    if (device) {
      // If we have appId and platform is either android or ios, we're definitely in a native app
      const hasAppId = !!device.appId;
      const hasMobilePlatform = device.platform === 'android' || device.platform === 'ios';
      const hasInstallationId = !!device.installationId;
      
      console.log("Mobile app indicators check:", {
        hasAppId,
        hasMobilePlatform,
        hasInstallationId,
        platform: device.platform,
        appId: device.appId
      });
      
      return (hasAppId && hasMobilePlatform) || hasInstallationId;
    }
    
    return false;
  } catch (error) {
    console.log("Error checking for mobile app indicators:", error);
    return false;
  }
};

/**
 * Direct check for the WebToNative bridge in the global window object
 * This is the most reliable way to detect if we're in the native app
 * @returns boolean true if WTN is available, indicating native app environment
 */
export const hasWTNBridge = (): boolean => {
  try {
    // Check if window and WTN property exist
    return typeof window !== 'undefined' && 
           window.WTN !== undefined;
  } catch (error) {
    console.log("Error checking for WTN bridge:", error);
    return false;
  }
};

/**
 * Check if the user is running the app on a native mobile platform
 * @returns Promise<boolean> true if on native mobile app, false if on web
 */
export const isNativeMobileApp = async (): Promise<boolean> => {
  try {
    // NEW: First check deviceInfo for mobile app indicators (most reliable)
    try {
      const hasMobileIndicators = await hasMobileAppIndicators();
      if (hasMobileIndicators) {
        console.log("Mobile app detected via device info indicators");
        return true;
      }
    } catch (indicatorError) {
      console.log("Mobile indicators check failed:", indicatorError);
      // Continue to other detection methods
    }
    
    // Next, direct check for WTN bridge (also reliable)
    if (hasWTNBridge()) {
      console.log("Direct WTN bridge detection succeeded");
      return true;
    }
    
    // For testing in development: check URL param
    if (isMobileAppParam()) {
      console.log("Detected mobile app via URL parameter");
      return true;
    }
    
    // Fallback to webtonative API
    try {
      const device = await deviceInfo();
      const isNative = device && (device.platform === "android" || device.platform === "ios");
      console.log("webtonative deviceInfo detection result:", isNative);
      return isNative;
    } catch (deviceError) {
      console.log("webtonative deviceInfo detection failed:", deviceError);
      // Continue to other detection methods
    }
    
    // Try to detect based on user agent as last resort
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('dappscoapp')) {
      console.log("Detected mobile app via user agent");
      return true;
    }
    
    console.log("All native app detection methods failed");
    return false;
  } catch (error) {
    console.log("Error in isNativeMobileApp:", error);
    
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
    // Try to get device info first with mobile indicator check
    try {
      const device = await deviceInfo();
      if (device && device.platform === "android") {
        console.log("Android detected via deviceInfo platform");
        return true;
      }
    } catch (deviceError) {
      console.log("deviceInfo check failed in isAndroid:", deviceError);
    }
    
    // Next try direct WTN detection
    if (hasWTNBridge()) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroidDetected = userAgent.includes('android');
      if (isAndroidDetected) {
        console.log("Android detected via user agent");
        return true;
      }
    }
    
    // For testing in development: check URL param
    if (isMobileAppParam()) {
      // Default to Android when using the test parameter
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('platform') !== 'ios';
    }
    
    // Final try the deviceInfo method
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
    // Try to get device info first with mobile indicator check
    try {
      const device = await deviceInfo();
      if (device && device.platform === "ios") {
        console.log("iOS detected via deviceInfo platform");
        return true;
      }
    } catch (deviceError) {
      console.log("deviceInfo check failed in isIOS:", deviceError);
    }
    
    // Next try direct WTN detection
    if (hasWTNBridge()) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDetected = userAgent.includes('iphone') || 
                            userAgent.includes('ipad') || 
                            userAgent.includes('ipod');
      if (isIOSDetected) {
        console.log("iOS detected via user agent");
        return true;
      }
    }
    
    // For testing in development: check URL param
    if (isMobileAppParam()) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('platform') === 'ios';
    }
    
    // Final try with the deviceInfo method again
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
    // Try direct deviceInfo call first - most reliable
    try {
      const device = await deviceInfo();
      if (device) {
        // Log full device info for debugging
        console.log("Successfully retrieved device info:", device);
        return device;
      }
    } catch (deviceInfoError) {
      console.log("Direct deviceInfo call failed:", deviceInfoError);
    }
    
    // Try WTN direct detection next
    if (hasWTNBridge()) {
      // If WTN is available but we can't get device info, provide minimal info
      try {
        const device = await deviceInfo();
        if (device) return device;
      } catch (infoError) {
        console.log("WTN available but deviceInfo failed:", infoError);
        
        // Create a minimal device info object based on user agent
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroidDetected = userAgent.includes('android');
        const isIOSDetected = userAgent.includes('iphone') || 
                              userAgent.includes('ipad') || 
                              userAgent.includes('ipod');
        
        // Return minimal device info based on user agent
        return {
          platform: isAndroidDetected ? 'android' : isIOSDetected ? 'ios' : 'unknown',
          os: isAndroidDetected ? 'Android' : isIOSDetected ? 'iOS' : 'Unknown',
          appId: 'com.dapps.roarcommunities',
        };
      }
    }
    
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
    
    // Try standard method one more time
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
    // Try device info first
    try {
      const device = await deviceInfo();
      if (device) {
        if (device.platform === "android") return "android";
        if (device.platform === "ios") return "ios";
      }
    } catch (deviceError) {
      console.log("deviceInfo check failed in getPlatformType:", deviceError);
    }
    
    // Check WTN next
    if (hasWTNBridge()) {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('android')) return "android";
      if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) return "ios";
    }
    
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